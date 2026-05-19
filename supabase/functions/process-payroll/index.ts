import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayrollRequest {
  business_id: string
  payroll_period_id: string
  employee_ids?: string[]
}

interface StatutoryBracket {
  deduction_type: string
  min_compensation: number
  max_compensation: number
  employee_share: number
  employer_share: number
}

interface DeductionResult {
  type: string
  name: string
  employee_share: number
  employer_share: number
  amount: number
}

function getCutoffLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate)
  const day = start.getDate()
  return day <= 15 ? 'first' : 'second'
}

function computeSSS(monthlyCompensation: number, brackets: StatutoryBracket[]): { employee: number; employer: number } {
  const bracket = brackets.find(
    b => b.deduction_type === 'sss' && monthlyCompensation >= b.min_compensation && monthlyCompensation <= b.max_compensation
  )
  if (bracket) {
    return { employee: bracket.employee_share, employer: bracket.employer_share }
  }
  const highest = brackets
    .filter(b => b.deduction_type === 'sss')
    .reduce((max, b) => b.employee_share > max.employee_share ? b : max, { employee_share: 0, employer_share: 0 })
  return { employee: highest.employee_share, employer: highest.employer_share }
}

function computePhilHealth(monthlyCompensation: number, brackets: StatutoryBracket[]): { employee: number; employer: number } {
  const bracket = brackets.find(b => b.deduction_type === 'philhealth')
  if (!bracket) return { employee: 0, employer: 0 }
  const totalPremium = Math.min(monthlyCompensation * 0.05, 5000)
  const half = totalPremium / 2
  return { employee: Math.round(half * 100) / 100, employer: Math.round(half * 100) / 100 }
}

function computePagIBIG(monthlyCompensation: number, brackets: StatutoryBracket[]): { employee: number; employer: number } {
  const bracket = brackets.find(
    b => b.deduction_type === 'pagibig' && monthlyCompensation >= b.min_compensation && monthlyCompensation <= b.max_compensation
  )
  if (!bracket) return { employee: 0, employer: 0 }
  const employeeShare = Math.min(monthlyCompensation * bracket.employee_share, 100)
  const employerShare = monthlyCompensation * bracket.employer_share
  return { employee: Math.round(employeeShare * 100) / 100, employer: Math.round(employerShare * 100) / 100 }
}

function computeWithholdingTax(taxableIncome: number, brackets: StatutoryBracket[]): number {
  const bracket = brackets.find(
    b => b.deduction_type === 'withholding_tax' && taxableIncome >= b.min_compensation && taxableIncome <= b.max_compensation
  )
  if (!bracket || bracket.employee_share === 0) return 0
  const rate = bracket.employee_share
  if (bracket.min_compensation > 0) {
    const excess = taxableIncome - bracket.min_compensation
    return Math.round(excess * rate * 100) / 100
  }
  return Math.round(taxableIncome * rate * 100) / 100
}

function computeStatutoryDeductions(
  monthlyCompensation: number,
  brackets: StatutoryBracket[],
  cutoffLabel: string,
  companyConfig: { sss: boolean; philhealth: boolean; pagibig: boolean },
  employeeOverrides: Map<string, { employee_share: number; employer_share: number }>
): DeductionResult[] {
  const results: DeductionResult[] = []

  if (companyConfig.sss) {
    const override = employeeOverrides.get('sss')
    const sss = override || computeSSS(monthlyCompensation, brackets)
    results.push({
      type: 'sss',
      name: 'SSS Contribution',
      employee_share: sss.employee,
      employer_share: sss.employer,
      amount: sss.employee,
    })
  }

  if (companyConfig.philhealth) {
    const override = employeeOverrides.get('philhealth')
    const philhealth = override || computePhilHealth(monthlyCompensation, brackets)
    results.push({
      type: 'philhealth',
      name: 'PhilHealth Contribution',
      employee_share: philhealth.employee,
      employer_share: philhealth.employer,
      amount: philhealth.employee,
    })
  }

  if (companyConfig.pagibig) {
    const override = employeeOverrides.get('pagibig')
    const pagibig = override || computePagIBIG(monthlyCompensation, brackets)
    results.push({
      type: 'pagibig',
      name: 'Pag-IBIG Contribution',
      employee_share: pagibig.employee,
      employer_share: pagibig.employer,
      amount: pagibig.employee,
    })
  }

  return results
}

serve(async (req) => {
  console.log('[process-payroll] Function invoked')

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('[process-payroll] No authorization header')
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // Authenticated client for user-specific data
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Service role client for reading default brackets (bypasses RLS)
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const payload: PayrollRequest = await req.json()
    console.log('[process-payroll] Request payload:', {
      business_id: payload.business_id,
      payroll_period_id: payload.payroll_period_id,
      employee_count: payload.employee_ids?.length || 'all'
    })

    // Get payroll period
    const { data: period, error: periodError } = await supabaseClient
      .from('hr_payroll_periods')
      .select('*')
      .eq('id', payload.payroll_period_id)
      .single()

    if (periodError || !period) {
      console.error('[process-payroll] Payroll period not found:', periodError)
      return new Response(JSON.stringify({ error: 'Payroll period not found' }), { status: 404, headers: corsHeaders })
    }

    if (period.is_closed) {
      console.error('[process-payroll] Payroll period is already closed')
      return new Response(JSON.stringify({ error: 'Payroll period is already closed' }), { status: 400, headers: corsHeaders })
    }

    // Get company config (optional — defaults apply if not set up)
    const { data: company } = await supabaseClient
      .from('hr_company')
      .select('*')
      .eq('business_id', payload.business_id)
      .maybeSingle()

    const cutoffLabel = getCutoffLabel(period.start_date, period.end_date)
    const companyConfig = {
      sss: cutoffLabel === 'first'
        ? (company?.sss_on_first_cutoff ?? true)
        : (company?.sss_on_second_cutoff ?? true),
      philhealth: cutoffLabel === 'first'
        ? (company?.philhealth_on_first_cutoff ?? true)
        : (company?.philhealth_on_second_cutoff ?? true),
      pagibig: cutoffLabel === 'first'
        ? (company?.pagibig_on_first_cutoff ?? true)
        : (company?.pagibig_on_second_cutoff ?? true),
    }

    // Get active employees
    let query = supabaseClient
      .from('hr_employees')
      .select('*')
      .eq('business_id', payload.business_id)
      .eq('is_active', true)

    if (payload.employee_ids && payload.employee_ids.length > 0) {
      query = query.in('id', payload.employee_ids)
    }

    const { data: employees, error: empError } = await query

    if (empError) {
      console.error('[process-payroll] Error fetching employees:', empError)
      return new Response(JSON.stringify({ error: 'Failed to fetch employees' }), { status: 500, headers: corsHeaders })
    }

    if (!employees || employees.length === 0) {
      console.log('[process-payroll] No active employees found')
      return new Response(JSON.stringify({ message: 'No employees to process', payslips: [] }), { headers: corsHeaders })
    }

    console.log(`[process-payroll] Processing ${employees.length} employees`)

    // Get statutory brackets — use service role to read default brackets (bypasses RLS)
    const { data: brackets } = await serviceClient
      .from('hr_statutory_brackets')
      .select('*')
      .eq('business_id', payload.business_id)
      .eq('is_active', true)

    const { data: defaultBrackets } = await serviceClient
      .from('hr_statutory_brackets')
      .select('*')
      .eq('business_id', '00000000-0000-0000-0000-000000000000')
      .eq('is_active', true)

    const allBrackets = [...(brackets || []), ...(defaultBrackets || [])]
    console.log(`[process-payroll] Loaded ${allBrackets.length} statutory brackets (${brackets?.length || 0} company-specific, ${defaultBrackets?.length || 0} default)`)

    // Get employee deduction overrides
    const employeeIds = employees.map(e => e.id)
    const { data: empDeductions } = await supabaseClient
      .from('hr_employee_deductions')
      .select('*')
      .in('employee_id', employeeIds)
      .eq('is_overridden', true)

    const deductionOverrides = new Map<string, Map<string, { employee_share: number; employer_share: number }>>()
    if (empDeductions) {
      for (const ded of empDeductions) {
        if (!deductionOverrides.has(ded.employee_id)) {
          deductionOverrides.set(ded.employee_id, new Map())
        }
        deductionOverrides.get(ded.employee_id)!.set(ded.deduction_type, {
          employee_share: ded.employee_share || 0,
          employer_share: ded.employer_share || 0,
        })
      }
    }

    // Get attendance for the period
    const { data: attendance } = await supabaseClient
      .from('hr_attendance_logs')
      .select('*')
      .in('employee_id', employeeIds)
      .gte('date', period.start_date)
      .lte('date', period.end_date)

    // Get approved leaves for the period
    const { data: leaves } = await supabaseClient
      .from('hr_leave_requests')
      .select('*')
      .in('employee_id', employeeIds)
      .gte('start_date', period.start_date)
      .lte('end_date', period.end_date)
      .eq('status', 'approved')

    // Get employee schedules
    const { data: schedules } = await supabaseClient
      .from('hr_employee_schedules')
      .select('*')
      .in('employee_id', employeeIds)

    const payslips: any[] = []

    for (const employee of employees) {
      console.log(`[process-payroll] Processing employee: ${employee.first_name} ${employee.last_name} (${employee.id})`)

      const empAttendance = (attendance || []).filter(a => a.employee_id === employee.id)
      const empLeaves = (leaves || []).filter(l => l.employee_id === employee.id)
      const empSchedules = (schedules || []).filter(s => s.employee_id === employee.id)

      const totalDaysWorked = empAttendance.filter(a => a.status === 'present').length
      const totalHalfDays = empAttendance.filter(a => a.status === 'half_day').length
      const totalAbsences = empAttendance.filter(a => a.status === 'absent').length
      const totalLeaveDays = empLeaves.reduce((sum, l) => sum + Number(l.days_taken), 0)

      // Compute tardiness
      let totalTardinessMinutes = 0
      for (const att of empAttendance) {
        if (att.time_in && att.status === 'present') {
          const schedule = empSchedules.find(s => s.day_of_week === new Date(att.date + 'T00:00:00').getDay())
          if (schedule && !schedule.is_rest_day) {
            const [sh, sm] = schedule.start_time.split(':').map(Number)
            const [ah, am] = att.time_in.split(':').map(Number)
            const scheduledMinutes = sh * 60 + sm
            const actualMinutes = ah * 60 + am
            if (actualMinutes > scheduledMinutes) {
              totalTardinessMinutes += (actualMinutes - scheduledMinutes)
            }
          }
        }
      }

      // Compute hours worked
      let totalHoursWorked = 0
      for (const att of empAttendance) {
        if (att.time_in && att.time_out && att.status === 'present') {
          const [ih, im] = att.time_in.split(':').map(Number)
          const [oh, om] = att.time_out.split(':').map(Number)
          totalHoursWorked += Math.max(0, (oh + om / 60) - (ih + im / 60))
        }
      }
      totalHoursWorked += totalHalfDays * 4

      // Compute gross pay
      const dailyRate = Number(employee.daily_rate) || 0
      const hourlyRate = Number(employee.hourly_rate) || (dailyRate / 8)
      const basicSalary = Number(employee.basic_salary) || 0

      let grossPay = 0
      if (basicSalary > 0) {
        const totalWorkingDays = totalDaysWorked + totalHalfDays * 0.5 + totalLeaveDays
        grossPay = (basicSalary / 30) * totalWorkingDays
      } else if (dailyRate > 0) {
        grossPay = dailyRate * (totalDaysWorked + totalHalfDays * 0.5 + totalLeaveDays)
      } else {
        grossPay = hourlyRate * totalHoursWorked
      }

      // Deduct tardiness
      if (hourlyRate > 0 && totalTardinessMinutes > 0) {
        grossPay = Math.max(0, grossPay - (hourlyRate / 60) * totalTardinessMinutes)
      }

      // Deduct absences
      if (dailyRate > 0 && totalAbsences > 0) {
        grossPay = Math.max(0, grossPay - dailyRate * totalAbsences)
      }

      grossPay = Math.round(grossPay * 100) / 100

      // Monthly compensation for statutory deductions
      const totalDays = totalDaysWorked + totalHalfDays * 0.5 + totalLeaveDays
      const monthlyCompensation = basicSalary > 0
        ? basicSalary
        : (totalDays > 0 ? grossPay * 30 / totalDays : grossPay)

      // Compute statutory deductions
      const overrides = deductionOverrides.get(employee.id) || new Map()
      const statutoryDeductions = computeStatutoryDeductions(
        monthlyCompensation,
        allBrackets,
        cutoffLabel,
        companyConfig,
        overrides
      )

      // Compute withholding tax on taxable income
      const totalStatutory = statutoryDeductions.reduce((sum, d) => sum + d.amount, 0)
      const taxableIncome = Math.max(0, grossPay - totalStatutory)
      const monthlyTaxable = totalDays > 0 ? taxableIncome * 30 / totalDays : taxableIncome
      const withholdingTax = computeWithholdingTax(monthlyTaxable, allBrackets)

      if (withholdingTax > 0) {
        statutoryDeductions.push({
          type: 'withholding_tax',
          name: 'Withholding Tax',
          employee_share: withholdingTax,
          employer_share: 0,
          amount: withholdingTax,
        })
      }

      const totalDeductions = statutoryDeductions.reduce((sum, d) => sum + d.amount, 0)
      const netPay = Math.max(0, grossPay - totalDeductions)

      // Upsert payslip
      const payslipData = {
        business_id: payload.business_id,
        employee_id: employee.id,
        payroll_period_id: payload.payroll_period_id,
        daily_rate: dailyRate,
        total_days_worked: totalDaysWorked + totalHalfDays * 0.5,
        total_hours_worked: Math.round(totalHoursWorked * 100) / 100,
        total_tardiness_minutes: totalTardinessMinutes,
        total_absences: totalAbsences,
        total_leave_days: totalLeaveDays,
        gross_pay: grossPay,
        total_deductions: Math.round(totalDeductions * 100) / 100,
        net_pay: Math.round(netPay * 100) / 100,
        deductions_breakdown: statutoryDeductions,
        status: 'draft',
      }

      const { data: payslip, error: payslipError } = await supabaseClient
        .from('hr_payslips')
        .upsert(payslipData, { onConflict: 'employee_id,payroll_period_id' })
        .select()
        .single()

      if (payslipError) {
        console.error(`[process-payroll] Error upserting payslip for ${employee.first_name} ${employee.last_name}:`, payslipError)
      } else {
        console.log(`[process-payroll] Payslip created for ${employee.first_name} ${employee.last_name}: gross=${grossPay}, deductions=${totalDeductions}, net=${netPay}`)
        payslips.push(payslip)
      }
    }

    console.log(`[process-payroll] Completed processing ${payslips.length} payslips`)

    return new Response(
      JSON.stringify({
        message: `Processed ${payslips.length} payslips`,
        payslips_count: payslips.length,
        payslips,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[process-payroll] Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: corsHeaders }
    )
  }
})

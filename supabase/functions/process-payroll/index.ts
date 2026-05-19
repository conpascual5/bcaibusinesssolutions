import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PayrollRequest {
  business_id: string
  payroll_period_id: string
  employee_ids?: string[] // optional: process specific employees only
}

interface EmployeeData {
  id: string
  first_name: string
  last_name: string
  daily_rate: number
  basic_salary: number
  hourly_rate: number
  sss_number: string | null
  philhealth_number: string | null
  pagibig_number: string | null
  tin_number: string | null
}

interface AttendanceSummary {
  total_days_worked: number
  total_hours_worked: number
  total_tardiness_minutes: number
  total_absences: number
  total_leave_days: number
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

interface CompanyConfig {
  sss_on_first_cutoff: boolean
  sss_on_second_cutoff: boolean
  philhealth_on_first_cutoff: boolean
  philhealth_on_second_cutoff: boolean
  pagibig_on_first_cutoff: boolean
  pagibig_on_second_cutoff: boolean
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
  // Fallback: highest bracket
  const highest = brackets.filter(b => b.deduction_type === 'sss').reduce((max, b) => b.employee_share > max.employee_share ? b : max, { employee_share: 0, employer_share: 0 })
  return { employee: highest.employee_share, employer: highest.employer_share }
}

function computePhilHealth(monthlyCompensation: number, brackets: StatutoryBracket[]): { employee: number; employer: number } {
  // PhilHealth 2025: 5% total premium, 50/50 split, capped at ₱5,000 monthly premium
  const bracket = brackets.find(b => b.deduction_type === 'philhealth')
  if (!bracket) return { employee: 0, employer: 0 }
  
  const totalPremium = Math.min(monthlyCompensation * 0.05, 5000)
  const half = totalPremium / 2
  return { employee: Math.round(half * 100) / 100, employer: Math.round(half * 100) / 100 }
}

function computePagIBIG(monthlyCompensation: number, brackets: StatutoryBracket[]): { employee: number; employer: number } {
  // Pag-IBIG 2025: 2% of monthly comp, max ₱100 employee share
  const bracket = brackets.find(
    b => b.deduction_type === 'pagibig' && monthlyCompensation >= b.min_compensation && monthlyCompensation <= b.max_compensation
  )
  if (!bracket) return { employee: 0, employer: 0 }
  
  const employeeShare = Math.min(monthlyCompensation * bracket.employee_share, 100)
  const employerShare = monthlyCompensation * bracket.employer_share
  return { employee: Math.round(employeeShare * 100) / 100, employer: Math.round(employerShare * 100) / 100 }
}

function computeWithholdingTax(taxableIncome: number, brackets: StatutoryBracket[]): number {
  // BIR 2025 graduated withholding tax
  const bracket = brackets.find(
    b => b.deduction_type === 'withholding_tax' && taxableIncome >= b.min_compensation && taxableIncome <= b.max_compensation
  )
  if (!bracket) return 0
  
  if (bracket.employee_share === 0) return 0
  
  // For brackets with a rate (employee_share stores the rate as decimal)
  const rate = bracket.employee_share
  const baseTax = taxableIncome * rate
  
  // Apply the fixed tax amounts from the bracket
  // For simplicity, we use the rate directly on taxable income above the bracket floor
  if (bracket.min_compensation > 0) {
    const excess = taxableIncome - bracket.min_compensation
    return Math.round(excess * rate * 100) / 100
  }
  
  return Math.round(baseTax * 100) / 100
}

function computeStatutoryDeductions(
  monthlyCompensation: number,
  brackets: StatutoryBracket[],
  cutoffLabel: string,
  companyConfig: CompanyConfig,
  employeeOverrides: Map<string, { employee_share: number; employer_share: number }>
): DeductionResult[] {
  const results: DeductionResult[] = []
  
  // SSS
  const applySSS = cutoffLabel === 'first' ? companyConfig.sss_on_first_cutoff : companyConfig.sss_on_second_cutoff
  if (applySSS) {
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
  
  // PhilHealth
  const applyPhilHealth = cutoffLabel === 'first' ? companyConfig.philhealth_on_first_cutoff : companyConfig.philhealth_on_second_cutoff
  if (applyPhilHealth) {
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
  
  // Pag-IBIG
  const applyPagIBIG = cutoffLabel === 'first' ? companyConfig.pagibig_on_first_cutoff : companyConfig.pagibig_on_second_cutoff
  if (applyPagIBIG) {
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const payload: PayrollRequest = await req.json()
    console.log('[process-payroll] Request payload:', { business_id: payload.business_id, payroll_period_id: payload.payroll_period_id, employee_count: payload.employee_ids?.length || 'all' })

    // Validate business_id
    const { data: company, error: companyError } = await supabaseClient
      .from('hr_company')
      .select('*')
      .eq('business_id', payload.business_id)
      .single()

    if (companyError || !company) {
      console.error('[process-payroll] Company not found:', companyError)
      return new Response(JSON.stringify({ error: 'Company not found' }), { status: 404, headers: corsHeaders })
    }

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

    // Get statutory brackets
    const { data: brackets, error: bracketsError } = await supabaseClient
      .from('hr_statutory_brackets')
      .select('*')
      .eq('business_id', payload.business_id)
      .eq('is_active', true)

    if (bracketsError) {
      console.error('[process-payroll] Error fetching statutory brackets:', bracketsError)
      return new Response(JSON.stringify({ error: 'Failed to fetch statutory brackets' }), { status: 500, headers: corsHeaders })
    }

    // Also get default brackets (business_id = '00000000-0000-0000-0000-000000000000')
    const { data: defaultBrackets } = await supabaseClient
      .from('hr_statutory_brackets')
      .select('*')
      .eq('business_id', '00000000-0000-0000-0000-000000000000')
      .eq('is_active', true)

    const allBrackets = [...(brackets || []), ...(defaultBrackets || [])]

    // Get employee deduction overrides
    const employeeIds = employees.map(e => e.id)
    const { data: empDeductions } = await supabaseClient
      .from('hr_employee_deductions')
      .select('*')
      .in('employee_id', employeeIds)

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
      .from('hr_attendance')
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

    const companyConfig: CompanyConfig = {
      sss_on_first_cutoff: company.sss_on_first_cutoff ?? true,
      sss_on_second_cutoff: company.sss_on_second_cutoff ?? true,
      philhealth_on_first_cutoff: company.philhealth_on_first_cutoff ?? true,
      philhealth_on_second_cutoff: company.philhealth_on_second_cutoff ?? true,
      pagibig_on_first_cutoff: company.pagibig_on_first_cutoff ?? true,
      pagibig_on_second_cutoff: company.pagibig_on_second_cutoff ?? true,
    }

    const cutoffLabel = getCutoffLabel(period.start_date, period.end_date)
    const payslips: any[] = []

    for (const employee of employees) {
      console.log(`[process-payroll] Processing employee: ${employee.first_name} ${employee.last_name} (${employee.id})`)

      // Compute attendance summary
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
            const scheduledStart = schedule.start_time
            const [sh, sm] = scheduledStart.split(':').map(Number)
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
          const hoursIn = ih + im / 60
          const hoursOut = oh + om / 60
          totalHoursWorked += Math.max(0, hoursOut - hoursIn)
        }
      }
      totalHoursWorked += totalHalfDays * 4 // half day = 4 hours

      // Compute gross pay
      const dailyRate = Number(employee.daily_rate) || 0
      const hourlyRate = Number(employee.hourly_rate) || (dailyRate / 8)
      const basicSalary = Number(employee.basic_salary) || 0

      let grossPay = 0
      if (basicSalary > 0) {
        // For monthly salary, compute based on days worked
        const totalWorkingDays = totalDaysWorked + totalHalfDays * 0.5 + totalLeaveDays
        const daysInPeriod = Math.ceil((new Date(period.end_date).getTime() - new Date(period.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1
        grossPay = (basicSalary / 30) * totalWorkingDays
      } else if (dailyRate > 0) {
        grossPay = dailyRate * (totalDaysWorked + totalHalfDays * 0.5 + totalLeaveDays)
      } else {
        grossPay = hourlyRate * totalHoursWorked
      }

      // Deduct tardiness
      if (hourlyRate > 0 && totalTardinessMinutes > 0) {
        const tardinessDeduction = (hourlyRate / 60) * totalTardinessMinutes
        grossPay = Math.max(0, grossPay - tardinessDeduction)
      }

      // Deduct absences
      if (dailyRate > 0 && totalAbsences > 0) {
        grossPay = Math.max(0, grossPay - (dailyRate * totalAbsences))
      }

      grossPay = Math.round(grossPay * 100) / 100

      // Compute monthly compensation for statutory deductions
      const monthlyCompensation = basicSalary > 0 ? basicSalary : (grossPay * 30 / Math.max(1, totalDaysWorked + totalHalfDays * 0.5 + totalLeaveDays))

      // Compute statutory deductions
      const overrides = deductionOverrides.get(employee.id) || new Map()
      const statutoryDeductions = computeStatutoryDeductions(
        monthlyCompensation,
        allBrackets,
        cutoffLabel,
        companyConfig,
        overrides
      )

      // Compute withholding tax on taxable income (gross pay - statutory deductions)
      const totalStatutory = statutoryDeductions.reduce((sum, d) => sum + d.amount, 0)
      const taxableIncome = Math.max(0, grossPay - totalStatutory)
      const withholdingTax = computeWithholdingTax(taxableIncome * 30 / Math.max(1, totalDaysWorked + totalHalfDays * 0.5 + totalLeaveDays), allBrackets)

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

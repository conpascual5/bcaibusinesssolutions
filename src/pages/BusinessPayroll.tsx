import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/integrations/supabase/client"
import PayrollDashboard from "@/components/payroll/PayrollDashboard"
import PayrollPeriodManager from "@/components/payroll/PayrollPeriodManager"
import DeductionManager from "@/components/payroll/DeductionManager"
import PayslipViewer from "@/components/payroll/PayslipViewer"
import ScheduleManager from "@/components/payroll/ScheduleManager"
import AttendanceLogger from "@/components/payroll/AttendanceLogger"
import { StatutoryBracketManager } from "@/components/payroll/StatutoryBracketManager"
import { EmployeeDeductionOverrides } from "@/components/payroll/EmployeeDeductionOverrides"
import { AutoPayrollRunner } from "@/components/payroll/AutoPayrollRunner"
import { LayoutDashboard, Calendar, Receipt, Clock, Calculator, Shield, Play, FileSpreadsheet, UserCheck } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Types used by child components
export interface Employee {
  id: string
  business_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  position: string | null
  department: string | null
  hire_date: string
  resignation_date: string | null
  is_active: boolean
  gender: string | null
  notes: string | null
  daily_rate: number
  basic_salary: number
  hourly_rate: number
  sss_number: string | null
  philhealth_number: string | null
  pagibig_number: string | null
  tin_number: string | null
  created_at: string
  updated_at: string
}

export interface PayrollPeriod {
  id: string
  business_id: string
  name: string
  start_date: string
  end_date: string
  pay_date: string | null
  is_closed: boolean
  created_at: string
}

export interface Payslip {
  id: string
  business_id: string
  employee_id: string
  payroll_period_id: string
  daily_rate: number
  total_days_worked: number
  total_hours_worked: number
  total_tardiness_minutes: number
  total_absences: number
  total_leave_days: number
  gross_pay: number
  total_deductions: number
  net_pay: number
  deductions_breakdown: any
  status: string
  created_at: string
}

export interface Deduction {
  id: string
  business_id: string
  name: string
  code: string
  description: string | null
  amount_type: string
  amount: number
  is_mandatory: boolean
  is_active: boolean
  created_at: string
}

export interface Attendance {
  id: string
  employee_id: string
  date: string
  time_in: string | null
  time_out: string | null
  status: string
  leave_request_id: string | null
  notes: string | null
  created_at: string
}

export interface Schedule {
  id: string
  employee_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_rest_day: boolean
  created_at: string
}

export const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default function BusinessPayroll() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [businessOwnerId, setBusinessOwnerId] = useState<string | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([])
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const { toast } = useToast()

  const refreshAll = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return
    setBusinessOwnerId(userData.user.id)

    const [empRes, periodRes, payslipRes, dedRes, attRes, schedRes] = await Promise.all([
      supabase.from("hr_employees").select("*").eq("business_id", userData.user.id),
      supabase.from("hr_payroll_periods").select("*").eq("business_id", userData.user.id).order("start_date", { ascending: false }),
      supabase.from("hr_payslips").select("*").eq("business_id", userData.user.id),
      supabase.from("hr_deductions").select("*").eq("business_id", userData.user.id),
      supabase.from("hr_attendance").select("*"),
      supabase.from("hr_employee_schedules").select("*"),
    ])

    if (empRes.data) setEmployees(empRes.data)
    if (periodRes.data) setPayrollPeriods(periodRes.data)
    if (payslipRes.data) setPayslips(payslipRes.data)
    if (dedRes.data) setDeductions(dedRes.data)
    if (attRes.data) setAttendance(attRes.data)
    if (schedRes.data) setSchedules(schedRes.data)
  }, [])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const getEmployee = useCallback((id: string) => employees.find(e => e.id === id), [employees])

  const fmtCurrency = useCallback((n: number) => {
    return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(n)
  }, [])

  const handleGeneratePayslips = useCallback(async (periodId: string) => {
    const period = payrollPeriods.find(p => p.id === periodId)
    if (!period || !businessOwnerId) return

    try {
      const { data: session } = await supabase.auth.getSession()
      const token = session?.session?.access_token
      if (!token) {
        toast({ title: "Error", description: "Not authenticated", variant: "destructive" })
        return
      }

      const res = await fetch(
        "https://dkatgjtvhitknghvaxxn.supabase.co/functions/v1/process-payroll",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            business_id: businessOwnerId,
            payroll_period_id: periodId,
          }),
        }
      )

      const result = await res.json()
      if (!res.ok) {
        toast({ title: "Error", description: result.error || "Failed to generate payslips", variant: "destructive" })
        return
      }

      toast({
        title: "Payslips Generated",
        description: `Generated ${result.payslips_count} payslips with statutory deductions`,
      })
      refreshAll()
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate payslips", variant: "destructive" })
    }
  }, [payrollPeriods, businessOwnerId, toast, refreshAll])

  const updatePayslipStatus = useCallback(async (id: string, status: string) => {
    const { error } = await supabase.from("hr_payslips").update({ status }).eq("id", id)
    if (error) {
      toast({ title: "Error", description: "Failed to update payslip status", variant: "destructive" })
      return
    }
    toast({ title: "Status Updated", description: `Payslip marked as ${status}` })
    refreshAll()
  }, [toast, refreshAll])

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Payroll Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage employee payroll, statutory deductions, and automated payroll processing
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-2">
          <TabsList className="inline-flex h-auto p-1 gap-1 flex-nowrap">
            <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="periods" className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Periods</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="schedules" className="flex items-center gap-1.5">
              <UserCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Schedules</span>
            </TabsTrigger>
            <TabsTrigger value="auto-payroll" className="flex items-center gap-1.5">
              <Play className="h-4 w-4" />
              <span className="hidden sm:inline">Auto Payroll</span>
            </TabsTrigger>
            <TabsTrigger value="payslips" className="flex items-center gap-1.5">
              <Receipt className="h-4 w-4" />
              <span className="hidden sm:inline">Payslips</span>
            </TabsTrigger>
            <TabsTrigger value="deductions" className="flex items-center gap-1.5">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Deductions</span>
            </TabsTrigger>
            <TabsTrigger value="statutory" className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Statutory</span>
            </TabsTrigger>
            <TabsTrigger value="overrides" className="flex items-center gap-1.5">
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Overrides</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard">
          <PayrollDashboard
            employees={employees}
            payrollPeriods={payrollPeriods}
            payslips={payslips}
            deductions={deductions}
            onGenerate={handleGeneratePayslips}
            getEmployee={getEmployee}
            fmtCurrency={fmtCurrency}
          />
        </TabsContent>

        <TabsContent value="periods">
          <PayrollPeriodManager
            businessOwnerId={businessOwnerId}
            payrollPeriods={payrollPeriods}
            onRefresh={refreshAll}
          />
        </TabsContent>

        <TabsContent value="attendance">
          <AttendanceLogger
            employees={employees}
            attendance={attendance}
            payrollPeriods={payrollPeriods}
            onRefresh={refreshAll}
            getEmployee={getEmployee}
          />
        </TabsContent>

        <TabsContent value="schedules">
          <ScheduleManager
            employees={employees}
            schedules={schedules}
            onRefresh={refreshAll}
            getEmployee={getEmployee}
          />
        </TabsContent>

        <TabsContent value="auto-payroll" className="space-y-6">
          <AutoPayrollRunner />
        </TabsContent>

        <TabsContent value="payslips">
          <PayslipViewer
            payslips={payslips}
            payrollPeriods={payrollPeriods}
            employees={employees}
            getEmployee={getEmployee}
            updateStatus={updatePayslipStatus}
            fmtCurrency={fmtCurrency}
          />
        </TabsContent>

        <TabsContent value="deductions">
          <DeductionManager
            businessOwnerId={businessOwnerId}
            deductions={deductions}
            onRefresh={refreshAll}
          />
        </TabsContent>

        <TabsContent value="statutory">
          <StatutoryBracketManager />
        </TabsContent>

        <TabsContent value="overrides">
          <EmployeeDeductionOverrides />
        </TabsContent>
      </Tabs>
    </div>
  )
}

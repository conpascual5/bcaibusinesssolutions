import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
import PayrollDashboard from "@/components/payroll/PayrollDashboard";
import ScheduleManager from "@/components/payroll/ScheduleManager";
import AttendanceLogger from "@/components/payroll/AttendanceLogger";
import PayrollPeriodManager from "@/components/payroll/PayrollPeriodManager";
import DeductionManager from "@/components/payroll/DeductionManager";
import PayslipViewer from "@/components/payroll/PayslipViewer";

export type Employee = {
  id: string; first_name: string; last_name: string; is_active: boolean;
  daily_rate: number; basic_salary: number; hire_date: string; resignation_date: string | null;
  sss_number: string | null; philhealth_number: string | null; pagibig_number: string | null; tin_number: string | null;
};
export type Schedule = { id: string; employee_id: string; day_of_week: number; start_time: string; end_time: string; is_rest_day: boolean };
export type Attendance = { id: string; employee_id: string; date: string; time_in: string | null; time_out: string | null; status: string; leave_request_id: string | null; notes: string | null };
export type PayrollPeriod = { id: string; business_id: string; name: string; start_date: string; end_date: string; pay_date: string | null; is_closed: boolean };
export type Deduction = { id: string; business_id: string; name: string; code: string; description: string | null; amount_type: string; amount: number; is_mandatory: boolean; is_active: boolean };
export type Payslip = {
  id: string; employee_id: string; payroll_period_id: string; daily_rate: number;
  total_days_worked: number; total_hours_worked: number; total_tardiness_minutes: number;
  total_absences: number; total_leave_days: number; gross_pay: number;
  total_deductions: number; net_pay: number; deductions_breakdown: any; status: string;
};

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function BusinessPayroll() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "schedules" | "attendance" | "periods" | "deductions" | "payslips">("dashboard");

  const loadData = async () => {
    if (!businessOwnerId) return;
    const [empRes, schedRes, attRes, periodRes, dedRes, payslipRes] = await Promise.all([
      supabase.from("hr_employees").select("*").eq("business_id", businessOwnerId).order("last_name"),
      supabase.from("hr_employee_schedules").select("*"),
      supabase.from("hr_attendance").select("*").order("date", { ascending: false }),
      supabase.from("hr_payroll_periods").select("*").eq("business_id", businessOwnerId).order("start_date", { ascending: false }),
      supabase.from("hr_deductions").select("*").eq("business_id", businessOwnerId).order("name"),
      supabase.from("hr_payslips").select("*"),
    ]);
    if (empRes.data) setEmployees(empRes.data);
    if (schedRes.data) setSchedules(schedRes.data);
    if (attRes.data) setAttendance(attRes.data);
    if (periodRes.data) setPayrollPeriods(periodRes.data);
    if (dedRes.data) setDeductions(dedRes.data);
    if (payslipRes.data) setPayslips(payslipRes.data);
    setLoading(false);
  };

  useEffect(() => { if (businessOwnerId) loadData(); }, [businessOwnerId]);

  const getEmployee = (id: string) => employees.find(e => e.id === id);
  const getEmployeeSchedules = (empId: string) => schedules.filter(s => s.employee_id === empId);
  const getEmployeeAttendance = (empId: string, start: string, end: string) =>
    attendance.filter(a => a.employee_id === empId && a.date >= start && a.date <= end);
  const getPayslip = (empId: string, periodId: string) =>
    payslips.find(p => p.employee_id === empId && p.payroll_period_id === periodId);

  const calcHours = (start: string, end: string) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return (eh + em / 60) - (sh + sm / 60);
  };

  const calcTardiness = (scheduledStart: string, actualTimeIn: string | null) => {
    if (!actualTimeIn) return 0;
    const [sh, sm] = scheduledStart.split(":").map(Number);
    const [ah, am] = actualTimeIn.split(":").map(Number);
    return Math.max(0, (ah * 60 + am) - (sh * 60 + sm));
  };

  const generateEmployeePayslip = async (empId: string, periodId: string) => {
    const period = payrollPeriods.find(p => p.id === periodId);
    const emp = getEmployee(empId);
    if (!period || !emp) return;

    const empSchedules = getEmployeeSchedules(empId);
    const empAttendance = getEmployeeAttendance(empId, period.start_date, period.end_date);

    const start = new Date(period.start_date);
    const end = new Date(period.end_date);
    let totalDaysWorked = 0;
    let totalHoursWorked = 0;
    let totalTardinessMin = 0;
    let totalAbsences = 0;
    let totalLeaveDays = 0;

    const d = new Date(start);
    while (d <= end) {
      const dateStr = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();
      const daySchedule = empSchedules.find(s => s.day_of_week === dayOfWeek);
      if (daySchedule?.is_rest_day) { d.setDate(d.getDate() + 1); continue; }

      const att = empAttendance.find(a => a.date === dateStr);
      if (!att || att.status === "absent") {
        totalAbsences++;
      } else if (att.status === "leave") {
        totalLeaveDays += att.time_in && att.time_out ? 0.5 : 1;
      } else if (att.status === "half_day") {
        totalDaysWorked += 0.5;
        if (att.time_in && att.time_out) totalHoursWorked += calcHours(att.time_in, att.time_out);
      } else if (att.time_in && att.time_out) {
        totalDaysWorked += 1;
        totalHoursWorked += calcHours(att.time_in, att.time_out);
        if (daySchedule) totalTardinessMin += calcTardiness(daySchedule.start_time, att.time_in);
      }
      d.setDate(d.getDate() + 1);
    }

    const dailyRate = Number(emp.daily_rate) || 0;
    const grossPay = totalDaysWorked * dailyRate;

    const activeDeductions = deductions.filter(d => d.is_active);
    const deductionItems: { name: string; code: string; amount: number }[] = [];
    let totalDeductionsAmount = 0;
    for (const ded of activeDeductions) {
      let amount = ded.amount_type === "percentage" ? grossPay * (Number(ded.amount) / 100) : Number(ded.amount);
      deductionItems.push({ name: ded.name, code: ded.code, amount });
      totalDeductionsAmount += amount;
    }

    const netPay = grossPay - totalDeductionsAmount;
    const existing = getPayslip(empId, periodId);
    const payload = {
      business_id: businessOwnerId, employee_id: empId, payroll_period_id: periodId,
      daily_rate: dailyRate, total_days_worked: totalDaysWorked, total_hours_worked: totalHoursWorked,
      total_tardiness_minutes: totalTardinessMin, total_absences: totalAbsences, total_leave_days: totalLeaveDays,
      gross_pay: grossPay, total_deductions: totalDeductionsAmount, net_pay: netPay,
      deductions_breakdown: deductionItems, status: "draft",
    };

    if (existing) {
      await supabase.from("hr_payslips").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("hr_payslips").insert(payload);
    }
  };

  const generateAllPayslips = async (periodId: string) => {
    const activeEmps = employees.filter(e => e.is_active);
    for (const emp of activeEmps) {
      await generateEmployeePayslip(emp.id, periodId);
    }
    await loadData();
  };

  const updatePayslipStatus = async (id: string, status: string) => {
    await supabase.from("hr_payslips").update({ status }).eq("id", id);
    await loadData();
  };

  const fmtCurrency = (n: number) => `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const tabs = [
    { key: "dashboard" as const, label: "Dashboard" },
    { key: "schedules" as const, label: "Schedules" },
    { key: "attendance" as const, label: "Attendance" },
    { key: "periods" as const, label: "Payroll Periods" },
    { key: "deductions" as const, label: "Deductions" },
    { key: "payslips" as const, label: "Payslips" },
  ];

  return (
    <BusinessLayout title="Payroll & Payslips" description="Employee schedules, attendance tracking, and payslip generation">
      <div className="space-y-6">
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === t.key ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" /></div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <PayrollDashboard
                employees={employees} payrollPeriods={payrollPeriods} payslips={payslips}
                deductions={deductions} onGenerate={generateAllPayslips}
                getEmployee={getEmployee} fmtCurrency={fmtCurrency}
              />
            )}
            {activeTab === "schedules" && (
              <ScheduleManager
                employees={employees} schedules={schedules}
                onRefresh={loadData} getEmployee={getEmployee}
              />
            )}
            {activeTab === "attendance" && (
              <AttendanceLogger
                employees={employees} attendance={attendance}
                onRefresh={loadData} getEmployee={getEmployee}
              />
            )}
            {activeTab === "periods" && (
              <PayrollPeriodManager
                businessOwnerId={businessOwnerId} payrollPeriods={payrollPeriods}
                onRefresh={loadData}
              />
            )}
            {activeTab === "deductions" && (
              <DeductionManager
                businessOwnerId={businessOwnerId} deductions={deductions}
                onRefresh={loadData}
              />
            )}
            {activeTab === "payslips" && (
              <PayslipViewer
                payslips={payslips} payrollPeriods={payrollPeriods}
                employees={employees} getEmployee={getEmployee}
                updateStatus={updatePayslipStatus} fmtCurrency={fmtCurrency}
              />
            )}
          </>
        )}
      </div>
    </BusinessLayout>
  );
}

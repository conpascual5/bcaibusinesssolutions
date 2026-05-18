import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
import {
  Loader2, Users, Calendar, Clock, Umbrella, TrendingUp,
  BarChart3, PieChart, Activity, DollarSign, AlertTriangle,
  CheckCircle2, XCircle, UserCheck, UserX, Briefcase,
  GitBranch, Building2, MapPin, Layers, BadgeCheck,
  RefreshCw, Calculator, Gift, ArrowRight
} from "lucide-react";

type Employee = { id: string; first_name: string; last_name: string; is_active: boolean; gender: string | null; hire_date: string; department: string | null };
type AttendanceLog = { id: string; employee_id: string; date: string; status: string; hours_worked: number | null; overtime_hours: number | null; tardiness_minutes: number | null };
type LeaveRequest = { id: string; employee_id: string; start_date: string; end_date: string; days_taken: number; leave_type_id: string; status: string };
type LeaveType = { id: string; name: string; code: string };

export default function BusinessHRDashboard() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");

  const now = new Date();
  const getPeriodStart = () => {
    const d = new Date(now);
    if (period === "week") { d.setDate(d.getDate() - d.getDay() - 7); return d.toISOString().split("T")[0]; }
    if (period === "month") { d.setDate(1); return d.toISOString().split("T")[0]; }
    d.setMonth(d.getMonth() - 3); return d.toISOString().split("T")[0];
  };
  const periodStart = getPeriodStart();
  const periodEnd = now.toISOString().split("T")[0];

  useEffect(() => {
    if (!businessOwnerId) return;
    (async () => {
      const [empRes, attRes, leaveRes, typeRes] = await Promise.all([
        supabase.from("hr_employees").select("*").eq("business_id", businessOwnerId),
        supabase.from("hr_attendance_logs").select("*").gte("date", periodStart).lte("date", periodEnd),
        supabase.from("hr_leave_requests").select("*").gte("end_date", periodStart).lte("start_date", periodEnd),
        supabase.from("hr_leave_types").select("*").eq("business_id", businessOwnerId),
      ]);
      if (empRes.data) setEmployees(empRes.data);
      if (attRes.data) setAttendance(attRes.data);
      if (leaveRes.data) setLeaves(leaveRes.data);
      if (typeRes.data) setLeaveTypes(typeRes.data);
      setLoading(false);
    })();
  }, [businessOwnerId, periodStart, periodEnd]);

  const activeEmployees = employees.filter(e => e.is_active);
  const totalEmployees = employees.length;
  const activeCount = activeEmployees.length;
  const inactiveCount = totalEmployees - activeCount;

  // Attendance stats
  const presentDays = attendance.filter(a => a.status === "present" || a.status === "late").length;
  const lateDays = attendance.filter(a => a.status === "late").length;
  const absentDays = attendance.filter(a => a.status === "absent").length;
  const totalWorkDays = attendance.length || 1;
  const perfectAttendance = activeEmployees.filter(emp => {
    const empLogs = attendance.filter(a => a.employee_id === emp.id);
    return empLogs.length > 0 && empLogs.every(l => l.status === "present");
  }).length;

  // Hours
  const totalHours = attendance.reduce((sum, a) => sum + (a.hours_worked || 0), 0);
  const totalOT = attendance.reduce((sum, a) => sum + (a.overtime_hours || 0), 0);
  const totalTardiness = attendance.reduce((sum, a) => sum + (a.tardiness_minutes || 0), 0);

  // Leave stats
  const totalLeaveDays = leaves.reduce((sum, l) => sum + l.days_taken, 0);
  const leaveByType = leaveTypes.map(t => ({
    ...t,
    days: leaves.filter(l => l.leave_type_id === t.id).reduce((sum, l) => sum + l.days_taken, 0),
  }));

  // Gender distribution
  const maleCount = activeEmployees.filter(e => e.gender === "Male").length;
  const femaleCount = activeEmployees.filter(e => e.gender === "Female").length;
  const otherGender = activeCount - maleCount - femaleCount;

  // Payroll summary
  const avgHourlyRate = 150; // placeholder — user can adjust
  const regularPay = Math.round(totalHours * avgHourlyRate);
  const otPay = Math.round(totalOT * avgHourlyRate * 1.5);
  const lateDeductions = Math.round((totalTardiness / 60) * avgHourlyRate);
  const totalPayroll = regularPay + otPay - lateDeductions;

  const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) => (
    <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60 mt-1">{sub}</p>}
    </div>
  );

  const navigate = (await import("react-router")).useNavigate();

  const hrModules = [
    { icon: Users, label: "Employees", path: "/app/business/hr/employees", desc: "Manage employee profiles", color: "bg-blue-500" },
    { icon: GitBranch, label: "Org Chart", path: "/app/business/hr/org-chart", desc: "Company hierarchy", color: "bg-purple-500" },
    { icon: Building2, label: "Company", path: "/app/business/hr/company", desc: "Company profile", color: "bg-indigo-500" },
    { icon: MapPin, label: "Offices", path: "/app/business/hr/offices", desc: "Branch locations", color: "bg-rose-500" },
    { icon: Layers, label: "Departments", path: "/app/business/hr/departments", desc: "Department structure", color: "bg-amber-500" },
    { icon: BadgeCheck, label: "Designations", path: "/app/business/hr/designations", desc: "Job titles & grades", color: "bg-emerald-500" },
    { icon: Clock, label: "Attendance", path: "/app/business/hr/attendance", desc: "Daily time logs", color: "bg-cyan-500" },
    { icon: RefreshCw, label: "Corrections", path: "/app/business/hr/corrections", desc: "Time log adjustments", color: "bg-orange-500" },
    { icon: Umbrella, label: "Leave Mgmt", path: "/app/business/hr/leave", desc: "Leave requests & types", color: "bg-teal-500" },
    { icon: Calendar, label: "Shift Roster", path: "/app/business/hr/shifts", desc: "Shift definitions", color: "bg-violet-500" },
    { icon: TrendingUp, label: "Performances", path: "/app/business/hr/performances", desc: "Reviews & ratings", color: "bg-emerald-500" },
    { icon: Calculator, label: "Payroll Engine", path: "/app/business/hr/payroll", desc: "Auto-compute pay", color: "bg-indigo-500" },
    { icon: Gift, label: "Bonuses", path: "/app/business/hr/bonuses", desc: "Incentives & commissions", color: "bg-pink-500" },
  ];

  return (
    <BusinessLayout title="HR Dashboard" description="Employee analytics, attendance insights, and payroll summaries">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          {/* Quick Navigation */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {hrModules.map(mod => (
              <button
                key={mod.path}
                onClick={() => navigate(mod.path)}
                className="bg-card rounded-2xl border border-border p-4 hover:shadow-md hover:border-indigo-200 transition-all text-left group"
              >
                <div className={`p-2 rounded-xl ${mod.color} w-fit mb-2`}>
                  <mod.icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm font-semibold">{mod.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{mod.desc}</p>
              </button>
            ))}
          </div>

          {/* Period Selector */}
          <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
            <button onClick={() => setPeriod("week")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === "week" ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>This Week</button>
            <button onClick={() => setPeriod("month")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === "month" ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>This Month</button>
            <button onClick={() => setPeriod("quarter")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${period === "quarter" ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>This Quarter</button>
          </div>

          {/* Employee Overview */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <StatCard icon={Users} label="Total Employees" value={totalEmployees} color="bg-indigo-500" />
            <StatCard icon={UserCheck} label="Active" value={activeCount} sub={`${activeCount > 0 ? Math.round(activeCount/totalEmployees*100) : 0}% of total`} color="bg-emerald-500" />
            <StatCard icon={UserX} label="Inactive" value={inactiveCount} color="bg-rose-500" />
            <StatCard icon={Briefcase} label="Departments" value={new Set(employees.map(e => e.department).filter(Boolean)).size} color="bg-amber-500" />
          </div>

          {/* Attendance Overview */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <StatCard icon={CheckCircle2} label="Perfect Attendance" value={perfectAttendance} sub={`out of ${activeCount} active`} color="bg-emerald-500" />
            <StatCard icon={Clock} label="Total Hours" value={`${Math.round(totalHours)}h`} sub={`${Math.round(totalOT)}h OT`} color="bg-blue-500" />
            <StatCard icon={AlertTriangle} label="Late Arrivals" value={lateDays} sub={`${Math.round(totalTardiness)} min total`} color="bg-amber-500" />
            <StatCard icon={XCircle} label="Absences" value={absentDays} color="bg-rose-500" />
          </div>

          {/* Gender Distribution & Leave Breakdown */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Gender Distribution */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <PieChart className="w-4 h-4 text-indigo-500" />
                Gender Distribution
              </h3>
              {activeCount > 0 ? (
                <div className="space-y-4">
                  <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                    <div className="bg-blue-500 transition-all" style={{ width: `${(maleCount/activeCount)*100}%` }} />
                    <div className="bg-rose-400 transition-all" style={{ width: `${(femaleCount/activeCount)*100}%` }} />
                    {otherGender > 0 && <div className="bg-purple-400 transition-all" style={{ width: `${(otherGender/activeCount)*100}%` }} />}
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="font-medium">Male</span>
                      </div>
                      <p className="text-lg font-bold mt-0.5">{maleCount} <span className="text-xs text-muted-foreground font-normal">({Math.round(maleCount/activeCount*100)}%)</span></p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <span className="font-medium">Female</span>
                      </div>
                      <p className="text-lg font-bold mt-0.5">{femaleCount} <span className="text-xs text-muted-foreground font-normal">({Math.round(femaleCount/activeCount*100)}%)</span></p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                        <span className="font-medium">Other</span>
                      </div>
                      <p className="text-lg font-bold mt-0.5">{otherGender} <span className="text-xs text-muted-foreground font-normal">({Math.round(otherGender/activeCount*100)}%)</span></p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No data available.</p>
              )}
            </div>

            {/* Leave Breakdown */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <Umbrella className="w-4 h-4 text-indigo-500" />
                Leave Usage
              </h3>
              {leaveByType.filter(t => t.days > 0).length > 0 ? (
                <div className="space-y-3">
                  {leaveByType.filter(t => t.days > 0).map(t => (
                    <div key={t.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{t.name} ({t.code})</span>
                        <span className="text-muted-foreground">{t.days} days</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${Math.min(100, (t.days / Math.max(...leaveByType.map(lt => lt.days))) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground mt-2">Total: {totalLeaveDays} leave days taken</p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No leave taken this period.</p>
              )}
            </div>
          </div>

          {/* Payroll Summary */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <DollarSign className="w-4 h-4 text-indigo-500" />
              Payroll Summary <span className="text-xs font-normal text-muted-foreground">(based on ₱{avgHourlyRate}/hr estimate)</span>
            </h3>
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Regular Pay</p>
                <p className="text-xl font-bold">₱{regularPay.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{Math.round(totalHours)} hrs × ₱{avgHourlyRate}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Overtime Pay</p>
                <p className="text-xl font-bold text-amber-600">₱{otPay.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{Math.round(totalOT)} OT hrs × ₱{avgHourlyRate * 1.5}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-xs text-muted-foreground mb-1">Late Deductions</p>
                <p className="text-xl font-bold text-rose-600">-₱{lateDeductions.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{Math.round(totalTardiness / 60)} hrs late</p>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1 font-medium">Total Payroll</p>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">₱{totalPayroll.toLocaleString()}</p>
                <p className="text-xs text-indigo-500 mt-0.5">{activeCount} active employees</p>
              </div>
            </div>
          </div>

          {/* Attendance Status Breakdown */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h3 className="font-bold flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Attendance Breakdown
            </h3>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { label: "Present", value: presentDays - lateDays, color: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
                { label: "Late", value: lateDays, color: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-900/20" },
                { label: "Absent", value: absentDays, color: "bg-rose-500", bg: "bg-rose-50 dark:bg-rose-900/20" },
                { label: "On Leave", value: totalLeaveDays, color: "bg-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20" },
              ].map(item => (
                <div key={item.label} className={`${item.bg} rounded-xl p-4`}>
                  <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
                  <p className="text-2xl font-bold">{item.value}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${item.color} transition-all`} style={{ width: `${totalWorkDays > 0 ? (item.value / totalWorkDays) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </BusinessLayout>
  );
}

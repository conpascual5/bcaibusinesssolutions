import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/providers/auth";
import { supabase } from "@/integrations/supabase/client";
import WeeklySchedule from "@/components/WeeklySchedule";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Clock, LogOut, Loader2, Calendar,
  Umbrella, Send, Building2, Sun, Moon,
  AlertCircle, History, Timer, Coffee,
  Wallet, ChevronRight, X, Download, Printer,
  Sparkles, Heart, Star, Smartphone,
  CheckCircle2, Fingerprint
} from "lucide-react";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  business_id: string;
  position: string | null;
  department: string | null;
  shift_id: string | null;
};

type AttendanceLog = {
  id: string;
  employee_id: string;
  date: string;
  time_in: string | null;
  time_out: string | null;
  status: string;
  hours_worked: number | null;
  tardiness_minutes: number | null;
};

type LeaveType = {
  id: string;
  name: string;
  code: string;
  days_allowed: number;
};

type LeaveRequest = {
  id: string;
  employee_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  days_taken: number;
  status: string;
  reason: string | null;
  created_at: string;
};

type DaySchedule = {
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  grace_period_minutes: number | null;
  is_rest_day: boolean;
  break_start: string | null;
  break_end: string | null;
  break_paid: boolean;
  shift_name: string | null;
};

type Payslip = {
  id: string;
  employee_id: string;
  payroll_period_id: string;
  daily_rate: number;
  total_days_worked: number;
  total_hours_worked: number;
  total_tardiness_minutes: number;
  total_absences: number;
  total_leave_days: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  deductions_breakdown: any[];
  status: string;
  notes: string | null;
  created_at: string;
};

type PayrollPeriod = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  pay_date: string | null;
};

export default function EmployeePortal() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([]);
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [clocking, setClocking] = useState(false);
  const [clockMessage, setClockMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"attendance" | "leave" | "payslips">("attendance");

  // Leave form state
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveError, setLeaveError] = useState("");

  // Payslip state
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [viewingPayslip, setViewingPayslip] = useState<Payslip | null>(null);
  const [exporting, setExporting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const downloadPayslipPDF = async (ps: Payslip) => {
    setViewingPayslip(ps);
    setExporting(true);
    await new Promise(r => setTimeout(r, 150));
    try {
      const element = printRef.current;
      if (!element) { setExporting(false); return; }
      const canvas = await html2canvas(element, {
        scale: 2, backgroundColor: "#ffffff", logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const period = payrollPeriods.find(p => p.id === ps.payroll_period_id);
      const name = (period?.name || "payslip").replace(/\s+/g, "_");
      pdf.save(`payslip_${name}.pdf`);
    } catch (err) {
      console.error("[EmployeePortal] PDF export error", err);
    }
    setExporting(false);
  };

  const printPayslip = async (ps: Payslip) => {
    setViewingPayslip(ps);
    await new Promise(r => setTimeout(r, 150));
    try {
      const element = printRef.current;
      if (!element) return;
      const canvas = await html2canvas(element, {
        scale: 2, backgroundColor: "#ffffff", logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const win = window.open("", "_blank");
      if (!win) return;
      win.document.write(`
        <html>
          <head><title>Payslip</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
            <img src="${imgData}" style="max-width:100%;height:auto;" />
          </body>
        </html>
      `);
      win.document.close();
      win.onload = () => { win.print(); };
    } catch (err) {
      console.error("[EmployeePortal] Print error", err);
    }
  };

  const today = new Date();
  const todayDayOfWeek = today.getDay();
  const todayDateStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();

  useEffect(() => {
    if (!user) {
      navigate("/employee/auth");
      return;
    }
    loadEmployeeData();
  }, [user]);

  const loadEmployeeData = async () => {
    if (!user) return;
    setLoading(true);

    // Try by auth_user_id first, then fall back to email
    let { data: empData } = await supabase
      .from("hr_employees")
      .select("*")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    // Fallback: look up by email if auth_user_id didn't match
    if (!empData && user.email) {
      const { data: empByEmail } = await supabase
        .from("hr_employees")
        .select("*")
        .eq("email", user.email)
        .eq("is_active", true)
        .maybeSingle();

      if (empByEmail) {
        empData = empByEmail;
        // Try to link auth_user_id for next time (best-effort)
        supabase
          .from("hr_employees")
          .update({ auth_user_id: user.id })
          .eq("id", empByEmail.id)
          .then(() => {});
      }
    }

    if (!empData) {
      setLoading(false);
      return;
    }

    setEmployee(empData as unknown as Employee);

    const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
    const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ...

    // Load full week schedule from hr_employee_schedules
    const { data: schedData } = await supabase
      .from("hr_employee_schedules")
      .select("*")
      .eq("employee_id", empData.id);

    // Build week schedule array (all 7 days)
    const weekSched: DaySchedule[] = [];
    for (let d = 0; d < 7; d++) {
      const s = (schedData || []).find((s: any) => s.day_of_week === d);
      if (s) {
        let shiftName: string | null = null;
        if (s.shift_id) {
          const { data: shiftData } = await supabase
            .from("hr_shift_rosters")
            .select("name")
            .eq("id", s.shift_id)
            .maybeSingle();
          shiftName = shiftData?.name || null;
        }
        weekSched[d] = {
          day_of_week: d,
          start_time: s.start_time,
          end_time: s.end_time,
          grace_period_minutes: s.grace_period_minutes ?? 15,
          is_rest_day: s.is_rest_day ?? false,
          break_start: s.break_start,
          break_end: s.break_end,
          break_paid: s.break_paid ?? false,
          shift_name: shiftName,
        };
      } else {
        weekSched[d] = {
          day_of_week: d,
          start_time: null,
          end_time: null,
          grace_period_minutes: null,
          is_rest_day: false,
          break_start: null,
          break_end: null,
          break_paid: false,
          shift_name: null,
        };
      }
    }
    setWeekSchedule(weekSched);

    // Get today's attendance
    const { data: logData } = await supabase
      .from("hr_attendance_logs")
      .select("*")
      .eq("employee_id", empData.id)
      .eq("date", today)
      .maybeSingle();

    if (logData) setTodayLog(logData as unknown as AttendanceLog);

    // Get recent logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentData } = await supabase
      .from("hr_attendance_logs")
      .select("*")
      .eq("employee_id", empData.id)
      .gte("date", (() => { const d = sevenDaysAgo; return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })())
      .order("date", { ascending: false });

    if (recentData) setRecentLogs(recentData as unknown as AttendanceLog[]);

    // Get leave types for this business
    const { data: ltData } = await supabase
      .from("hr_leave_types")
      .select("*")
      .eq("business_id", empData.business_id)
      .order("name");

    if (ltData) setLeaveTypes(ltData as unknown as LeaveType[]);

    // Get my leave requests
    const { data: lrData } = await supabase
      .from("hr_leave_requests")
      .select("*")
      .eq("employee_id", empData.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (lrData) setLeaveRequests(lrData as unknown as LeaveRequest[]);

    // Get my payslips
    const { data: psData } = await supabase
      .from("hr_payslips")
      .select("*")
      .eq("employee_id", empData.id)
      .order("created_at", { ascending: false });

    if (psData) setPayslips(psData as unknown as Payslip[]);

    // Get payroll periods for payslip display
    const { data: ppData } = await supabase
      .from("hr_payroll_periods")
      .select("*")
      .eq("business_id", empData.business_id)
      .order("start_date", { ascending: false });

    if (ppData) setPayrollPeriods(ppData as unknown as PayrollPeriod[]);

    setLoading(false);
  };

  /** Compare a time string (HH:mm) against the shift start + grace period */
  const determineStatus = (timeStr: string, schedule: DaySchedule): string => {
    if (schedule.is_rest_day || !schedule.start_time) return "present";

    const [h, m] = timeStr.split(":").map(Number);
    const clockMinutes = h * 60 + m;

    const [sh, sm] = schedule.start_time.split(":").map(Number);
    const shiftStartMinutes = sh * 60 + sm;
    const graceEndMinutes = shiftStartMinutes + (schedule.grace_period_minutes ?? 15);

    if (clockMinutes <= graceEndMinutes) return "present";
    return "late";
  };

  /** Calculate hours worked between two time strings */
  const calcHoursWorked = (timeIn: string, timeOut: string): number => {
    const [ih, im] = timeIn.split(":").map(Number);
    const [oh, om] = timeOut.split(":").map(Number);
    const inMinutes = ih * 60 + im;
    const outMinutes = oh * 60 + om;
    let diff = outMinutes - inMinutes;
    if (diff < 0) diff += 1440; // crossed midnight
    return Math.round((diff / 60) * 100) / 100;
  };

  /** Calculate tardiness in minutes */
  const calcTardiness = (timeIn: string, schedule: DaySchedule): number => {
    if (schedule.is_rest_day || !schedule.start_time) return 0;
    const [h, m] = timeIn.split(":").map(Number);
    const clockMinutes = h * 60 + m;
    const [sh, sm] = schedule.start_time.split(":").map(Number);
    const shiftStartMinutes = sh * 60 + sm;
    const tardiness = clockMinutes - shiftStartMinutes;
    return tardiness > 0 ? tardiness : 0;
  };

  const handleClockIn = async () => {
    if (!employee) return;
    setClocking(true);
    setClockMessage("");

    const today = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; })();
    const now = new Date();
    const timeStr = now.toTimeString().split(":").slice(0, 2).join(":");

    try {
      if (todayLog?.time_in && !todayLog.time_out) {
        // Clock out — calculate hours worked
        const hoursWorked = calcHoursWorked(todayLog.time_in, timeStr);
        const { error } = await supabase
          .from("hr_attendance_logs")
          .update({ time_out: timeStr, hours_worked: hoursWorked })
          .eq("id", todayLog.id);

        if (error) throw error;
        setClockMessage(`Clocked out at ${timeStr} — ${hoursWorked}h worked ✨`);
      } else {
        // Clock in — determine status based on schedule
        let status = "present";
        let tardinessMinutes = 0;

        if (todaySched && !todaySched.is_rest_day && todaySched.start_time) {
          status = determineStatus(timeStr, todaySched);
          tardinessMinutes = calcTardiness(timeStr, todaySched);
        }

        const { error } = await supabase
          .from("hr_attendance_logs")
          .insert({
            employee_id: employee.id,
            date: todayDateStr,
            time_in: timeStr,
            status,
            tardiness_minutes: tardinessMinutes > 0 ? tardinessMinutes : null,
          });

        if (error) throw error;

        if (status === "late") {
          setClockMessage(`Clocked in at ${timeStr} — ${tardinessMinutes} min late ⏰`);
        } else {
          setClockMessage(`Clocked in at ${timeStr} ✅`);
        }
      }

      await loadEmployeeData();
    } catch (err: any) {
      setClockMessage(err.message || "Failed to clock");
    }
    setClocking(false);
  };

  const handleSubmitLeave = async () => {
    if (!employee || !leaveForm.leave_type_id || !leaveForm.start_date || !leaveForm.end_date) return;
    setSubmittingLeave(true);
    setLeaveError("");

    const start = new Date(leaveForm.start_date);
    const end = new Date(leaveForm.end_date);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    try {
      const { error } = await supabase
        .from("hr_leave_requests")
        .insert({
          employee_id: employee.id,
          leave_type_id: leaveForm.leave_type_id,
          start_date: leaveForm.start_date,
          end_date: leaveForm.end_date,
          days_taken: days,
          status: "pending",
          reason: leaveForm.reason || null,
        });

      if (error) throw error;

      setShowLeaveForm(false);
      setLeaveForm({ leave_type_id: "", start_date: "", end_date: "", reason: "" });
      await loadEmployeeData();
    } catch (err: any) {
      setLeaveError(err.message || "Failed to submit leave request");
    }
    setSubmittingLeave(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/employee/auth");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
      case "late": return "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400";
      case "absent": return "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400";
      case "half-day": return "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400";
      case "pending": return "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400";
      case "approved": return "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400";
      case "rejected": return "bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50/30 to-sky-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50/30 to-sky-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50/30 to-sky-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="bg-card rounded-3xl border border-border shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-lg font-bold mb-2">No Employee Profile Found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Your account is not linked to any employee profile. Please contact your employer to set up your access.
          </p>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-xl text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  const todaySched = weekSchedule[todayDayOfWeek];
  const isRestDay = todaySched?.is_rest_day ?? false;
  const isClockedIn = todayLog?.time_in && !todayLog?.time_out;
  const hasClockedToday = !!todayLog?.time_in && !!todayLog?.time_out;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50/30 to-sky-50 dark:from-slate-950 dark:via-purple-950/20 dark:to-slate-950 pb-20">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold">My Portal</h1>
              <p className="text-[10px] text-muted-foreground">{employee.first_name} {employee.last_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-xs text-purple-700 dark:text-purple-400 font-medium">
              <Building2 className="w-3 h-3" />
              {employee.position || "Employee"}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-muted rounded-xl transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Weekly Schedule */}
        <WeeklySchedule schedule={weekSchedule} />

        {/* Clock In/Out Card — Mobile-first design */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-border shadow-lg overflow-hidden">
          {/* Status banner */}
          <div className={`px-5 py-3 text-center text-xs font-bold uppercase tracking-wider ${
            isRestDay
              ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-b border-amber-200 dark:border-amber-800"
              : isClockedIn
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-b border-emerald-200 dark:border-emerald-800"
                : hasClockedToday
                  ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-b border-indigo-200 dark:border-indigo-800"
                  : "bg-muted/30 text-muted-foreground border-b border-border"
          }`}>
            {isRestDay
              ? "🎉 Rest Day — Enjoy your day off!"
              : isClockedIn
                ? "✨ You are currently on shift"
                : hasClockedToday
                  ? "✅ Shift completed for today"
                  : "⏰ Ready to start your shift"}
          </div>

          <div className="p-6">
            {/* Big clock icon — centered, prominent */}
            <div className="flex justify-center mb-5">
              <div className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 ${
                isClockedIn
                  ? "bg-emerald-100 dark:bg-emerald-900/30 shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-200 dark:ring-emerald-800 scale-105"
                  : isRestDay
                    ? "bg-amber-100 dark:bg-amber-900/20 shadow-sm ring-4 ring-amber-200 dark:ring-amber-800"
                    : hasClockedToday
                      ? "bg-indigo-100 dark:bg-indigo-900/20 shadow-sm ring-4 ring-indigo-200 dark:ring-indigo-800"
                      : "bg-muted shadow-sm"
              }`}>
                {isRestDay ? (
                  <Heart className="w-12 h-12 text-amber-500" />
                ) : isClockedIn ? (
                  <Sun className="w-12 h-12 text-emerald-500" />
                ) : hasClockedToday ? (
                  <CheckCircle2 className="w-12 h-12 text-indigo-500" />
                ) : (
                  <Clock className="w-12 h-12 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Time display — large, readable */}
            <div className="text-center mb-5">
              <p className="text-3xl font-extrabold">
                {isRestDay
                  ? "Rest Day"
                  : isClockedIn
                    ? todayLog?.time_in?.slice(0, 5) || "—"
                    : hasClockedToday
                      ? `${todayLog?.time_out?.slice(0, 5) || "—"}`
                      : "— : —"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {isRestDay
                  ? "Take a break, you deserve it!"
                  : isClockedIn
                    ? `Clocked in at ${todayLog?.time_in?.slice(0, 5)}`
                    : hasClockedToday
                      ? `Completed at ${todayLog?.time_out?.slice(0, 5)} — ${todayLog?.hours_worked}h worked`
                      : "Tap the button below to clock in"}
              </p>
            </div>

            {/* Schedule info chips */}
            {todaySched && !isRestDay && todaySched.start_time && (
              <div className="flex flex-wrap items-center justify-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                  <Timer className="w-3.5 h-3.5" />
                  {todaySched.shift_name ? `${todaySched.shift_name}: ` : ""}
                  {todaySched.start_time.slice(0, 5)} – {todaySched.end_time?.slice(0, 5)}
                </span>
                {todaySched.break_start && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-full text-xs font-medium">
                    <Coffee className="w-3.5 h-3.5" />
                    Break {todaySched.break_start.slice(0, 5)}–{todaySched.break_end?.slice(0, 5)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 rounded-full text-xs font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  Grace: {todaySched.grace_period_minutes} min
                </span>
              </div>
            )}

            {/* Clock message */}
            {clockMessage && (
              <div className="text-center mb-5">
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium bg-purple-50 dark:bg-purple-900/20 inline-block px-4 py-1.5 rounded-full">
                  {clockMessage}
                </p>
              </div>
            )}

            {/* Big clock in/out button — large tap target for mobile */}
            <button
              onClick={handleClockIn}
              disabled={clocking || isRestDay || hasClockedToday}
              className={`w-full flex items-center justify-center gap-3 py-5 rounded-2xl text-base font-bold transition-all shadow-lg active:scale-[0.98] ${
                isClockedIn
                  ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30"
                  : "bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-purple-500/30"
              } disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100`}
            >
              {clocking ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : isClockedIn ? (
                <>
                  <Moon className="w-6 h-6" />
                  <span className="text-lg">Clock Out</span>
                </>
              ) : (
                <>
                  <Sun className="w-6 h-6" />
                  <span className="text-lg">Clock In</span>
                </>
              )}
            </button>

            {/* Mobile-friendly hint */}
            <p className="text-center text-[10px] text-muted-foreground mt-3 flex items-center justify-center gap-1">
              <Smartphone className="w-3 h-3" />
              Works on any device — just tap to clock in/out
            </p>
          </div>
        </div>

        {/* Bottom Navigation Bar — mobile-friendly */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-t border-border shadow-2xl">
          <div className="max-w-4xl mx-auto flex items-center justify-around px-2 py-1">
            <button
              onClick={() => setActiveTab("attendance")}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-[10px] font-medium transition-all min-w-0 ${
                activeTab === "attendance" ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${
                activeTab === "attendance" ? "bg-purple-100 dark:bg-purple-900/30" : ""
              }`}>
                <Clock className={`w-5 h-5 ${activeTab === "attendance" ? "text-purple-600 dark:text-purple-400" : ""}`} />
              </div>
              <span className="font-semibold">Attendance</span>
            </button>
            <button
              onClick={() => setActiveTab("leave")}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-[10px] font-medium transition-all min-w-0 ${
                activeTab === "leave" ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${
                activeTab === "leave" ? "bg-purple-100 dark:bg-purple-900/30" : ""
              }`}>
                <Umbrella className={`w-5 h-5 ${activeTab === "leave" ? "text-purple-600 dark:text-purple-400" : ""}`} />
              </div>
              <span className="font-semibold">Leave</span>
            </button>
            <button
              onClick={() => setActiveTab("payslips")}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl text-[10px] font-medium transition-all min-w-0 ${
                activeTab === "payslips" ? "text-purple-600 dark:text-purple-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${
                activeTab === "payslips" ? "bg-purple-100 dark:bg-purple-900/30" : ""
              }`}>
                <Wallet className={`w-5 h-5 ${activeTab === "payslips" ? "text-purple-600 dark:text-purple-400" : ""}`} />
              </div>
              <span className="font-semibold">Payslips</span>
            </button>
          </div>
        </nav>

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-500" />
              <h3 className="font-semibold text-sm">Recent Attendance</h3>
              <span className="text-xs text-muted-foreground">(Last 7 days)</span>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm overflow-hidden">
              {recentLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <Sparkles className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  No attendance records yet. Start by clocking in!
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {recentLogs.map((log) => {
                    const date = new Date(log.date);
                    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                    const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    return (
                      <div key={log.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            log.status === "present" ? "bg-emerald-100 dark:bg-emerald-900/20" :
                            log.status === "late" ? "bg-amber-100 dark:bg-amber-900/20" :
                            "bg-muted"
                          }`}>
                            <Calendar className={`w-5 h-5 ${
                              log.status === "present" ? "text-emerald-600 dark:text-emerald-400" :
                              log.status === "late" ? "text-amber-600 dark:text-amber-400" :
                              "text-muted-foreground"
                            }`} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{dayName}, {dateStr}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.time_in ? `${log.time_in.slice(0, 5)}` : "—"} → {log.time_out ? `${log.time_out.slice(0, 5)}` : "—"}
                            </p>
                            {log.tardiness_minutes != null && log.tardiness_minutes > 0 && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                ⏰ {log.tardiness_minutes} min late
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                          {log.hours_worked != null && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">{log.hours_worked}h worked</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payslips Tab */}
        {activeTab === "payslips" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-purple-500" />
              <h3 className="font-semibold text-sm">My Payslips</h3>
              {payslips.length > 0 && (
                <span className="text-xs text-muted-foreground">({payslips.length})</span>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm overflow-hidden">
              {payslips.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  <Wallet className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
                  No payslips yet. Payslips will appear here once your employer runs payroll.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {payslips.map((ps) => {
                    const period = payrollPeriods.find(p => p.id === ps.payroll_period_id);
                    return (
                      <button
                        key={ps.id}
                        onClick={() => setViewingPayslip(ps)}
                        className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{period?.name || "Payroll Period"}</p>
                            <p className="text-xs text-muted-foreground">
                              {period ? `${period.start_date} → ${period.end_date}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-1">
                          <div>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              ₱{Number(ps.net_pay).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {ps.status === "paid" ? "Paid" : ps.status}
                            </p>
                          </div>
                          <div className="flex items-center gap-0.5 ml-1">
                            <span
                              onClick={(e) => { e.stopPropagation(); downloadPayslipPDF(ps); }}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Download PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </span>
                            <span
                              onClick={(e) => { e.stopPropagation(); printPayslip(ps); }}
                              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                              title="Print"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payslip Detail Modal */}
        {viewingPayslip && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card rounded-2xl border border-border shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Payslip Details</h3>
                    <p className="text-xs text-muted-foreground">
                      {payrollPeriods.find(p => p.id === viewingPayslip.payroll_period_id)?.name || "Payroll Period"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => downloadPayslipPDF(viewingPayslip)}
                    disabled={exporting}
                    className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-indigo-600 disabled:opacity-50"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => printPayslip(viewingPayslip)}
                    className="p-2 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                    title="Print"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewingPayslip(null)}
                    className="p-2 hover:bg-muted rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div ref={printRef} className="bg-white dark:bg-slate-900">
                {/* Period Info */}
                <div className="px-5 py-4 bg-muted/30 border-b border-border">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground">Period Start</span>
                      <p className="font-medium">{payrollPeriods.find(p => p.id === viewingPayslip.payroll_period_id)?.start_date || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Period End</span>
                      <p className="font-medium">{payrollPeriods.find(p => p.id === viewingPayslip.payroll_period_id)?.end_date || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Pay Date</span>
                      <p className="font-medium">{payrollPeriods.find(p => p.id === viewingPayslip.payroll_period_id)?.pay_date || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Status</span>
                      <p className="font-medium capitalize">{viewingPayslip.status}</p>
                    </div>
                  </div>
                </div>

                {/* Earnings */}
                <div className="px-5 py-4 border-b border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Earnings</h4>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily Rate</span>
                      <span className="font-medium">₱{Number(viewingPayslip.daily_rate).toLocaleString("en-PH", { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Days Worked</span>
                      <span className="font-medium">{viewingPayslip.total_days_worked}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Hours Worked</span>
                      <span className="font-medium">{viewingPayslip.total_hours_worked}h</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Leave Days</span>
                      <span className="font-medium">{viewingPayslip.total_leave_days}</span>
                    </div>
                    {viewingPayslip.total_tardiness_minutes > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-amber-600 dark:text-amber-400">Tardiness</span>
                        <span className="font-medium text-amber-600 dark:text-amber-400">{viewingPayslip.total_tardiness_minutes} min</span>
                      </div>
                    )}
                    {viewingPayslip.total_absences > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-rose-600 dark:text-rose-400">Absences</span>
                        <span className="font-medium text-rose-600 dark:text-rose-400">{viewingPayslip.total_absences} day(s)</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t border-border">
                      <span className="font-semibold">Gross Pay</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        ₱{Number(viewingPayslip.gross_pay).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="px-5 py-4 border-b border-border">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Deductions</h4>
                  {viewingPayslip.deductions_breakdown && viewingPayslip.deductions_breakdown.length > 0 ? (
                    <div className="space-y-2.5">
                      {viewingPayslip.deductions_breakdown.map((d: any, i: number) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">{d.name || d.label || `Deduction ${i + 1}`}</span>
                          <span className="font-medium text-rose-600 dark:text-rose-400">
                            -₱{Number(d.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pt-2 border-t border-border">
                        <span className="font-semibold">Total Deductions</span>
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          -₱{Number(viewingPayslip.total_deductions).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No deductions</p>
                  )}
                </div>

                {/* Net Pay */}
                <div className="px-5 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold">Net Pay</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      ₱{Number(viewingPayslip.net_pay).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Notes */}
                {viewingPayslip.notes && (
                  <div className="px-5 py-3 border-t border-border">
                    <p className="text-xs text-muted-foreground italic">{viewingPayslip.notes}</p>
                  </div>
                )}
              </div>

              {/* Close button */}
              <div className="px-5 py-3 border-t border-border">
                <button
                  onClick={() => setViewingPayslip(null)}
                  className="w-full py-2.5 bg-muted hover:bg-muted/80 rounded-xl text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leave Tab */}
        {activeTab === "leave" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Umbrella className="w-4 h-4 text-purple-500" />
                <h3 className="font-semibold text-sm">My Leave Requests</h3>
              </div>
              <button
                onClick={() => { setShowLeaveForm(true); setLeaveError(""); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl text-xs font-semibold hover:from-purple-600 hover:to-pink-700 transition-all shadow-md"
              >
                <Send className="w-3.5 h-3.5" /> Request Leave
              </button>
            </div>

            {/* Leave Form */}
            {showLeaveForm && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-sm">New Leave Request</h4>
                  <button onClick={() => setShowLeaveForm(false)} className="p-1 hover:bg-muted rounded-lg">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Leave Type *</label>
                    <select
                      value={leaveForm.leave_type_id}
                      onChange={e => setLeaveForm({ ...leaveForm, leave_type_id: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      <option value="">Select leave type</option>
                      {leaveTypes.map(lt => (
                        <option key={lt.id} value={lt.id}>{lt.name} ({lt.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Start Date *</label>
                    <input
                      type="date"
                      value={leaveForm.start_date}
                      onChange={e => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">End Date *</label>
                    <input
                      type="date"
                      value={leaveForm.end_date}
                      onChange={e => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground">Reason</label>
                    <textarea
                      value={leaveForm.reason}
                      onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      rows={2}
                      placeholder="Optional reason for leave..."
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>

                {leaveError && (
                  <div className="mt-3 px-4 py-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-xl text-sm border border-rose-200 dark:border-rose-800">
                    {leaveError}
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-4">
                  <button
                    onClick={() => setShowLeaveForm(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium border border-border hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitLeave}
                    disabled={submittingLeave || !leaveForm.leave_type_id || !leaveForm.start_date || !leaveForm.end_date}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:from-purple-600 hover:to-pink-700 disabled:opacity-50 transition-all"
                  >
                    {submittingLeave ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Submit Request
                  </button>
                </div>
              </div>
            )}

            {/* Leave Requests List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-border shadow-sm overflow-hidden">
              {leaveRequests.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No leave requests yet. Tap "Request Leave" to submit one.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {leaveRequests.map((lr) => {
                    const lt = leaveTypes.find(t => t.id === lr.leave_type_id);
                    return (
                      <div key={lr.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                            <Umbrella className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{lt?.name || "Leave"}</p>
                            <p className="text-xs text-muted-foreground">
                              {lr.start_date} → {lr.end_date} ({lr.days_taken} day{lr.days_taken > 1 ? "s" : ""})
                            </p>
                            {lr.reason && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 italic">"{lr.reason}"</p>
                            )}
                          </div>
                        </div>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(lr.status)}`}>
                          {lr.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

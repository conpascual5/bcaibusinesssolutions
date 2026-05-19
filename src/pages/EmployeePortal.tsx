import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/providers/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Clock, LogOut, Loader2, Calendar,
  Umbrella, Send, Building2, Sun, Moon,
  AlertCircle, History, Timer, Coffee
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

type TodaySchedule = {
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  is_rest_day: boolean;
  break_start: string | null;
  break_end: string | null;
  break_paid: boolean;
  shift_name: string | null;
};

export default function EmployeePortal() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
  const [recentLogs, setRecentLogs] = useState<AttendanceLog[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TodaySchedule | null>(null);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [clocking, setClocking] = useState(false);
  const [clockMessage, setClockMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"attendance" | "leave">("attendance");

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

    const { data: empData } = await supabase
      .from("hr_employees")
      .select("*")
      .eq("auth_user_id", user.id)
      .eq("is_active", true)
      .maybeSingle();

    if (!empData) {
      setLoading(false);
      return;
    }

    setEmployee(empData as unknown as Employee);

    const today = new Date().toISOString().split("T")[0];
    const dayOfWeek = new Date().getDay(); // 0=Sun, 1=Mon, ...

    // Get today's schedule from hr_employee_schedules
    const { data: scheduleData } = await supabase
      .from("hr_employee_schedules")
      .select("*")
      .eq("employee_id", empData.id)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle();

    if (scheduleData) {
      // If there's a shift_id, fetch the shift name
      let shiftName: string | null = null;
      if (scheduleData.shift_id) {
        const { data: shiftData } = await supabase
          .from("hr_shift_rosters")
          .select("name")
          .eq("id", scheduleData.shift_id)
          .maybeSingle();
        shiftName = shiftData?.name || null;
      }

      setTodaySchedule({
        start_time: scheduleData.start_time,
        end_time: scheduleData.end_time,
        grace_period_minutes: scheduleData.grace_period_minutes ?? 15,
        is_rest_day: scheduleData.is_rest_day ?? false,
        break_start: scheduleData.break_start,
        break_end: scheduleData.break_end,
        break_paid: scheduleData.break_paid ?? false,
        shift_name: shiftName,
      });
    } else {
      setTodaySchedule(null);
    }

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
      .gte("date", sevenDaysAgo.toISOString().split("T")[0])
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

    setLoading(false);
  };

  /** Compare a time string (HH:mm) against the shift start + grace period */
  const determineStatus = (timeStr: string, schedule: TodaySchedule): string => {
    if (schedule.is_rest_day) return "present";

    const [h, m] = timeStr.split(":").map(Number);
    const clockMinutes = h * 60 + m;

    const [sh, sm] = schedule.start_time.split(":").map(Number);
    const shiftStartMinutes = sh * 60 + sm;
    const graceEndMinutes = shiftStartMinutes + schedule.grace_period_minutes;

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
  const calcTardiness = (timeIn: string, schedule: TodaySchedule): number => {
    if (schedule.is_rest_day) return 0;
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

    const today = new Date().toISOString().split("T")[0];
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
        setClockMessage(`Clocked out at ${timeStr} — ${hoursWorked}h worked`);
      } else {
        // Clock in — determine status based on schedule
        let status = "present";
        let tardinessMinutes = 0;

        if (todaySchedule && !todaySchedule.is_rest_day) {
          status = determineStatus(timeStr, todaySchedule);
          tardinessMinutes = calcTardiness(timeStr, todaySchedule);
        }

        const { error } = await supabase
          .from("hr_attendance_logs")
          .insert({
            employee_id: employee.id,
            date: today,
            time_in: timeStr,
            status,
            tardiness_minutes: tardinessMinutes > 0 ? tardinessMinutes : null,
          });

        if (error) throw error;

        if (status === "late") {
          setClockMessage(`Clocked in at ${timeStr} — ${tardinessMinutes} min late`);
        } else {
          setClockMessage(`Clocked in at ${timeStr}`);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
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

  const isClockedIn = todayLog?.time_in && !todayLog?.time_out;
  const isRestDay = todaySchedule?.is_rest_day ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold">Employee Portal</h1>
              <p className="text-[10px] text-muted-foreground">{employee.first_name} {employee.last_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-lg text-xs text-muted-foreground">
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
        {/* Clock In/Out Card */}
        <div className="bg-card rounded-2xl border border-border shadow-lg p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 ${
              isClockedIn
                ? "bg-emerald-100 dark:bg-emerald-900/30 shadow-lg shadow-emerald-500/20"
                : isRestDay
                  ? "bg-blue-100 dark:bg-blue-900/20 shadow-sm"
                  : "bg-muted shadow-sm"
            }`}>
              <Clock className={`w-10 h-10 transition-colors ${
                isClockedIn ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
              }`} />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold">
                {isRestDay
                  ? "It's your rest day 🎉"
                  : isClockedIn
                    ? "You're clocked in"
                    : "Ready to work?"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isRestDay
                  ? "Enjoy your day off!"
                  : isClockedIn
                    ? `Clocked in at ${todayLog?.time_in?.slice(0, 5)}`
                    : todayLog?.time_out
                      ? `Last clock out: ${todayLog.time_out.slice(0, 5)}`
                      : "Tap the button to clock in for today"}
              </p>

              {/* Schedule info */}
              {todaySchedule && !isRestDay && (
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-medium">
                    <Timer className="w-3 h-3" />
                    {todaySchedule.shift_name
                      ? `${todaySchedule.shift_name}: `
                      : ""}
                    {todaySchedule.start_time.slice(0, 5)} – {todaySchedule.end_time.slice(0, 5)}
                  </span>
                  {todaySchedule.break_start && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-xs font-medium">
                      <Coffee className="w-3 h-3" />
                      Break {todaySchedule.break_start.slice(0, 5)}–{todaySchedule.break_end?.slice(0, 5)}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    Grace: {todaySchedule.grace_period_minutes} min
                  </span>
                </div>
              )}

              {clockMessage && (
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 font-medium">
                  {clockMessage}
                </p>
              )}
            </div>
            <button
              onClick={handleClockIn}
              disabled={clocking || isRestDay || (!!todayLog?.time_in && !!todayLog?.time_out)}
              className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${
                isClockedIn
                  ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
                  : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-indigo-500/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {clocking ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isClockedIn ? (
                <><Moon className="w-5 h-5" /> Clock Out</>
              ) : (
                <><Sun className="w-5 h-5" /> Clock In</>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-card rounded-xl p-1 border border-border shadow-sm">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "attendance" ? "bg-indigo-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Clock className="w-4 h-4" /> Attendance
          </button>
          <button
            onClick={() => setActiveTab("leave")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === "leave" ? "bg-indigo-500 text-white shadow-md" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Umbrella className="w-4 h-4" /> Leave
          </button>
        </div>

        {/* Attendance Tab */}
        {activeTab === "attendance" && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-sm">Recent Attendance (Last 7 Days)</h3>
            </div>
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              {recentLogs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
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
                          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{dayName}, {dateStr}</p>
                            <p className="text-xs text-muted-foreground">
                              {log.time_in ? `${log.time_in.slice(0, 5)}` : "—"} → {log.time_out ? `${log.time_out.slice(0, 5)}` : "—"}
                            </p>
                            {log.tardiness_minutes != null && log.tardiness_minutes > 0 && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                                {log.tardiness_minutes} min late
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

        {/* Leave Tab */}
        {activeTab === "leave" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Umbrella className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-sm">My Leave Requests</h3>
              </div>
              <button
                onClick={() => { setShowLeaveForm(true); setLeaveError(""); }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-xs font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md"
              >
                <Send className="w-3.5 h-3.5" /> Request Leave
              </button>
            </div>

            {/* Leave Form */}
            {showLeaveForm && (
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5">
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
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all"
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
            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
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

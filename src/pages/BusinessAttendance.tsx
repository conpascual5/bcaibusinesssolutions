import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
import {
  Loader2, Clock, ChevronLeft, ChevronRight, AlertTriangle,
  Sun, Moon, Calendar, CheckCircle2, XCircle, Filter, Plus, X, Settings
} from "lucide-react";

type Employee = { id: string; first_name: string; last_name: string; is_active: boolean };
type AttendanceLog = {
  id: string; employee_id: string; date: string;
  time_in: string | null; time_out: string | null;
  status: string; hours_worked: number | null;
  overtime_hours: number | null; tardiness_minutes: number | null;
  notes: string | null;
};
type Holiday = { id: string; name: string; date: string };
type RestDay = { id: string; day_of_week: number; name: string };
type LeaveRequest = { id: string; employee_id: string; start_date: string; end_date: string; days_taken: number; leave_type_id: string };
type EmployeeSchedule = {
  employee_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  grace_period_minutes: number | null;
  break_start: string | null;
  break_end: string | null;
  break_paid: boolean | null;
  is_rest_day: boolean | null;
};

const DEFAULT_START = "08:00";
const DEFAULT_END = "17:00";
const LUNCH_BREAK_HOURS = 1;

function getWeekDates(date: Date): Date[] {
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function BusinessAttendance() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [restDays, setRestDays] = useState<RestDay[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");

  const weekDates = getWeekDates(currentWeekStart);
  const weekStartStr = formatDate(weekDates[0]);
  const weekEndStr = formatDate(weekDates[6]);

  const loadData = useCallback(async () => {
    if (!businessOwnerId) return;
    const [empRes, logRes, holRes, restRes, leaveRes, schedRes] = await Promise.all([
      supabase.from("hr_employees").select("id, first_name, last_name, is_active").eq("business_id", businessOwnerId).eq("is_active", true).order("last_name"),
      supabase.from("hr_attendance_logs").select("*").gte("date", weekStartStr).lte("date", weekEndStr),
      supabase.from("hr_holidays").select("*").eq("business_id", businessOwnerId),
      supabase.from("hr_rest_days").select("*").eq("business_id", businessOwnerId),
      supabase.from("hr_leave_requests").select("*").gte("end_date", weekStartStr).lte("start_date", weekEndStr).eq("status", "approved"),
      supabase.from("hr_employee_schedules").select("employee_id, day_of_week, start_time, end_time, grace_period_minutes, break_start, break_end, break_paid, is_rest_day"),
    ]);
    if (empRes.data) setEmployees(empRes.data);
    if (logRes.data) setLogs(logRes.data);
    if (holRes.data) setHolidays(holRes.data);
    if (restRes.data) setRestDays(restRes.data);
    if (leaveRes.data) setLeaveRequests(leaveRes.data);
    if (schedRes.data) setSchedules(schedRes.data);
    setLoading(false);
  }, [businessOwnerId, weekStartStr, weekEndStr]);

  useEffect(() => { if (businessOwnerId) loadData(); }, [loadData]);

  const isHoliday = (dateStr: string) => holidays.find(h => h.date === dateStr);
  const isRestDay = (date: Date) => restDays.find(r => r.day_of_week === date.getDay());
  const isOnLeave = (empId: string, dateStr: string) => leaveRequests.find(l => l.employee_id === empId && dateStr >= l.start_date && dateStr <= l.end_date);
  const isScheduledRestDay = (empId: string, date: Date) => {
    const sched = getSchedule(empId, date);
    return sched?.is_rest_day === true;
  };

  const getLog = (empId: string, dateStr: string) => logs.find(l => l.employee_id === empId && l.date === dateStr);

  const getSchedule = (empId: string, date: Date) => {
    const dayOfWeek = date.getDay();
    return schedules.find(s => s.employee_id === empId && s.day_of_week === dayOfWeek);
  };

  const getDefaultStart = (empId: string, date: Date) => {
    const sched = getSchedule(empId, date);
    return sched?.start_time?.slice(0, 5) || DEFAULT_START;
  };

  const getDefaultEnd = (empId: string, date: Date) => {
    const sched = getSchedule(empId, date);
    return sched?.end_time?.slice(0, 5) || DEFAULT_END;
  };

  const getDefaultStatus = (empId: string, dateStr: string, date: Date): string => {
    if (isHoliday(dateStr)) return "holiday";
    if (isRestDay(date)) return "rest-day";
    if (isScheduledRestDay(empId, date)) return "rest-day";
    if (isOnLeave(empId, dateStr)) return "leave";
    return "present";
  };

  const updateLog = async (empId: string, dateStr: string, date: Date, field: string, value: any) => {
    setSaving(`${empId}-${dateStr}`);
    const existing = getLog(empId, dateStr);
    const defaultStatus = getDefaultStatus(empId, dateStr, date);
    const payload: any = { employee_id: empId, date: dateStr };

    if (field === "status") {
      payload.status = value;
      if (value === "present" || value === "late") {
        payload.time_in = value === "late" ? "08:15" : getDefaultStart(empId, date);
        payload.time_out = getDefaultEnd(empId, date);
      } else {
        payload.time_in = null;
        payload.time_out = null;
        payload.hours_worked = null;
        payload.overtime_hours = null;
        payload.tardiness_minutes = null;
      }
    } else {
      payload[field] = value;
      payload.status = existing?.status || defaultStatus;
    }

    // Calculate hours and tardiness
    const timeIn = field === "time_in" ? value : (existing?.time_in || null);
    const timeOut = field === "time_out" ? value : (existing?.time_out || null);
    if (timeIn && timeOut) {
      const [inH, inM] = timeIn.split(":").map(Number);
      const [outH, outM] = timeOut.split(":").map(Number);
      const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM) - LUNCH_BREAK_HOURS * 60;
      payload.hours_worked = Math.max(0, Math.round((totalMinutes / 60) * 100) / 100);

      // OT: hours beyond 8
      payload.overtime_hours = Math.max(0, Math.round((payload.hours_worked - 8) * 100) / 100);

      // Tardiness: minutes past scheduled start time
      const startMinutes = inH * 60 + inM;
      const schedStart = getDefaultStart(empId, date);
      const [schedH, schedM] = schedStart.split(":").map(Number);
      const schedStartMinutes = schedH * 60 + schedM;
      payload.tardiness_minutes = Math.max(0, startMinutes - schedStartMinutes);
      payload.status = payload.tardiness_minutes > 0 ? "late" : "present";
    }

    if (existing) {
      await supabase.from("hr_attendance_logs").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("hr_attendance_logs").insert(payload);
    }
    setSaving(null);
    await loadData();
  };

  const filteredEmployees = selectedEmployee === "all" ? employees : employees.filter(e => e.id === selectedEmployee);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <BusinessLayout title="Attendance & Time Tracking" description="Daily time logs, tardiness tracking, and hours calculator">
      <div className="space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between bg-card rounded-2xl border border-border p-4">
          <button onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() - 7); setCurrentWeekStart(d); setLoading(true); }} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="font-semibold">
              {weekDates[0].toLocaleDateString("en-US", { month: "long", day: "numeric" })} — {weekDates[6].toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
          <button onClick={() => { const d = new Date(currentWeekStart); d.setDate(d.getDate() + 7); setCurrentWeekStart(d); setLoading(true); }} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Employee Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="all">All Employees</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
            ))}
          </select>
        </div>

        {/* Attendance Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground sticky left-0 bg-muted/30 z-10">Employee</th>
                    {weekDates.map((d, i) => {
                      const hol = isHoliday(formatDate(d));
                      const rd = isRestDay(d);
                      const isToday = formatDate(d) === formatDate(new Date());
                      return (
                        <th key={i} className={`px-3 py-3 text-center font-semibold text-xs min-w-[130px] ${isToday ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''} ${rd || hol ? 'text-amber-600' : 'text-muted-foreground'}`}>
                          <div>{dayNames[d.getDay()]}</div>
                          <div className="text-lg font-bold">{d.getDate()}</div>
                          {hol && <div className="text-[10px] text-amber-600 font-medium mt-0.5">{hol.name}</div>}
                          {rd && !hol && <div className="text-[10px] text-amber-600 font-medium mt-0.5">Rest Day</div>}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                          </div>
                          <span className="text-sm">{emp.first_name} {emp.last_name}</span>
                        </div>
                      </td>
                      {weekDates.map((d, i) => {
                        const dateStr = formatDate(d);
                        const log = getLog(emp.id, dateStr);
                        const hol = isHoliday(dateStr);
                        const rd = isRestDay(d);
                        const leave = isOnLeave(emp.id, dateStr);
                        const isToday = dateStr === formatDate(new Date());
                        const isSaving = saving === `${emp.id}-${dateStr}`;
                        const defaultStatus = getDefaultStatus(emp.id, dateStr, d);
                        const currentStatus = log?.status || defaultStatus;

                        return (
                          <td key={i} className={`px-3 py-3 align-top ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                            {isSaving ? (
                              <div className="flex items-center justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                            ) : (
                              <div className="space-y-1.5">
                                {/* Status Dropdown */}
                                <select
                                  value={currentStatus}
                                  onChange={e => updateLog(emp.id, dateStr, d, "status", e.target.value)}
                                  className={`w-full px-2 py-1.5 rounded-lg text-xs font-medium border focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                    currentStatus === "present" ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400" :
                                    currentStatus === "late" ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400" :
                                    currentStatus === "absent" ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400" :
                                    currentStatus === "leave" ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400" :
                                    currentStatus === "holiday" || currentStatus === "rest-day" ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600" :
                                    "bg-muted border-border text-muted-foreground"
                                  }`}
                                >
                                  <option value="present">Present</option>
                                  <option value="late">Late</option>
                                  <option value="absent">Absent</option>
                                  <option value="half-day">Half Day</option>
                                  <option value="holiday">Holiday</option>
                                  <option value="rest-day">Rest Day</option>
                                  <option value="leave">On Leave</option>
                                </select>

                                {/* Time In/Out (only for present/late) */}
                                {(currentStatus === "present" || currentStatus === "late") && (
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                      <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                                      <input
                                        type="time"
                                        value={log?.time_in || getDefaultStart(emp.id, d)}
                                        onChange={e => updateLog(emp.id, dateStr, d, "time_in", e.target.value)}
                                        className="w-full px-1.5 py-1 rounded-md border border-border bg-background text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Moon className="w-3 h-3 text-indigo-400 shrink-0" />
                                      <input
                                        type="time"
                                        value={log?.time_out || getDefaultEnd(emp.id, d)}
                                        onChange={e => updateLog(emp.id, dateStr, d, "time_out", e.target.value)}
                                        className="w-full px-1.5 py-1 rounded-md border border-border bg-background text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                      />
                                    </div>
                                    {log?.hours_worked != null && (
                                      <div className="text-[10px] text-muted-foreground text-center">
                                        {log.hours_worked}h
                                        {log.overtime_hours != null && log.overtime_hours > 0 && (
                                          <span className="text-amber-600 font-medium"> (+{log.overtime_hours} OT)</span>
                                        )}
                                      </div>
                                    )}
                                    {log?.tardiness_minutes != null && log.tardiness_minutes > 0 && (
                                      <div className="text-[10px] text-rose-600 font-medium text-center">
                                        Late {log.tardiness_minutes}min
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Leave info */}
                                {leave && (
                                  <div className="text-[10px] text-blue-600 font-medium text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg px-1 py-0.5">
                                    {leave.days_taken}d leave
                                  </div>
                                )}

                                {/* Conflict alert */}
                                {currentStatus === "present" && leave && (
                                  <div className="flex items-center gap-1 text-[10px] text-rose-600 font-medium bg-rose-50 dark:bg-rose-900/20 rounded-lg px-1.5 py-1">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    On leave this day
                                  </div>
                                )}
                                {currentStatus === "present" && hol && (
                                  <div className="flex items-center gap-1 text-[10px] text-amber-600 font-medium bg-amber-50 dark:bg-amber-900/20 rounded-lg px-1.5 py-1">
                                    <AlertTriangle className="w-3 h-3 shrink-0" />
                                    Company holiday
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Holidays & Rest Days Management */}
        <details className="bg-card rounded-2xl border border-border overflow-hidden">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span className="font-semibold">Holidays & Rest Days</span>
            </div>
            <Settings className="w-4 h-4 text-muted-foreground" />
          </summary>
          <div className="border-t border-border p-4 space-y-6">
            {/* Holidays */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold">Company Holidays</h4>
                <button onClick={async () => {
                  const name = prompt("Holiday name:");
                  if (!name) return;
                  const date = prompt("Date (YYYY-MM-DD):");
                  if (!date) return;
                  await supabase.from("hr_holidays").insert({ business_id: businessOwnerId, name, date });
                  await loadData();
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
                  <Plus className="w-3 h-3" /> Add Holiday
                </button>
              </div>
              {holidays.length === 0 ? (
                <p className="text-xs text-muted-foreground">No holidays configured.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {holidays.map(h => (
                    <div key={h.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full text-xs">
                      <span className="font-medium text-amber-700 dark:text-amber-400">{h.name}</span>
                      <span className="text-amber-500">{new Date(h.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      <button onClick={async () => {
                        await supabase.from("hr_holidays").delete().eq("id", h.id);
                        await loadData();
                      }} className="p-0.5 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Rest Days */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold">Rest Days</h4>
                <button onClick={async () => {
                  const day = prompt("Day of week (0=Sunday, 1=Monday, ..., 6=Saturday):");
                  if (day === null) return;
                  const dayNum = parseInt(day);
                  if (isNaN(dayNum) || dayNum < 0 || dayNum > 6) return;
                  const existing = restDays.find(r => r.day_of_week === dayNum);
                  if (existing) { alert("Rest day already set for this day."); return; }
                  await supabase.from("hr_rest_days").insert({ business_id: businessOwnerId, day_of_week: dayNum });
                  await loadData();
                }} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors">
                  <Plus className="w-3 h-3" /> Add Rest Day
                </button>
              </div>
              {restDays.length === 0 ? (
                <p className="text-xs text-muted-foreground">No rest days configured.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {restDays.map(r => (
                    <div key={r.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-full text-xs">
                      <span className="font-medium text-amber-700 dark:text-amber-400">{["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][r.day_of_week]}</span>
                      <button onClick={async () => {
                        await supabase.from("hr_rest_days").delete().eq("id", r.id);
                        await loadData();
                      }} className="p-0.5 rounded-full hover:bg-amber-200 dark:hover:bg-amber-800 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </details>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Present</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Late</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Absent</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> On Leave</span>
          <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-300" /> Holiday/Rest Day</span>
        </div>
      </div>
    </BusinessLayout>
  );
}

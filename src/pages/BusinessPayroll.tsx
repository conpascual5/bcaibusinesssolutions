import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
import { Loader2, Plus, X, Check, DollarSign, Calculator, Users, Clock, Download, Eye } from "lucide-react";

type PayrollRecord = {
  id: string;
  employee_id: string;
  pay_period_start: string;
  pay_period_end: string;
  pay_date: string;
  basic_pay: number;
  overtime_pay: number;
  holiday_pay: number;
  night_differential: number;
  allowances: number;
  bonuses: number;
  gross_pay: number;
  sss_deduction: number;
  philhealth_deduction: number;
  pagibig_deduction: number;
  tax_withholding: number;
  tardiness_deduction: number;
  absences_deduction: number;
  other_deductions: number;
  total_deductions: number;
  net_pay: number;
  hours_worked: number;
  overtime_hours: number;
  absences: number;
  late_minutes: number;
  status: string;
  notes: string | null;
};

type Employee = { id: string; first_name: string; last_name: string; basic_salary: number; hourly_rate: number };

export default function BusinessPayroll() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [form, setForm] = useState({
    employee_id: "", pay_period_start: "", pay_period_end: "", pay_date: new Date().toISOString().split("T")[0],
    basic_pay: "0", overtime_pay: "0", holiday_pay: "0", night_differential: "0", allowances: "0", bonuses: "0",
    sss_deduction: "0", philhealth_deduction: "0", pagibig_deduction: "0", tax_withholding: "0",
    tardiness_deduction: "0", absences_deduction: "0", other_deductions: "0",
    hours_worked: "0", overtime_hours: "0", absences: "0", late_minutes: "0", notes: "",
  });

  const loadData = async () => {
    if (!businessOwnerId) return;
    const [payRes, empRes] = await Promise.all([
      supabase.from("hr_payroll").select("*").order("pay_period_start", { ascending: false }),
      supabase.from("hr_employees").select("id, first_name, last_name, basic_salary, hourly_rate").eq("business_id", businessOwnerId).eq("is_active", true).order("last_name"),
    ]);
    if (payRes.data) setRecords(payRes.data);
    if (empRes.data) setEmployees(empRes.data);
    setLoading(false);
  };

  useEffect(() => { if (businessOwnerId) loadData(); }, [businessOwnerId]);

  const resetForm = () => {
    setForm({
      employee_id: "", pay_period_start: "", pay_period_end: "", pay_date: new Date().toISOString().split("T")[0],
      basic_pay: "0", overtime_pay: "0", holiday_pay: "0", night_differential: "0", allowances: "0", bonuses: "0",
      sss_deduction: "0", philhealth_deduction: "0", pagibig_deduction: "0", tax_withholding: "0",
      tardiness_deduction: "0", absences_deduction: "0", other_deductions: "0",
      hours_worked: "0", overtime_hours: "0", absences: "0", late_minutes: "0", notes: "",
    });
    setShowForm(false);
  };

  const computePay = () => {
    const basic = parseFloat(form.basic_pay) || 0;
    const ot = parseFloat(form.overtime_pay) || 0;
    const holiday = parseFloat(form.holiday_pay) || 0;
    const nightDiff = parseFloat(form.night_differential) || 0;
    const allowances = parseFloat(form.allowances) || 0;
    const bonuses = parseFloat(form.bonuses) || 0;
    const gross = basic + ot + holiday + nightDiff + allowances + bonuses;

    const sss = parseFloat(form.sss_deduction) || 0;
    const philhealth = parseFloat(form.philhealth_deduction) || 0;
    const pagibig = parseFloat(form.pagibig_deduction) || 0;
    const tax = parseFloat(form.tax_withholding) || 0;
    const tardiness = parseFloat(form.tardiness_deduction) || 0;
    const absences = parseFloat(form.absences_deduction) || 0;
    const other = parseFloat(form.other_deductions) || 0;
    const totalDeductions = sss + philhealth + pagibig + tax + tardiness + absences + other;
    const net = gross - totalDeductions;

    return { gross, totalDeductions, net };
  };

  const handleSave = async () => {
    if (!form.employee_id || !form.pay_period_start || !form.pay_period_end || !businessOwnerId) return;
    setSaving(true);
    const { gross, totalDeductions, net } = computePay();
    const payload = {
      business_id: businessOwnerId, employee_id: form.employee_id,
      pay_period_start: form.pay_period_start, pay_period_end: form.pay_period_end, pay_date: form.pay_date,
      basic_pay: parseFloat(form.basic_pay) || 0, overtime_pay: parseFloat(form.overtime_pay) || 0,
      holiday_pay: parseFloat(form.holiday_pay) || 0, night_differential: parseFloat(form.night_differential) || 0,
      allowances: parseFloat(form.allowances) || 0, bonuses: parseFloat(form.bonuses) || 0,
      gross_pay: gross, sss_deduction: parseFloat(form.sss_deduction) || 0,
      philhealth_deduction: parseFloat(form.philhealth_deduction) || 0,
      pagibig_deduction: parseFloat(form.pagibig_deduction) || 0,
      tax_withholding: parseFloat(form.tax_withholding) || 0,
      tardiness_deduction: parseFloat(form.tardiness_deduction) || 0,
      absences_deduction: parseFloat(form.absences_deduction) || 0,
      other_deductions: parseFloat(form.other_deductions) || 0,
      total_deductions: totalDeductions, net_pay: net,
      hours_worked: parseFloat(form.hours_worked) || 0, overtime_hours: parseFloat(form.overtime_hours) || 0,
      absences: parseFloat(form.absences) || 0, late_minutes: parseInt(form.late_minutes) || 0,
      notes: form.notes || null,
    };
    await supabase.from("hr_payroll").insert(payload);
    setSaving(false);
    resetForm();
    loadData();
  };

  // Auto-compute from attendance whenever employee + period are selected
  useEffect(() => {
    if (!form.employee_id || !form.pay_period_start || !form.pay_period_end) return;
    const emp = employees.find(e => e.id === form.employee_id);
    if (!emp) return;

    const computeFromAttendance = async () => {
      const { data: logs } = await supabase
        .from("hr_attendance_logs")
        .select("*")
        .eq("employee_id", form.employee_id)
        .gte("date", form.pay_period_start)
        .lte("date", form.pay_period_end);

      const totalHours = logs?.reduce((s, l) => s + (l.hours_worked || 0), 0) || 0;
      const totalOT = logs?.reduce((s, l) => s + (l.overtime_hours || 0), 0) || 0;
      const totalLate = logs?.reduce((s, l) => s + (l.tardiness_minutes || 0), 0) || 0;
      const absentDays = logs?.filter(l => l.status === "absent").length || 0;

      const hourlyRate = emp.hourly_rate || (emp.basic_salary / 22 / 8) || 100;
      const basicPay = totalHours * hourlyRate;
      const otPay = totalOT * hourlyRate * 1.5;
      const lateDeduction = (totalLate / 60) * hourlyRate;
      const absenceDeduction = absentDays * 8 * hourlyRate;

      setForm(prev => ({
        ...prev,
        basic_pay: basicPay.toFixed(2),
        overtime_pay: otPay.toFixed(2),
        tardiness_deduction: lateDeduction.toFixed(2),
        absences_deduction: absenceDeduction.toFixed(2),
        hours_worked: totalHours.toFixed(2),
        overtime_hours: totalOT.toFixed(2),
        absences: absentDays.toString(),
        late_minutes: totalLate.toString(),
      }));
    };

    computeFromAttendance();
  }, [form.employee_id, form.pay_period_start, form.pay_period_end]);

  const getEmployeeName = (id: string) => {
    const e = employees.find(emp => emp.id === id);
    return e ? `${e.first_name} ${e.last_name}` : "Unknown";
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: "bg-gray-100 text-gray-700 border-gray-200",
      computed: "bg-blue-50 text-blue-700 border-blue-200",
      approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
      paid: "bg-purple-50 text-purple-700 border-purple-200",
    };
    return `text-xs font-medium px-2.5 py-1 rounded-full border ${styles[status] || styles.draft}`;
  };

  const { gross, totalDeductions, net } = computePay();

  return (
    <BusinessLayout title="Payroll Engine" description="Auto-compute and manage employee payroll">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Payroll Entry
          </button>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">New Payroll Entry</h3>
                <span className="text-xs text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full font-medium">Auto-computed from attendance</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Employee *</label>
                  <select value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Select employee...</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Period Start</label>
                  <input type="date" value={form.pay_period_start} onChange={e => setForm(p => ({ ...p, pay_period_start: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Period End</label>
                  <input type="date" value={form.pay_period_end} onChange={e => setForm(p => ({ ...p, pay_period_end: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4 mt-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Hours Worked</label>
                  <input type="number" step="0.01" value={form.hours_worked} onChange={e => setForm(p => ({ ...p, hours_worked: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">OT Hours</label>
                  <input type="number" step="0.01" value={form.overtime_hours} onChange={e => setForm(p => ({ ...p, overtime_hours: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Absences</label>
                  <input type="number" step="0.5" value={form.absences} onChange={e => setForm(p => ({ ...p, absences: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Late Minutes</label>
                  <input type="number" value={form.late_minutes} onChange={e => setForm(p => ({ ...p, late_minutes: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3 mt-4">
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                  <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">Earnings</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span>Basic Pay</span><input type="number" step="0.01" value={form.basic_pay} onChange={e => setForm(p => ({ ...p, basic_pay: e.target.value }))} className="w-28 text-right px-2 py-0.5 border border-border rounded-lg bg-white dark:bg-background" /></div>
                    <div className="flex justify-between"><span>Overtime</span><input type="number" step="0.01" value={form.overtime_pay} onChange={e => setForm(p => ({ ...p, overtime_pay: e.target.value }))} className="w-28 text-right px-2 py-0.5 border border-border rounded-lg bg-white dark:bg-background" /></div>
                    <div className="flex justify-between"><span>Holiday Pay</span><input type="number" step="0.01" value={form.holiday_pay} onChange={e => setForm(p => ({ ...p, holiday_pay: e.target.value }))} className="w-28 text-right px-2 py-0.5 border border-border rounded-lg bg-white dark:bg-background" /></div>
                    <div className="flex justify-between"><span>Night Diff</span><input type="number" step="0.01" value={form.night_differential} onChange={e => setForm(p => ({ ...p, night_differential: e.target.value }))} className="w-28 text-right px-2 py-0.5 border border-border rounded-lg bg-white dark:bg-background" /></div>
                    <div className="flex justify-between"><span>Allowances</span><input type="number" step="0.01" value={form.allowances} onChange={e => setForm(p => ({ ...p, allowances: e.target.value }))} className="w-28 text-right px-2 py-0.5 border border-border rounded-lg bg-white dark:bg-background" /></div>
                    <div className="flex justify-between"><span>Bonuses</span><input type="number" step="0.01" value={form.bonuses} onChange={e => setForm(p => ({ ...p, bonuses: e.target.value }))} className="w-28 text-right px-2 py-0.5 border border-border rounded-lg bg-white dark:bg-background" /></div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-emerald-200"><span>Gross Pay</span><span>₱{gross.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                  <p className="text-xs font-medium text-rose-700 dark:text-rose-400 mb-1">Deductions</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between"><span>SSS</span><input type="number" step="0.01" value={form.sss_deduction} onChange={e => setForm(p => ({ ...p, sss_deduction: e.target.value }))} className="w-28 text-right px-2 py-0.5 border border-border rounded-lg bg-white dark:bg-background" /></div>
                    <div className="flex justify-between"><span>PhilHealth</span><input type="number" step="0.01" value={form.philhealth_deduction} onChange={e => setForm(p => ({ ...p, philhealth_deduction: e.target.value }))} className="w-28 text-right px-2 py-0.5 border border-border rounded-lg bg-white dark:bg-background" /></div>
                    <div className="flex justify-between"><span>Pag-IBIG</span><input type="number" step="0.01" value={form.pagibig_deduction} onChange={e => setForm(p => ({ ...p, pagibig_deduction: e.target.value }))} className="w-28 text-right px-2 py-0.5 border border-border rounded-lg bg-white dark:bg-background" /></div>
                    <div className="flex justify-between"><span>Tax</span><input type="number" step="0.01" value={form.tax_withholding} onChange={e => setForm(p => ({ ...p, tax_withholding: e.target.value }))} className="w-28 text-right px-2 py-0.5 border border-border rounded-lg bg-white dark:bg-background" /></div>
                    <div className="flex justify-between"><span>Tardiness</span><input type="number" step="0.01" value={form.tardiness_deduction} onChange={e => setForm(p => ({ ...p, tardiness_deduction: e.target.value }))} className="w-28 text-right px-2 py-0.5 border border-border rounded-lg bg-white dark:bg-background" /></div>
                    <div className="flex justify-between"><span>Absences</span><input type="number" step="0.01" value={form.absences_deduction} onChange={e => setForm(p => ({ ...p, absences_deduction: e.target.value }))} className="w-28 text-right px-2 py-0.5 border border-border rounded-lg bg-white dark:bg-background" /></div>
                    <div className="flex justify-between"><span>Other</span><input type="number" step="0.01" value={form.other_deductions} onChange={e => setForm(p => ({ ...p, other_deductions: e.target.value }))} className="w-28 text-right px-2 py-0.5 border border-border rounded-lg bg-white dark:bg-background" /></div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-rose-200"><span>Total Deductions</span><span className="text-rose-600">-₱{totalDeductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 flex flex-col justify-center items-center">
                  <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-1">Net Pay</p>
                  <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-300">₱{net.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                  <p className="text-xs text-indigo-500 mt-1">{getEmployeeName(form.employee_id) || "Select employee"}</p>
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs font-medium text-muted-foreground block mb-1">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={handleSave} disabled={saving || !form.employee_id || !form.pay_period_start} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Save Payroll Entry
                </button>
                <button onClick={resetForm} className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {/* Payroll Records */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border font-semibold text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-500" />
              Payroll Records
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Employee</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Period</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Gross</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Deductions</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Net Pay</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">{getEmployeeName(r.employee_id)}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{r.pay_period_start} → {r.pay_period_end}</td>
                      <td className="px-4 py-3 text-right">₱{r.gross_pay.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-4 py-3 text-right text-rose-600">-₱{r.total_deductions.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-4 py-3 text-right font-semibold">₱{r.net_pay.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-4 py-3"><span className={statusBadge(r.status)}>{r.status}</span></td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelectedRecord(r)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Eye className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No payroll records yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payroll Summary */}
          {records.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-xs text-muted-foreground mb-1">Total Gross</p>
                <p className="text-xl font-bold">₱{records.reduce((s, r) => s + r.gross_pay, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-xs text-muted-foreground mb-1">Total Deductions</p>
                <p className="text-xl font-bold text-rose-600">-₱{records.reduce((s, r) => s + r.total_deductions, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-xs text-muted-foreground mb-1">Total Net Pay</p>
                <p className="text-xl font-bold text-emerald-600">₱{records.reduce((s, r) => s + r.net_pay, 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5">
                <p className="text-xs text-muted-foreground mb-1">Employees Paid</p>
                <p className="text-xl font-bold">{new Set(records.map(r => r.employee_id)).size}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </BusinessLayout>
  );
}

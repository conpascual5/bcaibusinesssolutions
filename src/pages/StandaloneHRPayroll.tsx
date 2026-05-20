import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/providers/auth"
import { useHRAccess } from "@/providers/hr-access"
import { supabase } from "@/integrations/supabase/client"
import HRLayout from "@/components/HRLayout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LayoutDashboard, Calendar, Receipt, Calculator, Shield, Clock, Play, FileSpreadsheet, UserCheck, Loader2, Settings, Users, DollarSign, Percent, BookOpen, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import StandalonePayrollDashboard from "@/components/payroll/StandalonePayrollDashboard"
import StandalonePayrollPeriods from "@/components/payroll/StandalonePayrollPeriods"
import StandalonePayslipViewer from "@/components/payroll/StandalonePayslipViewer"
import StandaloneDeductionManager from "@/components/payroll/StandaloneDeductionManager"

// ─── Types ───────────────────────────────────────────────────────────────
export interface Employee {
  id: string; business_id: string; first_name: string; last_name: string; email: string | null
  phone: string | null; position: string | null; department: string | null; hire_date: string
  resignation_date: string | null; is_active: boolean; gender: string | null; notes: string | null
  daily_rate: number; basic_salary: number; hourly_rate: number
  sss_number: string | null; philhealth_number: string | null; pagibig_number: string | null; tin_number: string | null
  created_at: string; updated_at: string
}

export interface PayrollPeriod { id: string; business_id: string; name: string; start_date: string; end_date: string; pay_date: string | null; is_closed: boolean; created_at: string }
export interface Payslip { id: string; business_id: string; employee_id: string; payroll_period_id: string; daily_rate: number; total_days_worked: number; total_hours_worked: number; total_tardiness_minutes: number; total_absences: number; total_leave_days: number; gross_pay: number; total_deductions: number; net_pay: number; deductions_breakdown: any; status: string; created_at: string }
export interface Deduction { id: string; business_id: string; name: string; code: string; description: string | null; amount_type: string; amount: number; is_mandatory: boolean; is_active: boolean; created_at: string }
export interface StatutoryBracket { id: string; business_id: string; deduction_type: string; min_compensation: number | null; max_compensation: number | null; employee_share: number | null; employer_share: number | null; is_active: boolean; effective_date: string; created_at: string }
export interface EmployeeDeduction { id: string; employee_id: string; deduction_type: string; monthly_compensation: number | null; employee_share: number | null; employer_share: number | null; is_overridden: boolean; created_at: string }

const fmtCurrency = (n: number) => new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", minimumFractionDigits: 2 }).format(n)

// ─── Employee Deduction Overrides Tab ────────────────────────────────────
function EmployeeDeductionOverridesTab({ employees, employeeDeductions, onRefresh }: {
  employees: Employee[]; employeeDeductions: EmployeeDeduction[]; onRefresh: () => Promise<void>
}) {
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [saving, setSaving] = useState(false)
  const [overrides, setOverrides] = useState<Record<string, { monthly_compensation: number; employee_share: number; employer_share: number; is_overridden: boolean }>>({})

  const selectEmployee = (id: string) => {
    setSelectedEmployee(id)
    const empDeds = employeeDeductions.filter(d => d.employee_id === id)
    const map: Record<string, any> = {}
    for (const d of empDeds) {
      map[d.deduction_type] = {
        monthly_compensation: Number(d.monthly_compensation || 0),
        employee_share: Number(d.employee_share || 0),
        employer_share: Number(d.employer_share || 0),
        is_overridden: d.is_overridden
      }
    }
    for (const t of ["SSS", "PhilHealth", "Pag-IBIG", "BIR"]) {
      if (!map[t]) map[t] = { monthly_compensation: 0, employee_share: 0, employer_share: 0, is_overridden: false }
    }
    setOverrides(map)
  }

  const saveOverrides = async () => {
    if (!selectedEmployee) return
    setSaving(true)
    for (const [type, data] of Object.entries(overrides)) {
      const existing = employeeDeductions.find(d => d.employee_id === selectedEmployee && d.deduction_type === type)
      const payload = {
        employee_id: selectedEmployee,
        deduction_type: type,
        monthly_compensation: data.monthly_compensation || null,
        employee_share: data.employee_share || null,
        employer_share: data.employer_share || null,
        is_overridden: data.is_overridden,
      }
      if (existing) {
        await supabase.from("hr_employee_deductions").update(payload).eq("id", existing.id)
      } else {
        await supabase.from("hr_employee_deductions").insert(payload)
      }
    }
    setSaving(false)
    await onRefresh()
  }

  const selectedEmp = employees.find(e => e.id === selectedEmployee)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-xs">
          <select value={selectedEmployee} onChange={e => selectEmployee(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select Employee...</option>
            {employees.filter(e => e.is_active).map(e => (
              <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedEmp && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">{selectedEmp.first_name} {selectedEmp.last_name}</h3>
              <p className="text-sm text-muted-foreground">Monthly Salary: {fmtCurrency(selectedEmp.basic_salary)}</p>
            </div>
            <button onClick={saveOverrides} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
              Save Overrides
            </button>
          </div>

          <div className="space-y-4">
            {["SSS", "PhilHealth", "Pag-IBIG", "BIR"].map(type => {
              const data = overrides[type] || { monthly_compensation: 0, employee_share: 0, employer_share: 0, is_overridden: false }
              return (
                <div key={type} className="bg-muted/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-sm">{type}</h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={data.is_overridden} onChange={e => setOverrides({ ...overrides, [type]: { ...data, is_overridden: e.target.checked } })} className="rounded border-border" />
                      <span className="text-xs text-muted-foreground">Override</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Monthly Compensation</label>
                      <input type="number" value={data.monthly_compensation} onChange={e => setOverrides({ ...overrides, [type]: { ...data, monthly_compensation: Number(e.target.value) } })}
                        disabled={!data.is_overridden}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Employee Share</label>
                      <input type="number" value={data.employee_share} onChange={e => setOverrides({ ...overrides, [type]: { ...data, employee_share: Number(e.target.value) } })}
                        disabled={!data.is_overridden}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Employer Share</label>
                      <input type="number" value={data.employer_share} onChange={e => setOverrides({ ...overrides, [type]: { ...data, employer_share: Number(e.target.value) } })}
                        disabled={!data.is_overridden}
                        className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Cutoff Settings Tab ─────────────────────────────────────────────────
function CutoffSettingsTab({ businessOwnerId }: { businessOwnerId: string | null }) {
  const [settings, setSettings] = useState({
    sss_on_first_cutoff: true, sss_on_second_cutoff: true,
    philhealth_on_first_cutoff: true, philhealth_on_second_cutoff: true,
    pagibig_on_first_cutoff: true, pagibig_on_second_cutoff: true,
  })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!businessOwnerId) return
    supabase.from("hr_company").select("*").eq("business_id", businessOwnerId).single().then(({ data }) => {
      if (data) {
        setSettings({
          sss_on_first_cutoff: data.sss_on_first_cutoff ?? true,
          sss_on_second_cutoff: data.sss_on_second_cutoff ?? true,
          philhealth_on_first_cutoff: data.philhealth_on_first_cutoff ?? true,
          philhealth_on_second_cutoff: data.philhealth_on_second_cutoff ?? true,
          pagibig_on_first_cutoff: data.pagibig_on_first_cutoff ?? true,
          pagibig_on_second_cutoff: data.pagibig_on_second_cutoff ?? true,
        })
      }
      setLoading(false)
    })
  }, [businessOwnerId])

  const save = async () => {
    setSaving(true)
    await supabase.from("hr_company").update(settings).eq("business_id", businessOwnerId)
    setSaving(false)
  }

  if (loading) return <div className="text-center py-12 text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-2">Deduction Cutoff Settings</h3>
        <p className="text-sm text-muted-foreground mb-6">Choose when each statutory deduction is applied — on the 1st cutoff (1st-15th), the 2nd cutoff (16th-end), or both.</p>

        <div className="space-y-5">
          {[
            { label: "SSS", key: "sss" },
            { label: "PhilHealth", key: "philhealth" },
            { label: "Pag-IBIG", key: "pagibig" },
          ].map(({ label, key }) => (
            <div key={key} className="bg-muted/30 rounded-xl p-4">
              <h4 className="font-semibold text-sm mb-3">{label}</h4>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(settings as any)[`${key}_on_first_cutoff`]}
                    onChange={e => setSettings({ ...settings, [`${key}_on_first_cutoff`]: e.target.checked })}
                    className="rounded border-border" />
                  <span className="text-sm">1st Cutoff (1st-15th)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(settings as any)[`${key}_on_second_cutoff`]}
                    onChange={e => setSettings({ ...settings, [`${key}_on_second_cutoff`]: e.target.checked })}
                    className="rounded border-border" />
                  <span className="text-sm">2nd Cutoff (16th-end)</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <button onClick={save} disabled={saving}
          className="mt-6 w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Settings"}
        </button>
      </div>
    </div>
  )
}

// ─── Statutory Bracket Manager Tab ──────────────────────────────────────
function StatutoryBracketManager({ businessOwnerId, brackets, onRefresh }: {
  businessOwnerId: string | null; brackets: StatutoryBracket[]; onRefresh: () => Promise<void>
}) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<StatutoryBracket | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    deduction_type: "SSS", min_compensation: 0, max_compensation: 9999999.99,
    employee_share: 0, employer_share: 0, effective_date: new Date().toISOString().split("T")[0]
  })

  const openNew = () => {
    setEditing(null)
    setForm({ deduction_type: "SSS", min_compensation: 0, max_compensation: 9999999.99, employee_share: 0, employer_share: 0, effective_date: new Date().toISOString().split("T")[0] })
    setShowForm(true)
  }

  const openEdit = (b: StatutoryBracket) => {
    setEditing(b)
    setForm({
      deduction_type: b.deduction_type,
      min_compensation: Number(b.min_compensation || 0),
      max_compensation: Number(b.max_compensation || 9999999.99),
      employee_share: Number(b.employee_share || 0),
      employer_share: Number(b.employer_share || 0),
      effective_date: b.effective_date || new Date().toISOString().split("T")[0]
    })
    setShowForm(true)
  }

  const save = async () => {
    if (!form.deduction_type) return
    setSaving(true)
    const payload = {
      business_id: businessOwnerId,
      deduction_type: form.deduction_type,
      min_compensation: form.min_compensation,
      max_compensation: form.max_compensation,
      employee_share: form.employee_share,
      employer_share: form.employer_share,
      effective_date: form.effective_date,
    }
    if (editing) {
      const { error } = await supabase.from("hr_statutory_brackets").update(payload).eq("id", editing.id)
      if (error) { alert(`Failed: ${error.message}`); setSaving(false); return }
    } else {
      const { error } = await supabase.from("hr_statutory_brackets").insert(payload)
      if (error) { alert(`Failed: ${error.message}`); setSaving(false); return }
    }
    setSaving(false); setShowForm(false); setEditing(null)
    await onRefresh()
  }

  const deleteBracket = async (id: string) => {
    await supabase.from("hr_statutory_brackets").delete().eq("id", id)
    await onRefresh()
  }

  const grouped = brackets.reduce((acc, b) => {
    if (!acc[b.deduction_type]) acc[b.deduction_type] = []
    acc[b.deduction_type].push(b)
    return acc
  }, {} as Record<string, StatutoryBracket[]>)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={openNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
          <BookOpen className="w-4 h-4" /> Add Bracket
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{editing ? "Edit" : "Add"} Statutory Bracket</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Clock className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Deduction Type</label>
                <select value={form.deduction_type} onChange={e => setForm({ ...form, deduction_type: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="SSS">SSS</option>
                  <option value="PhilHealth">PhilHealth</option>
                  <option value="Pag-IBIG">Pag-IBIG</option>
                  <option value="BIR">BIR Withholding Tax</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Min Compensation</label>
                  <input type="number" value={form.min_compensation} onChange={e => setForm({ ...form, min_compensation: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Max Compensation</label>
                  <input type="number" value={form.max_compensation} onChange={e => setForm({ ...form, max_compensation: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Employee Share</label>
                  <input type="number" value={form.employee_share} onChange={e => setForm({ ...form, employee_share: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Employer Share</label>
                  <input type="number" value={form.employer_share} onChange={e => setForm({ ...form, employer_share: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Effective Date</label>
                <input type="date" value={form.effective_date} onChange={e => setForm({ ...form, effective_date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={save} disabled={saving}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editing ? "Update Bracket" : "Add Bracket"}
              </button>
            </div>
          </div>
        </div>
      )}

      {Object.entries(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No statutory brackets configured yet. Add SSS, PhilHealth, Pag-IBIG, and BIR brackets.</div>
      ) : Object.entries(grouped).map(([type, items]) => (
        <div key={type} className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 bg-muted/30 border-b border-border">
            <h4 className="font-semibold">{type} Brackets</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Min</th>
                  <th className="text-left py-2.5 px-4 font-medium text-muted-foreground">Max</th>
                  <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Employee</th>
                  <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Employer</th>
                  <th className="text-center py-2.5 px-4 font-medium text-muted-foreground">Active</th>
                  <th className="text-right py-2.5 px-4 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(b => (
                  <tr key={b.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2.5 px-4">{b.min_compensation ? fmtCurrency(Number(b.min_compensation)) : "0"}</td>
                    <td className="py-2.5 px-4">{b.max_compensation ? fmtCurrency(Number(b.max_compensation)) : "∞"}</td>
                    <td className="py-2.5 px-4 text-right font-medium">{b.employee_share ? fmtCurrency(Number(b.employee_share)) : "0"}</td>
                    <td className="py-2.5 px-4 text-right font-medium">{b.employer_share ? fmtCurrency(Number(b.employer_share)) : "0"}</td>
                    <td className="py-2.5 px-4 text-center">{b.is_active ? "Yes" : "No"}</td>
                    <td className="py-2.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                          <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={() => deleteBracket(b.id)} className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────
export default function StandaloneHRPayroll() {
  const { user } = useAuth()
  const { hrBusinessId: businessOwnerId } = useHRAccess()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [loading, setLoading] = useState(true)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([])
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [deductions, setDeductions] = useState<Deduction[]>([])
  const [brackets, setBrackets] = useState<StatutoryBracket[]>([])
  const [employeeDeductions, setEmployeeDeductions] = useState<EmployeeDeduction[]>([])

  const getEmployee = useCallback((id: string) => employees.find(e => e.id === id), [employees])

  const loadData = useCallback(async () => {
    if (!businessOwnerId) return
    const [
      { data: empData }, { data: periodData }, { data: payslipData },
      { data: dedData }, { data: bracketData }, { data: empDedData }
    ] = await Promise.all([
      supabase.from("hr_employees").select("*").eq("business_id", businessOwnerId),
      supabase.from("hr_payroll_periods").select("*").eq("business_id", businessOwnerId).order("start_date", { ascending: false }),
      supabase.from("hr_payslips").select("*").eq("business_id", businessOwnerId).order("created_at", { ascending: false }),
      supabase.from("hr_deductions").select("*").eq("business_id", businessOwnerId).eq("is_active", true),
      supabase.from("hr_statutory_brackets").select("*").eq("business_id", businessOwnerId).eq("is_active", true).order("min_compensation", { ascending: true }),
      supabase.from("hr_employee_deductions").select("*"),
    ])
    setEmployees(empData || [])
    setPayrollPeriods(periodData || [])
    setPayslips(payslipData || [])
    setDeductions(dedData || [])
    setBrackets(bracketData || [])
    setEmployeeDeductions(empDedData || [])
    setLoading(false)
  }, [businessOwnerId])

  useEffect(() => { loadData() }, [loadData])

  const generatePayslips = async (periodId: string) => {
    if (!businessOwnerId) return
    const period = payrollPeriods.find(p => p.id === periodId)
    if (!period) return

    const activeEmployees = employees.filter(e => e.is_active)
    let generated = 0
    let errors = 0

    for (const emp of activeEmployees) {
      try {
        // 1. Rate Calculation Engine: Daily Rate, Hourly Rate, Per-Minute Rate
        const monthlySalary = Number(emp.basic_salary) || 0
        const dailyRate = monthlySalary > 0 ? (monthlySalary * 12) / 261 : 0
        const hourlyRate = dailyRate / 8
        const perMinuteRate = hourlyRate / 60

        // 2. Get attendance for this period
        const { data: attendance } = await supabase
          .from("hr_attendance_logs")
          .select("*")
          .eq("employee_id", emp.id)
          .gte("date", period.start_date)
          .lte("date", period.end_date)

        // 3. Get schedules to determine working days
        const { data: schedules } = await supabase
          .from("hr_employee_schedules")
          .select("*")
          .eq("employee_id", emp.id)

        // 4. Get approved leave requests for this period
        const { data: leaves } = await supabase
          .from("hr_leave_requests")
          .select("*")
          .eq("employee_id", emp.id)
          .eq("status", "approved")
          .gte("start_date", period.start_date)
          .lte("end_date", period.end_date)

        // 5. Calculate working days in period
        const start = new Date(period.start_date)
        const end = new Date(period.end_date)
        const totalCalendarDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

        const scheduleMap: Record<number, boolean> = {}
        if (schedules) {
          for (const s of schedules) {
            scheduleMap[s.day_of_week] = s.is_rest_day || false
          }
        }

        let totalWorkingDays = 0
        const current = new Date(start)
        for (let i = 0; i < totalCalendarDays; i++) {
          const dow = current.getDay()
          if (!scheduleMap[dow]) totalWorkingDays++
          current.setDate(current.getDate() + 1)
        }

        // 6. Calculate attendance stats
        const attendanceMap: Record<string, any> = {}
        if (attendance) {
          for (const a of attendance) {
            attendanceMap[a.date] = a
          }
        }

        let daysPresent = 0
        let totalHoursWorked = 0
        let totalTardinessMinutes = 0
        let totalAbsences = 0
        let totalLeaveDays = 0

        const leaveDaysSet = new Set<string>()
        if (leaves) {
          for (const lv of leaves) {
            const lvStart = new Date(lv.start_date)
            const lvEnd = new Date(lv.end_date)
            const lvCurrent = new Date(lvStart)
            while (lvCurrent <= lvEnd) {
              const dateStr = lvCurrent.toISOString().split("T")[0]
              leaveDaysSet.add(dateStr)
              lvCurrent.setDate(lvCurrent.getDate() + 1)
            }
          }
        }

        const periodCurrent = new Date(start)
        for (let i = 0; i < totalCalendarDays; i++) {
          const dateStr = periodCurrent.toISOString().split("T")[0]
          const dow = periodCurrent.getDay()

          if (scheduleMap[dow]) {
            periodCurrent.setDate(periodCurrent.getDate() + 1)
            continue
          }

          if (leaveDaysSet.has(dateStr)) {
            totalLeaveDays++
          } else if (attendanceMap[dateStr]) {
            const att = attendanceMap[dateStr]
            daysPresent++
            totalHoursWorked += Number(att.hours_worked || 0)
            totalTardinessMinutes += Number(att.tardiness_minutes || 0)
          } else {
            totalAbsences++
          }

          periodCurrent.setDate(periodCurrent.getDate() + 1)
        }

        // 7. Gross Pay = Daily Rate x (Days Present + Leave Days)
        const grossPay = dailyRate * (daysPresent + totalLeaveDays)

        // 8. Automated Time Deductions (before statutory deductions)
        const tardinessDeduction = perMinuteRate * totalTardinessMinutes
        const absencesDeduction = dailyRate * totalAbsences
        const timeDeductions = tardinessDeduction + absencesDeduction

        // 9. Philippine Statutory Deductions from dynamic lookup tables
        const effectiveSalary = monthlySalary

        // SSS bracket lookup
        const sssBracket = brackets.find(b =>
          b.deduction_type === "SSS" &&
          effectiveSalary >= Number(b.min_compensation || 0) &&
          effectiveSalary <= Number(b.max_compensation || 9999999.99)
        )
        const sssEmployee = Number(sssBracket?.employee_share || 0)

        // PhilHealth bracket lookup (default: 5% split 50/50)
        const philhealthBracket = brackets.find(b =>
          b.deduction_type === "PhilHealth" &&
          effectiveSalary >= Number(b.min_compensation || 0) &&
          effectiveSalary <= Number(b.max_compensation || 9999999.99)
        )
        const philhealthEmployee = Number(philhealthBracket?.employee_share || (effectiveSalary * 0.05) / 2)

        // Pag-IBIG bracket lookup
        const pagibigBracket = brackets.find(b =>
          b.deduction_type === "Pag-IBIG" &&
          effectiveSalary >= Number(b.min_compensation || 0) &&
          effectiveSalary <= Number(b.max_compensation || 9999999.99)
        )
        const pagibigEmployee = Number(pagibigBracket?.employee_share || 0)

        // 10. Check cutoff settings from company
        const { data: company } = await supabase
          .from("hr_company")
          .select("*")
          .eq("business_id", businessOwnerId)
          .single()

        const periodEndDay = new Date(period.end_date).getDate()
        const isFirstCutoff = periodEndDay <= 15

        // Apply deductions based on cutoff settings
        const applySSS = company ? (
          isFirstCutoff ? company.sss_on_first_cutoff : company.sss_on_second_cutoff
        ) : true
        const applyPhilHealth = company ? (
          isFirstCutoff ? company.philhealth_on_first_cutoff : company.philhealth_on_second_cutoff
        ) : true
        const applyPagIBIG = company ? (
          isFirstCutoff ? company.pagibig_on_first_cutoff : company.pagibig_on_second_cutoff
        ) : true

        const sssDed = applySSS ? sssEmployee : 0
        const philhealthDed = applyPhilHealth ? philhealthEmployee : 0
        const pagibigDed = applyPagIBIG ? pagibigEmployee : 0

        // 11. BIR Withholding Tax (strict order: Gross Pay - Time Deductions - SSS - PhilHealth - Pag-IBIG = Net Taxable Income)
        const totalStatutoryDeductions = sssDed + philhealthDed + pagibigDed
        const netTaxableIncome = grossPay - timeDeductions - totalStatutoryDeductions

        // BIR bracket lookup
        const birBracket = brackets.find(b =>
          b.deduction_type === "BIR" &&
          netTaxableIncome >= Number(b.min_compensation || 0) &&
          netTaxableIncome <= Number(b.max_compensation || 9999999.99)
        )
        const birWithholding = Number(birBracket?.employee_share || 0)

        // 12. Final computation
        const totalDeductions = timeDeductions + totalStatutoryDeductions + birWithholding
        const netPay = grossPay - totalDeductions

        // 13. Build deductions breakdown
        const deductionsBreakdown = [
          { name: "Tardiness", code: "TARD", amount: Math.round(tardinessDeduction * 100) / 100 },
          { name: "Absences", code: "ABS", amount: Math.round(absencesDeduction * 100) / 100 },
          { name: "SSS", code: "SSS", amount: Math.round(sssDed * 100) / 100 },
          { name: "PhilHealth", code: "PHILHEALTH", amount: Math.round(philhealthDed * 100) / 100 },
          { name: "Pag-IBIG", code: "PAGIBIG", amount: Math.round(pagibigDed * 100) / 100 },
          { name: "BIR Withholding Tax", code: "BIR", amount: Math.round(birWithholding * 100) / 100 },
        ].filter(d => d.amount > 0)

        // 14. Check if payslip already exists for this employee + period
        const { data: existingPayslip } = await supabase
          .from("hr_payslips")
          .select("id")
          .eq("employee_id", emp.id)
          .eq("payroll_period_id", periodId)
          .single()

        const payslipData = {
          business_id: businessOwnerId,
          employee_id: emp.id,
          payroll_period_id: periodId,
          daily_rate: Math.round(dailyRate * 100) / 100,
          total_days_worked: daysPresent + totalLeaveDays,
          total_hours_worked: Math.round(totalHoursWorked * 100) / 100,
          total_tardiness_minutes: totalTardinessMinutes,
          total_absences: totalAbsences,
          total_leave_days: totalLeaveDays,
          gross_pay: Math.round(grossPay * 100) / 100,
          total_deductions: Math.round(totalDeductions * 100) / 100,
          net_pay: Math.round(netPay * 100) / 100,
          deductions_breakdown: deductionsBreakdown,
          status: "draft",
        }

        if (existingPayslip) {
          await supabase.from("hr_payslips").update(payslipData).eq("id", existingPayslip.id)
        } else {
          await supabase.from("hr_payslips").insert(payslipData)
        }
        generated++
      } catch (err) {
        console.error("[StandaloneHRPayroll] Error generating payslip for", emp.first_name, emp.last_name, err)
        errors++
      }
    }

    toast({
      title: "Payslips Generated",
      description: `${generated} payslip(s) generated. ${errors > 0 ? `${errors} error(s).` : ""}`,
    })
    await loadData()
  }

  const updatePayslipStatus = async (id: string, status: string) => {
    await supabase.from("hr_payslips").update({ status }).eq("id", id)
    await loadData()
  }

  if (loading) {
    return (
      <HRLayout title="Payroll Engine">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
            <p className="text-muted-foreground">Loading payroll data...</p>
          </div>
        </div>
      </HRLayout>
    )
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "periods", label: "Periods", icon: Calendar },
    { id: "payslips", label: "Payslips", icon: Receipt },
    { id: "deductions", label: "Deductions", icon: Calculator },
    { id: "statutory", label: "Statutory Brackets", icon: BookOpen },
    { id: "overrides", label: "Employee Overrides", icon: Users },
    { id: "cutoffs", label: "Cutoff Settings", icon: Settings },
  ]

  return (
    <HRLayout title="Payroll Engine">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Payroll Management</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {employees.filter(e => e.is_active).length} active employees | {payrollPeriods.length} periods | {payslips.length} payslips
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="overflow-x-auto -mx-4 px-4">
            <TabsList className="inline-flex gap-1 bg-muted/50 p-1 rounded-2xl">
              {tabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:shadow-sm transition-all">
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="dashboard">
            <StandalonePayrollDashboard
              employees={employees} payrollPeriods={payrollPeriods}
              payslips={payslips} deductions={deductions}
              onGenerate={generatePayslips} getEmployee={getEmployee} fmtCurrency={fmtCurrency} />
          </TabsContent>

          <TabsContent value="periods">
            <StandalonePayrollPeriods businessOwnerId={businessOwnerId} payrollPeriods={payrollPeriods} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="payslips">
            <StandalonePayslipViewer
              payslips={payslips} payrollPeriods={payrollPeriods} employees={employees}
              getEmployee={getEmployee} updateStatus={updatePayslipStatus} fmtCurrency={fmtCurrency} />
          </TabsContent>

          <TabsContent value="deductions">
            <StandaloneDeductionManager businessOwnerId={businessOwnerId} deductions={deductions} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="statutory">
            <StatutoryBracketManager businessOwnerId={businessOwnerId} brackets={brackets} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="overrides">
            <EmployeeDeductionOverridesTab employees={employees} employeeDeductions={employeeDeductions} onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="cutoffs">
            <CutoffSettingsTab businessOwnerId={businessOwnerId} />
          </TabsContent>
        </Tabs>
      </div>
    </HRLayout>
  )
}

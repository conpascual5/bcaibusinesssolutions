import { useState } from "react"
import { Calendar, Clock, Shield, Loader2 } from "lucide-react"
import { supabase } from "@/integrations/supabase/client"
import type { PayrollPeriod } from "@/pages/StandaloneHRPayroll"

interface Props {
  businessOwnerId: string | null
  payrollPeriods: PayrollPeriod[]
  onRefresh: () => Promise<void>
}

export default function StandalonePayrollPeriods({ businessOwnerId, payrollPeriods, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: "", start_date: "", end_date: "", pay_date: "" })

  const save = async () => {
    if (!form.name || !form.start_date || !form.end_date) return
    setSaving(true)
    const { error } = await supabase.from("hr_payroll_periods").insert({
      business_id: businessOwnerId, name: form.name,
      start_date: form.start_date, end_date: form.end_date,
      pay_date: form.pay_date || null,
    })
    if (error) { alert(`Failed: ${error.message}`); setSaving(false); return }
    setSaving(false); setShowForm(false)
    setForm({ name: "", start_date: "", end_date: "", pay_date: "" })
    await onRefresh()
  }

  const closePeriod = async (id: string) => {
    await supabase.from("hr_payroll_periods").update({ is_closed: true }).eq("id", id)
    await onRefresh()
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
          <Calendar className="w-4 h-4" /> New Payroll Period
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">New Payroll Period</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Clock className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Period Name *</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. May 1-15, 2025" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Date *</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pay Date (optional)</label>
                <input type="date" value={form.pay_date} onChange={e => setForm({ ...form, pay_date: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <button onClick={save} disabled={saving}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Create Period"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {payrollPeriods.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No payroll periods yet.</div>
        ) : payrollPeriods.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{p.name}</h4>
                {p.is_closed && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                    <Shield className="w-3 h-3" /> Closed
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {p.start_date} to {p.end_date}
                {p.pay_date && <> | Pay date: {p.pay_date}</>}
              </p>
            </div>
            {!p.is_closed && (
              <button onClick={() => closePeriod(p.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 transition-colors">
                <Shield className="w-3 h-3" /> Close Period
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

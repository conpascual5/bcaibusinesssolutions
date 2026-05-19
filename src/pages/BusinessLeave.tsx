import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useBusinessTeam } from "@/providers/business-team";
import { supabase } from "@/integrations/supabase/client";
import BusinessLayout from "@/components/BusinessLayout";
import {
  Loader2, Plus, Pencil, Trash2, X, Calendar, Umbrella,
  AlertTriangle, CheckCircle2, Users, Settings
} from "lucide-react";

type Employee = { id: string; first_name: string; last_name: string; is_active: boolean };
type LeaveType = { id: string; business_id: string; code: string; name: string; description: string | null; max_days_per_year: number; is_active: boolean };
type LeaveRequest = { id: string; employee_id: string; leave_type_id: string; start_date: string; end_date: string; days_taken: number; is_half_day: boolean; reason: string | null; status: string };
type LeaveEntitlement = { id: string; employee_id: string; leave_type_id: string; year: number; max_days: number };

export default function BusinessLeave() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [entitlements, setEntitlements] = useState<LeaveEntitlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"requests" | "types" | "entitlements">("requests");

  // Leave request form
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqForm, setReqForm] = useState({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", is_half_day: false, reason: "" });
  const [saving, setSaving] = useState(false);

  // Leave type form
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);
  const [typeForm, setTypeForm] = useState({ code: "", name: "", description: "", max_days_per_year: 10 });

  // Entitlement form
  const [showEntForm, setShowEntForm] = useState(false);
  const [entForm, setEntForm] = useState({ employee_id: "", leave_type_id: "", year: new Date().getFullYear(), max_days: 10 });

  const currentYear = new Date().getFullYear();

  const loadData = async () => {
    if (!businessOwnerId) return;
    const [empRes, typeRes, reqRes, entRes] = await Promise.all([
      supabase.from("hr_employees").select("id, first_name, last_name, is_active").eq("business_id", businessOwnerId).order("last_name"),
      supabase.from("hr_leave_types").select("*").eq("business_id", businessOwnerId).order("name"),
      supabase.from("hr_leave_requests").select("*").order("start_date", { ascending: false }),
      supabase.from("hr_leave_entitlements").select("*"),
    ]);
    if (empRes.data) setEmployees(empRes.data);
    if (typeRes.data) setLeaveTypes(typeRes.data);
    if (reqRes.data) setRequests(reqRes.data);
    if (entRes.data) setEntitlements(entRes.data);
    setLoading(false);
  };

  useEffect(() => { if (businessOwnerId) loadData(); }, [businessOwnerId]);

  // Calculate remaining balance
  const getBalance = (empId: string, typeId: string): { max: number; taken: number; remaining: number } => {
    const ent = entitlements.find(e => e.employee_id === empId && e.leave_type_id === typeId && e.year === currentYear);
    const max = ent?.max_days || leaveTypes.find(t => t.id === typeId)?.max_days_per_year || 10;
    const taken = requests
      .filter(r => r.employee_id === empId && r.leave_type_id === typeId && r.status === "approved" && r.start_date.startsWith(String(currentYear)))
      .reduce((sum, r) => sum + r.days_taken, 0);
    return { max, taken, remaining: max - taken };
  };

  const saveRequest = async () => {
    if (!reqForm.employee_id || !reqForm.leave_type_id || !reqForm.start_date || !reqForm.end_date) {
      console.error("[BusinessLeave] Missing required fields", reqForm);
      return;
    }
    setSaving(true);

    // Calculate days
    const start = new Date(reqForm.start_date);
    const end = new Date(reqForm.end_date);
    let days = 0;
    const d = new Date(start);
    while (d <= end) { days++; d.setDate(d.getDate() + 1); }
    if (reqForm.is_half_day) days = Math.max(0.5, days - 0.5);

    // Check balance
    const balance = getBalance(reqForm.employee_id, reqForm.leave_type_id);
    if (days > balance.remaining) {
      alert(`Insufficient leave balance! Only ${balance.remaining} days remaining.`);
      setSaving(false);
      return;
    }

    console.log("[BusinessLeave] Inserting leave request", { employee_id: reqForm.employee_id, leave_type_id: reqForm.leave_type_id, start_date: reqForm.start_date, end_date: reqForm.end_date, days_taken: days, is_half_day: reqForm.is_half_day, reason: reqForm.reason, status: "approved" });

    const { data, error } = await supabase.from("hr_leave_requests").insert({
      employee_id: reqForm.employee_id,
      leave_type_id: reqForm.leave_type_id,
      start_date: reqForm.start_date,
      end_date: reqForm.end_date,
      days_taken: days,
      is_half_day: reqForm.is_half_day,
      reason: reqForm.reason || null,
      status: "approved",
    }).select();

    if (error) {
      console.error("[BusinessLeave] Insert error", error);
      alert(`Failed to save: ${error.message}`);
      setSaving(false);
      return;
    }

    console.log("[BusinessLeave] Insert success", data);

    setSaving(false);
    setShowRequestForm(false);
    setReqForm({ employee_id: "", leave_type_id: "", start_date: "", end_date: "", is_half_day: false, reason: "" });
    await loadData();
  };

  const deleteRequest = async (id: string) => {
    await supabase.from("hr_leave_requests").delete().eq("id", id);
    await loadData();
  };

  const saveLeaveType = async () => {
    if (!businessOwnerId || !typeForm.code || !typeForm.name) return;
    setSaving(true);
    const payload = { business_id: businessOwnerId, code: typeForm.code, name: typeForm.name, description: typeForm.description || null, max_days_per_year: typeForm.max_days_per_year };
    console.log("[BusinessLeave] Saving leave type", payload);
    if (editingType) {
      const { error } = await supabase.from("hr_leave_types").update(payload).eq("id", editingType.id);
      if (error) { console.error("[BusinessLeave] Update leave type error", error); alert(`Failed: ${error.message}`); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("hr_leave_types").insert(payload);
      if (error) { console.error("[BusinessLeave] Insert leave type error", error); alert(`Failed: ${error.message}`); setSaving(false); return; }
    }
    setSaving(false);
    setShowTypeForm(false);
    setEditingType(null);
    setTypeForm({ code: "", name: "", description: "", max_days_per_year: 10 });
    await loadData();
  };

  const deleteLeaveType = async (id: string) => {
    const { error } = await supabase.from("hr_leave_types").delete().eq("id", id);
    if (error) { console.error("[BusinessLeave] Delete leave type error", error); alert(`Failed: ${error.message}`); }
    await loadData();
  };

  const saveEntitlement = async () => {
    if (!entForm.employee_id || !entForm.leave_type_id) return;
    setSaving(true);
    const existing = entitlements.find(e => e.employee_id === entForm.employee_id && e.leave_type_id === entForm.leave_type_id && e.year === entForm.year);
    console.log("[BusinessLeave] Saving entitlement", entForm, existing ? "updating" : "inserting");
    if (existing) {
      const { error } = await supabase.from("hr_leave_entitlements").update({ max_days: entForm.max_days }).eq("id", existing.id);
      if (error) { console.error("[BusinessLeave] Update entitlement error", error); alert(`Failed: ${error.message}`); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("hr_leave_entitlements").insert(entForm);
      if (error) { console.error("[BusinessLeave] Insert entitlement error", error); alert(`Failed: ${error.message}`); setSaving(false); return; }
    }
    setSaving(false);
    setShowEntForm(false);
    setEntForm({ employee_id: "", leave_type_id: "", year: currentYear, max_days: 10 });
    await loadData();
  };

  const getEmployeeName = (id: string) => employees.find(e => e.id === id);
  const getLeaveTypeName = (id: string) => leaveTypes.find(t => t.id === id);

  return (
    <BusinessLayout title="Leave Management" description="Leave types, entitlements, balances, and requests">
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-xl p-1 w-fit">
          <button onClick={() => setActiveTab("requests")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "requests" ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Leave Requests</button>
          <button onClick={() => setActiveTab("types")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "types" ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Leave Types</button>
          <button onClick={() => setActiveTab("entitlements")} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "entitlements" ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Entitlements</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {/* Leave Requests Tab */}
            {activeTab === "requests" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => setShowRequestForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    <Plus className="w-4 h-4" /> New Leave Request
                  </button>
                </div>

                {/* Request Form Modal */}
                {showRequestForm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowRequestForm(false); }}>
                    <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">New Leave Request</h3>
                        <button onClick={() => setShowRequestForm(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Employee *</label>
                          <select value={reqForm.employee_id} onChange={e => setReqForm({ ...reqForm, employee_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Select employee...</option>
                            {employees.filter(e => e.is_active).map(e => (
                              <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Leave Type *</label>
                          <select value={reqForm.leave_type_id} onChange={e => setReqForm({ ...reqForm, leave_type_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Select type...</option>
                            {leaveTypes.filter(t => t.is_active).map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date *</label>
                            <input type="date" value={reqForm.start_date} onChange={e => setReqForm({ ...reqForm, start_date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Date *</label>
                            <input type="date" value={reqForm.end_date} onChange={e => setReqForm({ ...reqForm, end_date: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                        </div>
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input type="checkbox" checked={reqForm.is_half_day} onChange={e => setReqForm({ ...reqForm, is_half_day: e.target.checked })} className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500" />
                          <span className="text-sm font-medium">Half day (0.5 day deduction)</span>
                        </label>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Reason</label>
                          <textarea value={reqForm.reason} onChange={e => setReqForm({ ...reqForm, reason: e.target.value })} rows={2} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                        </div>
                        {reqForm.employee_id && reqForm.leave_type_id && (
                          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3 text-sm">
                            <p className="font-medium text-indigo-700 dark:text-indigo-400">Leave Balance</p>
                            <p className="text-indigo-600 dark:text-indigo-300">
                              {(() => { const b = getBalance(reqForm.employee_id, reqForm.leave_type_id); return `${b.remaining} / ${b.max} days remaining`; })()}
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setShowRequestForm(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                        <button onClick={saveRequest} disabled={saving || !reqForm.employee_id || !reqForm.leave_type_id || !reqForm.start_date || !reqForm.end_date} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Approve & Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Requests List */}
                {requests.length === 0 ? (
                  <div className="text-center py-16">
                    <Umbrella className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No leave requests yet.</p>
                  </div>
                ) : (
                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Employee</th>
                            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Leave Type</th>
                            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Period</th>
                            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Days</th>
                            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Reason</th>
                            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Status</th>
                            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {requests.map(req => {
                            const emp = getEmployeeName(req.employee_id);
                            const type = getLeaveTypeName(req.leave_type_id);
                            return (
                              <tr key={req.id} className="hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3.5 font-medium">{emp ? `${emp.first_name} ${emp.last_name}` : "—"}</td>
                                <td className="px-4 py-3.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold">
                                    {type?.name || "—"}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-muted-foreground text-xs">
                                  {new Date(req.start_date).toLocaleDateString()} — {new Date(req.end_date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3.5 text-center font-bold">{req.days_taken}</td>
                                <td className="px-4 py-3.5 text-muted-foreground max-w-[200px] truncate">{req.reason || "—"}</td>
                                <td className="px-4 py-3.5 text-center">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                    req.status === "approved" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                                    req.status === "pending" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" :
                                    "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400"
                                  }`}>
                                    {req.status === "approved" && <CheckCircle2 className="w-3 h-3" />}
                                    {req.status}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {req.status === "pending" && (
                                      <>
                                        <button
                                          onClick={async () => {
                                            await supabase.from("hr_leave_requests").update({ status: "approved" }).eq("id", req.id);
                                            await loadData();
                                          }}
                                          className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                          title="Approve"
                                        >
                                          <CheckCircle2 className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={async () => {
                                            await supabase.from("hr_leave_requests").update({ status: "rejected" }).eq("id", req.id);
                                            await loadData();
                                          }}
                                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                                          title="Reject"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </>
                                    )}
                                    <button onClick={() => deleteRequest(req.id)} className="p-2 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Delete">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Leave Types Tab */}
            {activeTab === "types" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => { setEditingType(null); setTypeForm({ code: "", name: "", description: "", max_days_per_year: 10 }); setShowTypeForm(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    <Plus className="w-4 h-4" /> Add Leave Type
                  </button>
                </div>

                {showTypeForm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowTypeForm(false); }}>
                    <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">{editingType ? "Edit Leave Type" : "Add Leave Type"}</h3>
                        <button onClick={() => setShowTypeForm(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Code *</label>
                            <input type="text" value={typeForm.code} onChange={e => setTypeForm({ ...typeForm, code: e.target.value })} placeholder="VL" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name *</label>
                            <input type="text" value={typeForm.name} onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} placeholder="Vacation Leave" className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                          <input type="text" value={typeForm.description} onChange={e => setTypeForm({ ...typeForm, description: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Max Days Per Year</label>
                          <input type="number" value={typeForm.max_days_per_year} onChange={e => setTypeForm({ ...typeForm, max_days_per_year: parseInt(e.target.value) || 0 })} min={0} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setShowTypeForm(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                        <button onClick={saveLeaveType} disabled={saving || !typeForm.code || !typeForm.name} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {editingType ? "Update" : "Save"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {leaveTypes.map(t => (
                    <div key={t.id} className="bg-card rounded-2xl border border-border p-5 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full text-xs font-bold">{t.code}</span>
                          <h4 className="font-bold mt-2">{t.name}</h4>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingType(t); setTypeForm({ code: t.code, name: t.name, description: t.description || "", max_days_per_year: t.max_days_per_year }); setShowTypeForm(true); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteLeaveType(t.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {t.description && <p className="text-xs text-muted-foreground mb-3">{t.description}</p>}
                      <p className="text-sm"><span className="font-bold">{t.max_days_per_year}</span> <span className="text-muted-foreground">days/year</span></p>
                    </div>
                  ))}
                  {leaveTypes.length === 0 && (
                    <div className="col-span-full text-center py-12">
                      <Settings className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">No leave types configured yet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Entitlements Tab */}
            {activeTab === "entitlements" && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button onClick={() => setShowEntForm(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    <Plus className="w-4 h-4" /> Set Entitlement
                  </button>
                </div>

                {showEntForm && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={e => { if (e.target === e.currentTarget) setShowEntForm(false); }}>
                    <div className="bg-card rounded-2xl border border-border w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold">Set Leave Entitlement</h3>
                        <button onClick={() => setShowEntForm(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Employee *</label>
                          <select value={entForm.employee_id} onChange={e => setEntForm({ ...entForm, employee_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Select employee...</option>
                            {employees.map(e => (
                              <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Leave Type *</label>
                          <select value={entForm.leave_type_id} onChange={e => setEntForm({ ...entForm, leave_type_id: e.target.value })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="">Select type...</option>
                            {leaveTypes.map(t => (
                              <option key={t.id} value={t.id}>{t.name} ({t.code})</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Year</label>
                            <input type="number" value={entForm.year} onChange={e => setEntForm({ ...entForm, year: parseInt(e.target.value) || currentYear })} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Max Days</label>
                            <input type="number" value={entForm.max_days} onChange={e => setEntForm({ ...entForm, max_days: parseFloat(e.target.value) || 0 })} min={0} step={0.5} className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <button onClick={() => setShowEntForm(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
                        <button onClick={saveEntitlement} disabled={saving || !entForm.employee_id || !entForm.leave_type_id} className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50">
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Entitlements Table */}
                {entitlements.length === 0 ? (
                  <div className="text-center py-16">
                    <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">No entitlements set. Configure per-employee leave limits.</p>
                  </div>
                ) : (
                  <div className="bg-card rounded-2xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Employee</th>
                            <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Leave Type</th>
                            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Year</th>
                            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Max Days</th>
                            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Taken</th>
                            <th className="text-center px-4 py-3 font-semibold text-muted-foreground">Remaining</th>
                            <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {entitlements.map(ent => {
                            const emp = getEmployeeName(ent.employee_id);
                            const type = getLeaveTypeName(ent.leave_type_id);
                            const balance = getBalance(ent.employee_id, ent.leave_type_id);
                            return (
                              <tr key={ent.id} className="hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3.5 font-medium">{emp ? `${emp.first_name} ${emp.last_name}` : "—"}</td>
                                <td className="px-4 py-3.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold">
                                    {type?.name || "—"}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-center">{ent.year}</td>
                                <td className="px-4 py-3.5 text-center font-bold">{ent.max_days}</td>
                                <td className="px-4 py-3.5 text-center text-muted-foreground">{balance.taken}</td>
                                <td className="px-4 py-3.5 text-center">
                                  <span className={`font-bold ${balance.remaining <= 2 ? 'text-rose-600' : balance.remaining <= 5 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {balance.remaining}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-right">
                                  <button onClick={() => { setEntForm({ employee_id: ent.employee_id, leave_type_id: ent.leave_type_id, year: ent.year, max_days: ent.max_days }); setShowEntForm(true); }} className="p-2 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors" title="Edit">
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </BusinessLayout>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useHRAccess } from "@/providers/hr-access";
import { supabase } from "@/integrations/supabase/client";
import HRLayout from "@/components/HRLayout";
import { Loader2, Plus, Pencil, Trash2, X, Check, Building2, Users, Briefcase, ChevronDown, ChevronRight, User } from "lucide-react";

type OrgNode = {
  id: string;
  name: string;
  parent_id: string | null;
  node_type: string;
  entity_id: string | null;
  sort_order: number;
  children?: OrgNode[];
};

export default function StandaloneHROrgChart() {
  const { user } = useAuth();
  const { hrBusinessId } = useHRAccess();
  const businessOwnerId = hrBusinessId || user?.id || "";
  const [nodes, setNodes] = useState<OrgNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<OrgNode | null>(null);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ name: "", parent_id: "", node_type: "department" });

  const loadData = async () => {
    if (!businessOwnerId) return;
    const { data } = await supabase.from("hr_org_chart").select("*").eq("business_id", businessOwnerId).order("sort_order").order("name");
    if (data) setNodes(data);
    setLoading(false);
  };

  useEffect(() => { if (businessOwnerId) loadData(); }, [businessOwnerId]);

  const buildTree = (items: OrgNode[], parentId: string | null = null): OrgNode[] => {
    return items
      .filter(n => n.parent_id === parentId)
      .map(n => ({ ...n, children: buildTree(items, n.id) }));
  };

  const tree = buildTree(nodes);

  const resetForm = () => {
    setForm({ name: "", parent_id: "", node_type: "department" });
    setEditing(null);
    setShowForm(false);
  };

  const openEdit = (n: OrgNode) => {
    setForm({ name: n.name, parent_id: n.parent_id || "", node_type: n.node_type });
    setEditing(n);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !businessOwnerId) return;
    setSaving(true);
    const payload = { business_id: businessOwnerId, name: form.name.trim(), parent_id: form.parent_id || null, node_type: form.node_type };
    if (editing) {
      await supabase.from("hr_org_chart").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("hr_org_chart").insert(payload);
    }
    setSaving(false);
    resetForm();
    loadData();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("hr_org_chart").delete().eq("id", id);
    loadData();
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const nodeTypeIcon: Record<string, any> = {
    company: Building2, division: Building2, department: Users, team: Users, position: Briefcase,
  };

  const nodeTypeColors: Record<string, string> = {
    company: "bg-purple-500", division: "bg-indigo-500", department: "bg-blue-500",
    team: "bg-emerald-500", position: "bg-amber-500",
  };

  const renderNode = (node: OrgNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const Icon = nodeTypeIcon[node.node_type] || Building2;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors group cursor-pointer"
          style={{ marginLeft: depth * 24 }}
          onClick={() => hasChildren && toggleExpand(node.id)}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          ) : (
            <span className="w-4 shrink-0" />
          )}
          <div className={`p-1.5 rounded-lg ${nodeTypeColors[node.node_type] || "bg-gray-500"}`}>
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{node.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{node.node_type}</p>
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity" onClick={e => e.stopPropagation()}>
            <button onClick={() => openEdit(node)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => handleDelete(node.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        {hasChildren && isExpanded && node.children!.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <HRLayout title="Organizational Chart" description="Visualize your company hierarchy and reporting structure">
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="space-y-6">
          <button onClick={() => { resetForm(); setShowForm(true); }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Node
          </button>

          {showForm && (
            <div className="bg-card rounded-2xl border border-border p-6">
              <h3 className="font-bold mb-4">{editing ? "Edit Node" : "New Org Chart Node"}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Type</label>
                  <select value={form.node_type} onChange={e => setForm(p => ({ ...p, node_type: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="company">Company</option>
                    <option value="division">Division</option>
                    <option value="department">Department</option>
                    <option value="team">Team</option>
                    <option value="position">Position</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Parent Node</label>
                  <select value={form.parent_id} onChange={e => setForm(p => ({ ...p, parent_id: e.target.value }))} className="w-full px-3 py-2 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option value="">Root (top level)</option>
                    {nodes.filter(n => n.id !== editing?.id).map(n => (
                      <option key={n.id} value={n.id}>{n.name} ({n.node_type})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSave} disabled={saving || !form.name.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? "Update" : "Create"}
                </button>
                <button onClick={resetForm} className="px-4 py-2 border border-border rounded-xl text-sm font-medium hover:bg-muted transition-colors">Cancel</button>
              </div>
            </div>
          )}

          <div className="bg-card rounded-2xl border border-border p-4">
            {tree.length > 0 ? tree.map(node => renderNode(node)) : (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No org chart nodes yet. Start by adding your company structure.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </HRLayout>
  );
}

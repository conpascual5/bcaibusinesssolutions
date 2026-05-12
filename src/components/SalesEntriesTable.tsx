import { useMemo, useState } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type SalesEntryRow = {
  id: string;
  entry_date: string;
  amount: number;
  source: string | null;
  notes: string | null;
};

function formatMoneyCompact(v: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(v);
}

export default function SalesEntriesTable({
  rows,
  onUpdate,
  onDelete,
}: {
  rows: SalesEntryRow[];
  onUpdate: (row: SalesEntryRow) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Pick<SalesEntryRow, "entry_date" | "amount" | "source" | "notes"> | null>(null);
  const [busy, setBusy] = useState(false);

  const totals = useMemo(() => {
    const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
    return { total };
  }, [rows]);

  const startEdit = (row: SalesEntryRow) => {
    setEditingId(row.id);
    setDraft({
      entry_date: row.entry_date,
      amount: Number(row.amount || 0),
      source: row.source ?? "",
      notes: row.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!editingId || !draft) return;
    setBusy(true);
    try {
      await onUpdate({
        id: editingId,
        entry_date: draft.entry_date,
        amount: Number(draft.amount || 0),
        source: draft.source?.trim() ? draft.source.trim() : null,
        notes: draft.notes?.trim() ? draft.notes.trim() : null,
      });
      cancelEdit();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-slate-900">All entries</p>
          <p className="text-xs text-slate-500">Edit your rows like a spreadsheet — date, amount, source, notes.</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Total</p>
          <p className="text-sm font-extrabold text-slate-900">{formatMoneyCompact(totals.total)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Date</th>
              <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Amount</th>
              <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Source</th>
              <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500">Notes</th>
              <th className="px-5 py-3 text-[11px] font-extrabold uppercase tracking-wide text-slate-500 w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-sm text-slate-500">
                  No entries yet. Add one below or import from Excel.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => {
                const editing = editingId === r.id;
                return (
                  <tr key={r.id} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                    <td className="px-5 py-3 align-top">
                      {editing ? (
                        <Input
                          type="date"
                          value={draft?.entry_date ?? ""}
                          onChange={(e) => setDraft((d) => ({ ...(d as any), entry_date: e.target.value }))}
                          className="h-9 rounded-xl"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-slate-900">{r.entry_date}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 align-top">
                      {editing ? (
                        <Input
                          type="number"
                          value={draft?.amount ?? 0}
                          onChange={(e) => setDraft((d) => ({ ...(d as any), amount: Number(e.target.value) }))}
                          className="h-9 rounded-xl"
                        />
                      ) : (
                        <p className="text-sm font-extrabold text-slate-900">{formatMoneyCompact(Number(r.amount || 0))}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 align-top">
                      {editing ? (
                        <Input
                          value={draft?.source ?? ""}
                          onChange={(e) => setDraft((d) => ({ ...(d as any), source: e.target.value }))}
                          placeholder="e.g., Shopee"
                          className="h-9 rounded-xl"
                        />
                      ) : (
                        <p className="text-sm text-slate-700">{r.source || "—"}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 align-top">
                      {editing ? (
                        <Input
                          value={draft?.notes ?? ""}
                          onChange={(e) => setDraft((d) => ({ ...(d as any), notes: e.target.value }))}
                          placeholder="e.g., promo day"
                          className="h-9 rounded-xl"
                        />
                      ) : (
                        <p className="text-sm text-slate-700">{r.notes || "—"}</p>
                      )}
                    </td>
                    <td className="px-5 py-3 align-top">
                      {editing ? (
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700"
                            onClick={saveEdit}
                            disabled={busy}
                          >
                            <Check className="w-4 h-4" />
                            <span className="ml-2">Save</span>
                          </Button>
                          <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={cancelEdit} disabled={busy}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => startEdit(r)}>
                            <Pencil className="w-4 h-4" />
                            <span className="ml-2">Edit</span>
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => onDelete(r.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

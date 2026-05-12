import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  BarChart3,
  CalendarDays,
  Upload,
  Plus,
  TrendingUp,
  RefreshCw,
  Pencil,
  Check,
  X,
} from "lucide-react";
import {
  groupDaily,
  groupWeekly,
  groupMonthly,
  groupYearly,
  makeDemoRows,
  type SaleRow,
} from "@/lib/salesReport";

type RangeMode = "daily" | "weekly" | "monthly" | "yearly";

type SalesEntryRow = {
  id: string;
  entry_date: string;
  amount: number;
  source: string | null;
  notes: string | null;
};

function formatMoney(v: number) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(v);
}

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function SalesReport() {
  const { user } = useAuth();
  const [mode, setMode] = useState<RangeMode>("daily");
  const [rows, setRows] = useState<SaleRow[]>([]);
  const [rawEntries, setRawEntries] = useState<SalesEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [newDate, setNewDate] = useState(() => toISODate(new Date()));
  const [newAmount, setNewAmount] = useState(0);
  const [newSource, setNewSource] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Editable average daily sales
  const [avgDailySales, setAvgDailySales] = useState(0);
  const [editingAvg, setEditingAvg] = useState(false);
  const [avgInput, setAvgInput] = useState("");

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("sales_entries")
      .select("id,entry_date,amount,source,notes")
      .order("entry_date", { ascending: true });

    if (!error) {
      const entries = (data ?? []) as SalesEntryRow[];
      setRawEntries(entries);
      const mapped: SaleRow[] = entries.map((r) => ({
        date: r.entry_date,
        amount: Number(r.amount),
        source: r.source ?? undefined,
        notes: r.notes ?? undefined,
      }));
      setRows(mapped);
    }

    setLoading(false);
  };

  // Load saved average daily sales from settings
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", `avg_daily_sales_${user.id}`)
        .maybeSingle();
      if (data) {
        const v = Number((data as any).value);
        if (!Number.isNaN(v)) {
          setAvgDailySales(v);
        }
      }
    })();
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const series = useMemo(() => {
    if (rows.length === 0) {
      const demo = makeDemoRows();
      if (mode === "weekly") return groupWeekly(demo);
      if (mode === "monthly") return groupMonthly(demo);
      if (mode === "yearly") return groupYearly(demo);
      return groupDaily(demo);
    }

    if (mode === "weekly") return groupWeekly(rows);
    if (mode === "monthly") return groupMonthly(rows);
    if (mode === "yearly") return groupYearly(rows);
    return groupDaily(rows);
  }, [mode, rows]);

  const total = useMemo(() => series.reduce((sum, s) => sum + s.total, 0), [series]);

  const computedAvg = useMemo(() => {
    if (rows.length === 0) return avgDailySales;
    // compute actual average per day from data
    const uniqueDays = new Set(rows.map((r) => r.date)).size;
    if (uniqueDays === 0) return avgDailySales;
    return total / uniqueDays;
  }, [rows, total, avgDailySales]);

  const handleAdd = async () => {
    if (!user?.id) return;
    if (!newDate || !newAmount) return;

    await supabase.from("sales_entries").insert({
      user_id: user.id,
      entry_date: newDate,
      amount: newAmount,
      source: newSource.trim() || null,
      notes: newNotes.trim() || null,
    } as any);

    setNewAmount(0);
    setNewSource("");
    setNewNotes("");

    await load();
  };

  const handleSaveAvg = async () => {
    const v = Number(avgInput);
    if (Number.isNaN(v) || v < 0) return;
    setAvgDailySales(v);
    setEditingAvg(false);

    if (!user?.id) return;
    await supabase.from("settings").upsert(
      { key: `avg_daily_sales_${user.id}`, value: String(v), updated_at: new Date().toISOString() } as any,
      { onConflict: "key" }
    );
  };

  const parseExcel = async (file: File) => {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheetName = wb.SheetNames[0];
    const ws = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

    const out: SaleRow[] = [];
    for (const r of json) {
      const rawDate =
        r.Date ?? r.date ?? r.DAY ?? r.Day ?? r.day ?? r["Entry Date"] ?? r.entry_date ?? "";
      const rawAmount =
        r.Amount ?? r.amount ?? r.Sales ?? r.sales ?? r.Total ?? r.total ?? r["Total Sales"] ?? "";

      if (!rawDate || rawAmount === "") continue;

      let dateStr = "";
      if (rawDate instanceof Date) {
        dateStr = toISODate(rawDate);
      } else if (typeof rawDate === "number") {
        const d = XLSX.SSF.parse_date_code(rawDate);
        if (d) {
          dateStr = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
        }
      } else {
        const d = new Date(String(rawDate));
        if (!Number.isNaN(d.getTime())) dateStr = toISODate(d);
        else dateStr = String(rawDate).slice(0, 10);
      }

      const amt = Number(String(rawAmount).replace(/[^0-9.-]/g, ""));
      if (!dateStr || Number.isNaN(amt)) continue;

      out.push({
        date: dateStr,
        amount: amt,
        source: (r.Source ?? r.source ?? "") ? String(r.Source ?? r.source) : undefined,
        notes: (r.Notes ?? r.notes ?? "") ? String(r.Notes ?? r.notes) : undefined,
      });
    }

    return out;
  };

  const handleImport = async (file: File) => {
    if (!user?.id) return;
    setUploading(true);

    try {
      const parsed = await parseExcel(file);
      if (parsed.length === 0) return;

      const payload = parsed.map((r) => ({
        user_id: user.id,
        entry_date: r.date,
        amount: r.amount,
        source: r.source ?? null,
        notes: r.notes ?? null,
      }));

      const chunkSize = 500;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const { error } = await supabase.from("sales_entries").insert(chunk as any);
        if (error) throw error;
      }

      await load();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold">
              <BarChart3 className="w-3.5 h-3.5" />
              Sales Report
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Historical Sales Tracking
            </h1>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">
              Track sales daily, weekly, monthly, and yearly. Import from Excel or add entries manually.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm font-bold cursor-pointer hover:bg-slate-800 transition-colors">
              <Upload className="w-4 h-4" />
              {uploading ? "Importing…" : "Import Excel"}
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void handleImport(f);
                  e.currentTarget.value = "";
                }}
                disabled={uploading}
              />
            </label>

            <button
              onClick={load}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-800 text-sm font-bold hover:bg-slate-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <p className="text-sm font-extrabold text-slate-900">{mode.toUpperCase()} totals</p>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl p-1 w-fit">
              {([
                ["daily", "Daily"],
                ["weekly", "Weekly"],
                ["monthly", "Monthly"],
                ["yearly", "Yearly"],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setMode(k)}
                  className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-colors ${
                    mode === k ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-slate-500 font-bold">TOTAL</div>
              <div className="text-sm font-extrabold text-slate-900">{formatMoney(total)}</div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series.map((s) => ({ name: s.label, total: s.total }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748B" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748B" />
                  <Tooltip
                    formatter={(value: any) => formatMoney(Number(value))}
                    contentStyle={{ borderRadius: 14, border: "1px solid #E2E8F0" }}
                  />
                  <Line type="monotone" dataKey="total" stroke="#4F46E5" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold text-slate-500">Entries</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">{rows.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold text-slate-500">Average ({mode})</p>
              <p className="mt-1 text-xl font-extrabold text-slate-900">
                {series.length ? formatMoney(total / series.length) : formatMoney(0)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-bold text-slate-500">Avg Daily Sales</p>
              <div className="mt-1 flex items-center gap-2">
                {editingAvg ? (
                  <>
                    <input
                      type="number"
                      value={avgInput}
                      onChange={(e) => setAvgInput(e.target.value)}
                      className="flex-1 px-2 py-1 rounded-xl border border-slate-200 bg-slate-50 text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveAvg}
                      className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingAvg(false)}
                      className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <p className="flex-1 text-xl font-extrabold text-slate-900">
                      {formatMoney(computedAvg)}
                    </p>
                    <button
                      onClick={() => {
                        setAvgInput(String(avgDailySales));
                        setEditingAvg(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
              <p className="mt-1 text-[10px] text-slate-400">
                {rows.length > 0
                  ? "Computed from your data"
                  : avgDailySales > 0
                    ? "Manually set"
                    : "Set your target"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-extrabold text-slate-900">Add entry</h2>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-500">Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="mt-1 w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Amount (PHP)</label>
              <input
                type="number"
                value={newAmount}
                onChange={(e) => setNewAmount(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Source (optional)</label>
              <input
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="e.g., Shopee, Walk-in, FB Marketplace"
                className="mt-1 w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500">Notes (optional)</label>
              <textarea
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g., Promo day, influencer post, payday surge"
                className="mt-1 w-full min-h-[90px] px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              onClick={handleAdd}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 text-white font-extrabold text-sm hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-600">Tip</p>
            <p className="mt-1 text-sm text-slate-700">
              If you haven’t imported data yet, you’ll still see a demo graph so you can preview the report layout.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export type SaleRow = {
  date: string; // YYYY-MM-DD
  amount: number;
  source?: string;
  notes?: string;
};

export type Aggregation = {
  label: string;
  total: number;
};

function toDateOnly(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function groupDaily(rows: SaleRow[]): Aggregation[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.date;
    map.set(key, (map.get(key) ?? 0) + r.amount);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, total]) => ({ label, total }));
}

export function groupWeekly(rows: SaleRow[]): Aggregation[] {
  // ISO-ish week key: YYYY-Www based on Monday start
  const map = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.date + "T00:00:00");
    const day = (d.getDay() + 6) % 7; // Mon=0
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    const year = monday.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const diff = Math.floor((monday.getTime() - startOfYear.getTime()) / 86400000);
    const week = Math.floor((diff + ((startOfYear.getDay() + 6) % 7)) / 7) + 1;
    const key = `${year}-W${String(week).padStart(2, "0")}`;
    map.set(key, (map.get(key) ?? 0) + r.amount);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, total]) => ({ label, total }));
}

export function groupMonthly(rows: SaleRow[]): Aggregation[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.date.slice(0, 7); // YYYY-MM
    map.set(key, (map.get(key) ?? 0) + r.amount);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, total]) => ({ label, total }));
}

export function groupYearly(rows: SaleRow[]): Aggregation[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const key = r.date.slice(0, 4);
    map.set(key, (map.get(key) ?? 0) + r.amount);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, total]) => ({ label, total }));
}

export function makeDemoRows(): SaleRow[] {
  const today = new Date();
  const rows: SaleRow[] = [];
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const base = 1500 + ((i * 97) % 2400);
    const variance = (i % 7) * 120;
    rows.push({ date: toDateOnly(d), amount: Math.round(base + variance) });
  }
  return rows.reverse();
}

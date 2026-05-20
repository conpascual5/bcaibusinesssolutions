import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Play, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PayrollPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_closed: boolean;
}

interface Props {
  businessOwnerId: string | null;
  payrollPeriods: PayrollPeriod[];
  onGenerate: (periodId: string) => Promise<void>;
}

export default function StandaloneAutoPayrollRunner({ businessOwnerId, payrollPeriods, onGenerate }: Props) {
  const [selectedPeriod, setSelectedPeriod] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ payslips_count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  async function runPayroll() {
    if (!selectedPeriod) {
      toast({ title: "Error", description: "Please select a payroll period", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);
    setProgress(10);

    if (!businessOwnerId) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    setProgress(30);

    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const res = await fetch(
        "https://dkatgjtvhitknghvaxxn.supabase.co/functions/v1/process-payroll",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            business_id: businessOwnerId,
            payroll_period_id: selectedPeriod,
          }),
        }
      );

      setProgress(100);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to run payroll");
        toast({ title: "Payroll Failed", description: data.error || "Failed to run payroll", variant: "destructive" });
      } else {
        setResult(data);
        toast({
          title: "Payroll Complete",
          description: `Processed ${data.payslips_count} payslips`,
        });
        await onGenerate(selectedPeriod);
      }
    } catch (err: any) {
      console.error("[StandaloneAutoPayrollRunner] Error:", err);
      setError(err.message || "Unexpected error");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }

    setLoading(false);
  }

  const selectedPeriodData = payrollPeriods.find(p => p.id === selectedPeriod);

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Automated Payroll Runner</h3>
            <p className="text-xs text-muted-foreground">Process payroll with statutory deductions via edge function</p>
          </div>
        </div>
        <button
          onClick={runPayroll}
          disabled={loading || !selectedPeriod}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
          ) : (
            <><Play className="w-4 h-4" /> Run Payroll</>
          )}
        </button>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1.5 block">Payroll Period</label>
          <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}
            className="w-full max-w-md px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Select a payroll period...</option>
            {payrollPeriods.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.start_date} to {p.end_date}){p.is_closed ? " (Closed)" : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedPeriodData && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted">{selectedPeriodData.start_date} → {selectedPeriodData.end_date}</span>
            {selectedPeriodData.is_closed && (
              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Closed</span>
            )}
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-muted-foreground text-center">Computing salaries and statutory deductions...</p>
          </div>
        )}

        {result && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">Payroll Processed Successfully</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">{result.payslips_count} payslip(s) generated. Review them in the Payslips section.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">Payroll Processing Error</p>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Users, Calendar, FileText, DollarSign, Loader2 } from "lucide-react";
import type { Employee, PayrollPeriod, Payslip, Deduction } from "@/pages/BusinessPayroll";

interface Props {
  employees: Employee[];
  payrollPeriods: PayrollPeriod[];
  payslips: Payslip[];
  deductions: Deduction[];
  onGenerate: (periodId: string) => Promise<void>;
  getEmployee: (id: string) => Employee | undefined;
  fmtCurrency: (n: number) => string;
}

export default function PayrollDashboard({ employees, payrollPeriods, payslips, deductions, onGenerate, getEmployee, fmtCurrency }: Props) {
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [generating, setGenerating] = useState(false);

  const totalEmployees = employees.filter(e => e.is_active).length;
  const selectedPeriod = payrollPeriods.find(p => p.id === selectedPeriodId);
  const totalPayslipsThisPeriod = selectedPeriodId ? payslips.filter(p => p.payroll_period_id === selectedPeriodId).length : 0;

  const handleGenerate = async () => {
    if (!selectedPeriodId) return;
    setGenerating(true);
    await onGenerate(selectedPeriodId);
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, color: "indigo", label: "Active Employees", value: totalEmployees },
          { icon: Calendar, color: "emerald", label: "Payroll Periods", value: payrollPeriods.length },
          { icon: FileText, color: "amber", label: "Payslips Generated", value: payslips.length },
          { icon: DollarSign, color: "rose", label: "Deduction Types", value: deductions.length },
        ].map((item, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-${item.color}-100 dark:bg-${item.color}-900/30 flex items-center justify-center`}>
                <item.icon className={`w-5 h-5 text-${item.color}-600`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4">Generate Payslips</h3>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Select Payroll Period</label>
            <select value={selectedPeriodId} onChange={e => setSelectedPeriodId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Choose a period...</option>
              {payrollPeriods.filter(p => !p.is_closed).map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.start_date} to {p.end_date})</option>
              ))}
            </select>
          </div>
          <button onClick={handleGenerate} disabled={!selectedPeriodId || generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {generating ? "Generating..." : "Generate All Payslips"}
          </button>
        </div>
        {selectedPeriod && (
          <div className="mt-4 text-sm text-muted-foreground">
            Period: <span className="font-medium text-foreground">{selectedPeriod.name}</span> &mdash; {selectedPeriod.start_date} to {selectedPeriod.end_date}
            {totalPayslipsThisPeriod > 0 && <span className="ml-2">| {totalPayslipsThisPeriod} payslip(s) already generated</span>}
          </div>
        )}
      </div>

      {payslips.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">Latest Payslips</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Employee</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Period</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Days</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Gross</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Deductions</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Net Pay</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {payslips.slice(0, 10).map(ps => {
                  const emp = getEmployee(ps.employee_id);
                  const period = payrollPeriods.find(p => p.id === ps.payroll_period_id);
                  return (
                    <tr key={ps.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-2 font-medium">{emp ? `${emp.first_name} ${emp.last_name}` : "Unknown"}</td>
                      <td className="py-3 px-2 text-muted-foreground">{period?.name || "N/A"}</td>
                      <td className="py-3 px-2 text-right">{ps.total_days_worked}</td>
                      <td className="py-3 px-2 text-right font-medium">{fmtCurrency(ps.gross_pay)}</td>
                      <td className="py-3 px-2 text-right text-rose-600">{fmtCurrency(ps.total_deductions)}</td>
                      <td className="py-3 px-2 text-right font-bold text-emerald-600">{fmtCurrency(ps.net_pay)}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ps.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                          ps.status === "approved" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>{ps.status}</span>
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
  );
}

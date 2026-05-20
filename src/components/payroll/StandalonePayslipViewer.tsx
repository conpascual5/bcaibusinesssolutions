import { useState, useRef } from "react"
import { Receipt, Clock, Play, Download, Printer } from "lucide-react"
import type { Payslip, PayrollPeriod, Employee } from "@/pages/StandaloneHRPayroll"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

interface Props {
  payslips: Payslip[]
  payrollPeriods: PayrollPeriod[]
  employees: Employee[]
  getEmployee: (id: string) => Employee | undefined
  updateStatus: (id: string, status: string) => Promise<void>
  fmtCurrency: (n: number) => string
}

function getDeductionAmount(deductions: any[], code: string): number {
  if (!deductions || !Array.isArray(deductions)) return 0
  const found = deductions.find((d: any) => d.code === code)
  return found ? found.amount : 0
}

export default function StandalonePayslipViewer({ payslips, payrollPeriods, employees, getEmployee, updateStatus, fmtCurrency }: Props) {
  const [viewing, setViewing] = useState<Payslip | null>(null)
  const [filterPeriod, setFilterPeriod] = useState("")
  const [exporting, setExporting] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const filtered = filterPeriod ? payslips.filter(p => p.payroll_period_id === filterPeriod) : payslips

  const downloadPDF = async (ps: Payslip) => {
    setExporting(true)
    // Temporarily set viewing so the detail renders
    setViewing(ps)
    // Wait for render
    await new Promise(r => setTimeout(r, 100))
    try {
      const element = printRef.current
      if (!element) return
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
      const emp = getEmployee(ps.employee_id)
      const name = emp ? `${emp.first_name}_${emp.last_name}`.replace(/\s+/g, "_") : "employee"
      pdf.save(`payslip_${name}.pdf`)
    } catch (err) {
      console.error("[PayslipViewer] PDF export error", err)
    }
    setExporting(false)
  }

  const printPayslip = async (ps: Payslip) => {
    setViewing(ps)
    await new Promise(r => setTimeout(r, 100))
    try {
      const element = printRef.current
      if (!element) return
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
      })
      const imgData = canvas.toDataURL("image/png")
      const win = window.open("", "_blank")
      if (!win) return
      win.document.write(`
        <html>
          <head><title>Payslip</title></head>
          <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;">
            <img src="${imgData}" style="max-width:100%;height:auto;" />
          </body>
        </html>
      `)
      win.document.close()
      win.onload = () => {
        win.print()
      }
    } catch (err) {
      console.error("[PayslipViewer] Print error", err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-xs">
          <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">All Periods</option>
            {payrollPeriods.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-muted-foreground">{filtered.length} payslip(s)</span>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Period</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Days</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Hours</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Tardiness</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Absences</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Gross</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Net Pay</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">No payslips found.</td></tr>
              ) : filtered.map(ps => {
                const emp = getEmployee(ps.employee_id)
                const period = payrollPeriods.find(p => p.id === ps.payroll_period_id)
                const deductions = (ps.deductions_breakdown || []) as { name: string; code: string; amount: number }[]
                const tardinessAmount = getDeductionAmount(deductions, "TARD")
                const absencesAmount = getDeductionAmount(deductions, "ABS")
                return (
                  <tr key={ps.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 px-4 font-medium">{emp ? `${emp.first_name} ${emp.last_name}` : "Unknown"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{period?.name || "N/A"}</td>
                    <td className="py-3 px-4 text-right">{ps.total_days_worked}</td>
                    <td className="py-3 px-4 text-right">{ps.total_hours_worked.toFixed(1)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-amber-600">{ps.total_tardiness_minutes}m</span>
                      {tardinessAmount > 0 && (
                        <span className="block text-[11px] text-amber-500">({fmtCurrency(tardinessAmount)})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-red-600">{ps.total_absences}</span>
                      {absencesAmount > 0 && (
                        <span className="block text-[11px] text-red-500">({fmtCurrency(absencesAmount)})</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium">{fmtCurrency(ps.gross_pay)}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">{fmtCurrency(ps.net_pay)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ps.status === "paid" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                        ps.status === "approved" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      }`}>{ps.status}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewing(ps)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="View Details">
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button onClick={() => downloadPDF(ps)} disabled={exporting}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-indigo-600 transition-colors"
                          title="Download PDF">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => printPayslip(ps)}
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="Print">
                          <Printer className="w-4 h-4" />
                        </button>
                        {ps.status === "draft" && (
                          <button onClick={() => updateStatus(ps.id, "approved")}
                            className="p-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 text-muted-foreground hover:text-blue-600 transition-colors"
                            title="Approve">
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        {ps.status === "approved" && (
                          <button onClick={() => updateStatus(ps.id, "paid")}
                            className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-muted-foreground hover:text-emerald-600 transition-colors"
                            title="Mark as Paid">
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setViewing(null) }}>
          <div className="bg-card rounded-2xl border border-border w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Payslip Details</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => downloadPDF(viewing)} disabled={exporting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors disabled:opacity-50">
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button onClick={() => printPayslip(viewing)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground text-xs font-semibold hover:bg-muted/80 transition-colors">
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Clock className="w-4 h-4" /></button>
              </div>
            </div>

            <div ref={printRef} className="bg-white rounded-xl p-6" style={{ fontFamily: "system-ui, sans-serif" }}>
              {(() => {
                const emp = getEmployee(viewing.employee_id)
                const period = payrollPeriods.find(p => p.id === viewing.payroll_period_id)
                const deductions = (viewing.deductions_breakdown || []) as { name: string; code: string; amount: number }[]

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b-2 border-gray-200">
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">{emp ? `${emp.first_name} ${emp.last_name}` : "Unknown"}</h4>
                        <p className="text-sm text-gray-500">{period?.name || "N/A"}</p>
                        <p className="text-xs text-gray-400">{period?.start_date} to {period?.end_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Daily Rate</p>
                        <p className="text-lg font-semibold text-gray-900">{fmtCurrency(viewing.daily_rate)}</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        { label: "Days Worked", value: viewing.total_days_worked, color: "text-emerald-600" },
                        { label: "Hours Worked", value: viewing.total_hours_worked.toFixed(1), color: "text-blue-600" },
                        { label: "Tardiness", value: `${viewing.total_tardiness_minutes}m`, color: "text-amber-600" },
                        { label: "Absences", value: viewing.total_absences, color: "text-red-600" },
                        { label: "Leave Days", value: viewing.total_leave_days, color: "text-purple-600" },
                      ].map((item, i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                          <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Earnings */}
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Earnings</h5>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Gross Pay ({viewing.total_days_worked} days × {fmtCurrency(viewing.daily_rate)})</span>
                          <span className="font-medium text-gray-900">{fmtCurrency(viewing.gross_pay)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Deductions */}
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-2">Deductions</h5>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        {deductions.length === 0 ? (
                          <p className="text-sm text-gray-500">No deductions</p>
                        ) : deductions.map((d, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-500">{d.name}</span>
                            <span className="font-medium text-rose-600">- {fmtCurrency(d.amount)}</span>
                          </div>
                        ))}
                        <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-semibold text-gray-900">
                          <span>Total Deductions</span>
                          <span className="text-rose-600">{fmtCurrency(viewing.total_deductions)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Net Pay */}
                    <div className="bg-indigo-50 rounded-xl p-5 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Net Pay</p>
                        <p className="text-2xl font-bold text-indigo-600">{fmtCurrency(viewing.net_pay)}</p>
                      </div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        viewing.status === "paid" ? "bg-emerald-100 text-emerald-700" :
                        viewing.status === "approved" ? "bg-blue-100 text-blue-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>{viewing.status}</span>
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="flex gap-2 justify-end mt-4">
              {viewing.status === "draft" && (
                <button onClick={() => { updateStatus(viewing.id, "approved"); setViewing(null) }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">Approve</button>
              )}
              {viewing.status === "approved" && (
                <button onClick={() => { updateStatus(viewing.id, "paid"); setViewing(null) }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors">Mark as Paid</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PayrollPeriod {
  id: string
  name: string
  start_date: string
  end_date: string
  is_closed: boolean
}

interface PayrollResult {
  message: string
  payslips_count: number
  payslips: any[]
}

export function AutoPayrollRunner() {
  const [periods, setPeriods] = useState<PayrollPeriod[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<PayrollResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const { toast } = useToast()

  async function loadPeriods() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data } = await supabase
      .from("hr_payroll_periods")
      .select("*")
      .eq("business_id", userData.user.id)
      .order("start_date", { ascending: false })

    if (data) {
      setPeriods(data)
      if (data.length > 0 && !selectedPeriod) {
        setSelectedPeriod(data[0].id)
      }
    }
  }

  useState(() => {
    loadPeriods()
  })

  async function runPayroll() {
    if (!selectedPeriod) {
      toast({ title: "Error", description: "Please select a payroll period", variant: "destructive" })
      return
    }

    setLoading(true)
    setResult(null)
    setError(null)
    setProgress(10)

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      setError("Not authenticated")
      setLoading(false)
      return
    }

    setProgress(30)

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("process-payroll", {
        body: {
          business_id: userData.user.id,
          payroll_period_id: selectedPeriod,
        },
      })

      setProgress(100)

      if (invokeError) {
        console.error("[AutoPayrollRunner] Invoke error:", invokeError)
        setError(invokeError.message || "Failed to run payroll")
        toast({ title: "Payroll Failed", description: invokeError.message, variant: "destructive" })
      } else if (data?.error) {
        setError(data.error)
        toast({ title: "Payroll Failed", description: data.error, variant: "destructive" })
      } else {
        setResult(data)
        toast({
          title: "Payroll Complete",
          description: `Processed ${data.payslips_count} payslips`,
        })
      }
    } catch (err: any) {
      console.error("[AutoPayrollRunner] Error:", err)
      setError(err.message || "Unexpected error")
      toast({ title: "Error", description: err.message, variant: "destructive" })
    }

    setLoading(false)
  }

  const selectedPeriodData = periods.find(p => p.id === selectedPeriod)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          Automated Payroll Runner
        </CardTitle>
        <Button
          size="sm"
          onClick={runPayroll}
          disabled={loading || !selectedPeriod}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-1" />
              Run Payroll
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Payroll Period</label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Select a payroll period" />
            </SelectTrigger>
            <SelectContent>
              {periods.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({p.start_date} to {p.end_date})
                  {p.is_closed && " (Closed)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPeriodData && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{selectedPeriodData.start_date} → {selectedPeriodData.end_date}</Badge>
            {selectedPeriodData.is_closed && <Badge variant="secondary">Closed</Badge>}
          </div>
        )}

        {loading && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-center">
              Computing salaries and statutory deductions...
            </p>
          </div>
        )}

        {result && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Payroll Processed Successfully</AlertTitle>
            <AlertDescription className="text-green-700">
              {result.payslips_count} payslip(s) generated. Review them in the Payslips section.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Payroll Processing Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

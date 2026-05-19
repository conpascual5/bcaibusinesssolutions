import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Search, User, Shield } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Employee {
  id: string
  first_name: string
  last_name: string
  position: string
  department: string
  basic_salary: number
}

interface EmployeeDeduction {
  employee_id: string
  deduction_type: string
  monthly_compensation: number | null
  employee_share: number | null
  employer_share: number | null
  is_overridden: boolean
}

const DEDUCTION_TYPES = [
  { value: "sss", label: "SSS" },
  { value: "philhealth", label: "PhilHealth" },
  { value: "pagibig", label: "Pag-IBIG" },
  { value: "withholding_tax", label: "Withholding Tax" },
]

export function EmployeeDeductionOverrides() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [deductions, setDeductions] = useState<Record<string, EmployeeDeduction[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedType, setSelectedType] = useState("sss")
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data: empData } = await supabase
      .from("hr_employees")
      .select("*")
      .eq("business_id", userData.user.id)
      .eq("is_active", true)
      .order("last_name", { ascending: true })

    if (empData) {
      setEmployees(empData)
    }

    const { data: dedData } = await supabase
      .from("hr_employee_deductions")
      .select("*")
      .in("employee_id", empData?.map(e => e.id) || [])

    if (dedData) {
      const grouped: Record<string, EmployeeDeduction[]> = {}
      for (const d of dedData) {
        if (!grouped[d.employee_id]) grouped[d.employee_id] = []
        grouped[d.employee_id].push(d)
      }
      setDeductions(grouped)
    }

    setLoading(false)
  }

  async function toggleOverride(employeeId: string, deductionType: string, enabled: boolean) {
    const existing = (deductions[employeeId] || []).find(d => d.deduction_type === deductionType)

    if (enabled) {
      const { error } = await supabase
        .from("hr_employee_deductions")
        .upsert({
          employee_id: employeeId,
          deduction_type: deductionType,
          monthly_compensation: null,
          employee_share: null,
          employer_share: null,
          is_overridden: true,
        }, { onConflict: "employee_id,deduction_type" })

      if (error) {
        toast({ title: "Error", description: "Failed to enable override", variant: "destructive" })
        return
      }
    } else if (existing) {
      const { error } = await supabase
        .from("hr_employee_deductions")
        .delete()
        .eq("employee_id", employeeId)
        .eq("deduction_type", deductionType)

      if (error) {
        toast({ title: "Error", description: "Failed to disable override", variant: "destructive" })
        return
      }
    }

    toast({ title: "Success", description: enabled ? "Override enabled" : "Override removed" })
    fetchData()
  }

  async function updateOverride(employeeId: string, deductionType: string, field: string, value: string) {
    const numValue = value ? parseFloat(value) : null
    const { error } = await supabase
      .from("hr_employee_deductions")
      .upsert({
        employee_id: employeeId,
        deduction_type: deductionType,
        [field]: numValue,
        is_overridden: true,
      }, { onConflict: "employee_id,deduction_type" })

    if (error) {
      toast({ title: "Error", description: "Failed to update override", variant: "destructive" })
      return
    }

    fetchData()
  }

  const filteredEmployees = employees.filter(e =>
    `${e.first_name} ${e.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
    e.position?.toLowerCase().includes(search.toLowerCase()) ||
    e.department?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Employee Deduction Overrides
        </CardTitle>
        <div className="flex items-center gap-4 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DEDUCTION_TYPES.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading employees...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No employees found</div>
        ) : (
          <div className="space-y-3">
            {filteredEmployees.map(emp => {
              const empDed = (deductions[emp.id] || []).find(d => d.deduction_type === selectedType)
              const isOverridden = empDed?.is_overridden || false

              return (
                <div key={emp.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{emp.first_name} {emp.last_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {emp.position || "No position"} {emp.department ? `· ${emp.department}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {isOverridden ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Share:</Label>
                          <Input
                            type="number"
                            step="0.01"
                            className="w-20 h-8 text-xs"
                            value={empDed?.employee_share ?? ""}
                            onChange={e => updateOverride(emp.id, selectedType, "employee_share", e.target.value)}
                            placeholder="Amount"
                          />
                        </div>
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Overridden
                        </Badge>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Using default bracket</span>
                    )}
                    <Switch
                      checked={isOverridden}
                      onCheckedChange={v => toggleOverride(emp.id, selectedType, v)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

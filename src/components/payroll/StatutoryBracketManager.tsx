import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Plus, Trash2, Calculator } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface StatutoryBracket {
  id: string
  deduction_type: string
  min_compensation: number
  max_compensation: number
  employee_share: number
  employer_share: number
  is_active: boolean
  effective_date: string
}

const DEDUCTION_TYPES = [
  { value: "sss", label: "SSS", color: "bg-blue-100 text-blue-800" },
  { value: "philhealth", label: "PhilHealth", color: "bg-green-100 text-green-800" },
  { value: "pagibig", label: "Pag-IBIG", color: "bg-purple-100 text-purple-800" },
  { value: "withholding_tax", label: "Withholding Tax", color: "bg-orange-100 text-orange-800" },
]

export function StatutoryBracketManager() {
  const [brackets, setBrackets] = useState<StatutoryBracket[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("sss")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBracket, setEditingBracket] = useState<StatutoryBracket | null>(null)
  const [form, setForm] = useState({
    deduction_type: "sss",
    min_compensation: "0",
    max_compensation: "9999999.99",
    employee_share: "0",
    employer_share: "0",
  })
  const { toast } = useToast()

  useEffect(() => {
    fetchBrackets()
  }, [])

  async function fetchBrackets() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data, error } = await supabase
      .from("hr_statutory_brackets")
      .select("*")
      .eq("business_id", userData.user.id)
      .order("min_compensation", { ascending: true })

    if (error) {
      console.error("Error fetching brackets:", error)
      toast({ title: "Error", description: "Failed to load statutory brackets", variant: "destructive" })
    } else {
      setBrackets(data || [])
    }
    setLoading(false)
  }

  function openCreate(type: string) {
    setEditingBracket(null)
    setForm({
      deduction_type: type,
      min_compensation: "0",
      max_compensation: "9999999.99",
      employee_share: "0",
      employer_share: "0",
    })
    setDialogOpen(true)
  }

  function openEdit(bracket: StatutoryBracket) {
    setEditingBracket(bracket)
    setForm({
      deduction_type: bracket.deduction_type,
      min_compensation: String(bracket.min_compensation),
      max_compensation: String(bracket.max_compensation),
      employee_share: String(bracket.employee_share),
      employer_share: String(bracket.employer_share),
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const payload = {
      business_id: userData.user.id,
      deduction_type: form.deduction_type,
      min_compensation: parseFloat(form.min_compensation),
      max_compensation: parseFloat(form.max_compensation),
      employee_share: parseFloat(form.employee_share),
      employer_share: parseFloat(form.employer_share),
      is_active: true,
    }

    if (editingBracket) {
      const { error } = await supabase
        .from("hr_statutory_brackets")
        .update(payload)
        .eq("id", editingBracket.id)

      if (error) {
        toast({ title: "Error", description: "Failed to update bracket", variant: "destructive" })
        return
      }
      toast({ title: "Success", description: "Bracket updated" })
    } else {
      const { error } = await supabase
        .from("hr_statutory_brackets")
        .insert(payload)

      if (error) {
        toast({ title: "Error", description: "Failed to create bracket", variant: "destructive" })
        return
      }
      toast({ title: "Success", description: "Bracket created" })
    }

    setDialogOpen(false)
    fetchBrackets()
  }

  async function handleDelete(id: string) {
    const { error } = await supabase
      .from("hr_statutory_brackets")
      .delete()
      .eq("id", id)

    if (error) {
      toast({ title: "Error", description: "Failed to delete bracket", variant: "destructive" })
      return
    }
    toast({ title: "Success", description: "Bracket deleted" })
    fetchBrackets()
  }

  const filteredBrackets = brackets.filter(b => b.deduction_type === activeTab)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Statutory Deduction Brackets
        </CardTitle>
        <Button size="sm" onClick={() => openCreate(activeTab)}>
          <Plus className="h-4 w-4 mr-1" /> Add Bracket
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            {DEDUCTION_TYPES.map(t => (
              <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab}>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading brackets...</div>
            ) : filteredBrackets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No brackets configured. Click "Add Bracket" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">Min Compensation</th>
                      <th className="text-left py-2 px-3 font-medium">Max Compensation</th>
                      <th className="text-left py-2 px-3 font-medium">Employee Share</th>
                      <th className="text-left py-2 px-3 font-medium">Employer Share</th>
                      <th className="text-left py-2 px-3 font-medium">Status</th>
                      <th className="text-right py-2 px-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBrackets.map(b => (
                      <tr key={b.id} className="border-b hover:bg-muted/50">
                        <td className="py-2 px-3">₱{Number(b.min_compensation).toLocaleString()}</td>
                        <td className="py-2 px-3">
                          {b.max_compensation >= 9999999 ? "Above" : `₱${Number(b.max_compensation).toLocaleString()}`}
                        </td>
                        <td className="py-2 px-3">
                          {b.employee_share < 1 ? `${(b.employee_share * 100)}%` : `₱${Number(b.employee_share).toLocaleString()}`}
                        </td>
                        <td className="py-2 px-3">
                          {b.employer_share < 1 ? `${(b.employer_share * 100)}%` : `₱${Number(b.employer_share).toLocaleString()}`}
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant={b.is_active ? "default" : "secondary"}>
                            {b.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(b)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(b.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBracket ? "Edit Bracket" : "Add Bracket"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Deduction Type</Label>
                <Select value={form.deduction_type} onValueChange={v => setForm(f => ({ ...f, deduction_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEDUCTION_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Compensation (₱)</Label>
                  <Input
                    type="number"
                    value={form.min_compensation}
                    onChange={e => setForm(f => ({ ...f, min_compensation: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Max Compensation (₱)</Label>
                  <Input
                    type="number"
                    value={form.max_compensation}
                    onChange={e => setForm(f => ({ ...f, max_compensation: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee Share</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.employee_share}
                    onChange={e => setForm(f => ({ ...f, employee_share: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use decimal for % (e.g., 0.15 = 15%) or fixed amount
                  </p>
                </div>
                <div>
                  <Label>Employer Share</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.employer_share}
                    onChange={e => setForm(f => ({ ...f, employer_share: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">
                {editingBracket ? "Update Bracket" : "Create Bracket"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

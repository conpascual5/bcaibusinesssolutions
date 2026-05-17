import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import BusinessLayout from '@/components/BusinessLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/currency';
import { toast } from 'sonner';
import { Plus, Target, TrendingUp, Users, DollarSign } from 'lucide-react';
import { KPISkeleton } from '@/components/BusinessSkeleton';
import ExportButton from '@/components/ExportButton';

interface TargetItem {
  id: string;
  title: string;
  description: string | null;
  target_type: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  status: string;
}

export default function BusinessTargets() {
  const { user } = useAuth();
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', target_type: 'sales', target_value: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
  });

  useEffect(() => {
    if (user) fetchTargets();
  }, [user]);

  async function fetchTargets() {
    const { data } = await supabase.from('targets').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    if (data) setTargets(data);
    setLoading(false);
  }

  async function handleSave() {
    if (!form.title || !form.target_value) {
      toast.error('Title and target value are required');
      return;
    }
    const { error } = await supabase.from('targets').insert({
      user_id: user!.id, title: form.title, description: form.description || null,
      target_type: form.target_type, target_value: parseFloat(form.target_value),
      start_date: form.start_date, end_date: form.end_date,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Target created!');
    setDialogOpen(false);
    setForm({ title: '', description: '', target_type: 'sales', target_value: '', start_date: new Date().toISOString().split('T')[0], end_date: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0] });
    fetchTargets();
  }

  async function updateProgress(id: string, value: number) {
    const { error } = await supabase.from('targets').update({ current_value: value }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    fetchTargets();
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('targets').update({ status }).eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Target ${status}`);
    fetchTargets();
  }

  const typeIcons: Record<string, any> = { sales: DollarSign, revenue: TrendingUp, customers: Users, expenses: TrendingUp, other: Target };

  return (
    <BusinessLayout title="Target List" description="Monitor business activities and goals">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Targets</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{targets.filter(t => t.status === 'active').length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{targets.filter(t => t.status === 'completed').length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Targets</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{targets.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Avg Progress</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {targets.length ? Math.round(targets.reduce((s, t) => s + (t.target_value > 0 ? (t.current_value / t.target_value) * 100 : 0), 0) / targets.length) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2 mb-4">
        <ExportButton
          data={targets}
          filename="targets"
          title="Target List"
          columns={[
            { key: 'title', header: 'Title' },
            { key: 'target_type', header: 'Type' },
            { key: 'target_value', header: 'Target Value', formatter: v => `₱${v.toFixed(2)}` },
            { key: 'current_value', header: 'Current Value', formatter: v => `₱${v.toFixed(2)}` },
            { key: 'status', header: 'Status' },
            { key: 'start_date', header: 'Start Date', formatter: v => v ? new Date(v).toLocaleDateString() : '—' },
            { key: 'end_date', header: 'End Date', formatter: v => v ? new Date(v).toLocaleDateString() : '—' },
          ]}
        />
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Target</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create New Target</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Monthly Sales Goal" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={form.target_type} onValueChange={v => setForm(f => ({ ...f, target_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="revenue">Revenue</SelectItem>
                      <SelectItem value="customers">Customers</SelectItem>
                      <SelectItem value="expenses">Expenses</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Value (₱)</Label>
                  <Input type="number" step="0.01" value={form.target_value} onChange={e => setForm(f => ({ ...f, target_value: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Create Target</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <KPISkeleton count={4} />
      ) : targets.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No targets set yet. Create your first business target!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {targets.map(t => {
            const progress = t.target_value > 0 ? Math.min((t.current_value / t.target_value) * 100, 100) : 0;
            const Icon = typeIcons[t.target_type] || Target;
            return (
              <Card key={t.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                        <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{t.title}</CardTitle>
                        <p className="text-xs text-muted-foreground capitalize">{t.target_type} target</p>
                      </div>
                    </div>
                    <Badge variant={t.status === 'completed' ? 'default' : t.status === 'active' ? 'secondary' : 'outline'} className="capitalize">
                      {t.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {t.description && <p className="text-sm text-muted-foreground">{t.description}</p>}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{formatCurrency(t.current_value)} / {formatCurrency(t.target_value)}</span>
                      <span className="font-medium">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}</span>
                    <div className="flex gap-2">
                      {t.status === 'active' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => updateProgress(t.id, t.current_value + 1)}>+1</Button>
                          <Button variant="outline" size="sm" onClick={() => updateStatus(t.id, 'completed')}>Complete</Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </BusinessLayout>
  );
}

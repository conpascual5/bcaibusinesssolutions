import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import BusinessLayout from '@/components/BusinessLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users, Search, Phone, Mail } from 'lucide-react';
import { KPISkeleton, TableSkeleton } from '@/components/BusinessSkeleton';
import ExportButton from '@/components/ExportButton';

interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
}

export default function BusinessCustomers() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', notes: '' });

  useEffect(() => {
    if (user) fetchCustomers();
  }, [user]);

  async function fetchCustomers() {
    const { data } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setCustomers(data);
    setLoading(false);
  }

  function resetForm() {
    setForm({ name: '', email: '', phone: '', address: '', notes: '' });
    setEditing(null);
  }

  async function handleSave() {
    if (!form.name) {
      toast.error('Customer name is required');
      return;
    }
    const payload = { user_id: user!.id, ...form, email: form.email || null, phone: form.phone || null, address: form.address || null, notes: form.notes || null };

    if (editing) {
      const { error } = await supabase.from('customers').update(payload).eq('id', editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Customer updated');
    } else {
      const { error } = await supabase.from('customers').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Customer added');
    }
    setDialogOpen(false);
    resetForm();
    fetchCustomers();
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Customer deleted');
    fetchCustomers();
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setForm({
      name: customer.name,
      email: customer.email || '',
      phone: customer.phone || '',
      address: customer.address || '',
      notes: customer.notes || '',
    });
    setDialogOpen(true);
  }

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  return (
    <BusinessLayout title="Customer List" description="Record and manage customer data">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">With Email</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customers.filter(c => c.email).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">With Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{customers.filter(c => c.phone).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All Customers</CardTitle>
          <div className="flex items-center gap-2">
          <ExportButton
            data={filtered}
            filename="customers"
            title="Customer List"
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'email', header: 'Email', formatter: v => v || '—' },
              { key: 'phone', header: 'Phone', formatter: v => v || '—' },
              { key: 'address', header: 'Address', formatter: v => v || '—' },
              { key: 'created_at', header: 'Date Added', formatter: v => new Date(v).toLocaleDateString() },
            ]}
          />
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Add Customer</Button>
            </DialogTrigger>
          </div>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>{editing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Name *</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 234 567 890" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Full address" />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this customer" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>Cancel</Button>
                <Button onClick={handleSave}>{editing ? 'Update' : 'Save Customer'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          {loading ? (
            <TableSkeleton rows={5} />
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{search ? 'No customers match your search' : 'No customers yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(customer => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>
                        {customer.email ? (
                          <span className="flex items-center gap-1 text-sm"><Mail className="w-3 h-3" /> {customer.email}</span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {customer.phone ? (
                          <span className="flex items-center gap-1 text-sm"><Phone className="w-3 h-3" /> {customer.phone}</span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate text-muted-foreground">{customer.address || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)}>
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </BusinessLayout>
  );
}

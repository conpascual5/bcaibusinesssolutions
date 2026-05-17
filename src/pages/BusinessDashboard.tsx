import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import BusinessLayout from '@/components/BusinessLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router';
import { formatCurrency } from '@/lib/currency';
import {
  DollarSign, TrendingUp, TrendingDown, Package, Users,
  FileText, Target, Wallet, ArrowRight, ShoppingCart,
  Receipt, BarChart3, Activity
} from 'lucide-react';

export default function BusinessDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0, totalSales: 0, totalRevenue: 0, totalProfit: 0,
    totalExpenses: 0, totalCustomers: 0, totalInvoices: 0, activeTargets: 0,
    cashInflow: 0, cashOutflow: 0, recentSales: [] as any[], lowStock: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  async function fetchDashboardData() {
    try {
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];

      const [
        { count: prodCount },
        { data: salesData },
        { data: expenseData },
        { count: custCount },
        { count: invCount },
        { data: targetData },
        { data: cashData },
        { data: invMovements },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('sales').select('*, products:product_id(name)').eq('user_id', user!.id).gte('sale_date', monthStart).order('sale_date', { ascending: false }).limit(5),
        supabase.from('expenses').select('amount').eq('user_id', user!.id).gte('expense_date', monthStart),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
        supabase.from('targets').select('*').eq('user_id', user!.id).eq('status', 'active'),
        supabase.from('cash_flow').select('type, amount').eq('user_id', user!.id).gte('entry_date', monthStart),
        supabase.from('inventory').select('product_id, quantity, type').eq('user_id', user!.id),
      ]);

      const totalRevenue = (salesData || []).reduce((s: number, r: any) => s + r.total_amount, 0);
      const totalProfit = (salesData || []).reduce((s: number, r: any) => s + r.profit, 0);
      const totalExpenses = (expenseData || []).reduce((s: number, r: any) => s + r.amount, 0);
      const cashInflow = (cashData || []).filter((c: any) => c.type === 'inflow').reduce((s: number, c: any) => s + c.amount, 0);
      const cashOutflow = (cashData || []).filter((c: any) => c.type === 'outflow').reduce((s: number, c: any) => s + c.amount, 0);

      // Calculate stock levels
      const stockMap: Record<string, number> = {};
      (invMovements || []).forEach((m: any) => {
        if (!stockMap[m.product_id]) stockMap[m.product_id] = 0;
        stockMap[m.product_id] += m.type === 'in' ? m.quantity : -m.quantity;
      });
      const lowStock = Object.values(stockMap).filter(q => q <= 5).length;

      setStats({
        totalProducts: prodCount || 0,
        totalSales: (salesData || []).length,
        totalRevenue, totalProfit, totalExpenses,
        totalCustomers: custCount || 0,
        totalInvoices: invCount || 0,
        activeTargets: (targetData || []).length,
        cashInflow, cashOutflow,
        recentSales: (salesData || []).slice(0, 5),
        lowStock,
      });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    }
    setLoading(false);
  }

  const netCash = stats.cashInflow - stats.cashOutflow;
  const profitMargin = stats.totalRevenue > 0 ? (stats.totalProfit / stats.totalRevenue) * 100 : 0;

  const kpiCards = [
    { title: 'Revenue (MTD)', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'emerald', path: '/app/business/sales' },
    { title: 'Profit (MTD)', value: formatCurrency(stats.totalProfit), icon: TrendingUp, color: 'blue', path: '/app/business/sales' },
    { title: 'Expenses (MTD)', value: formatCurrency(stats.totalExpenses), icon: TrendingDown, color: 'rose', path: '/app/business/expenses' },
    { title: 'Net Cash Flow', value: formatCurrency(netCash), icon: Wallet, color: netCash >= 0 ? 'indigo' : 'orange', path: '/app/business/finance' },
    { title: 'Products', value: stats.totalProducts.toString(), icon: Package, color: 'violet', path: '/app/business/products' },
    { title: 'Customers', value: stats.totalCustomers.toString(), icon: Users, color: 'cyan', path: '/app/business/customers' },
    { title: 'Invoices', value: stats.totalInvoices.toString(), icon: FileText, color: 'amber', path: '/app/business/invoices' },
    { title: 'Active Targets', value: stats.activeTargets.toString(), icon: Target, color: 'pink', path: '/app/business/targets' },
  ];

  if (loading) {
    return (
      <BusinessLayout title="Business Dashboard" description="Dynamic KPIs and business insights">
        <div className="text-center py-12 text-muted-foreground">Loading dashboard...</div>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout title="Business Dashboard" description="Dynamic KPIs and real-time business insights">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {kpiCards.map((kpi, i) => {
          const colorMap: Record<string, string> = {
            emerald: 'from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
            blue: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
            rose: 'from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400',
            indigo: 'from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400',
            orange: 'from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400',
            violet: 'from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400',
            cyan: 'from-cyan-50 to-teal-50 dark:from-cyan-950/20 dark:to-teal-950/20 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400',
            amber: 'from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
            pink: 'from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-400',
          };
          return (
            <Card key={i} className={`bg-gradient-to-br ${colorMap[kpi.color]} cursor-pointer hover:shadow-md transition-shadow`} onClick={() => navigate(kpi.path)}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-medium">{kpi.title}</CardTitle>
                <kpi.icon className="w-4 h-4 opacity-60" />
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">{kpi.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShoppingCart className="w-4 h-4" />
              Recent Sales
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/business/sales')} className="gap-1 text-xs">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent>
            {stats.recentSales.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">No sales this month</p>
            ) : (
              <div className="space-y-2">
                {stats.recentSales.map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <DollarSign className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-medium text-xs">{sale.products?.name || 'Sale'}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(sale.sale_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xs">{formatCurrency(sale.total_amount)}</p>
                      <p className={`text-[10px] ${sale.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {sale.profit >= 0 ? '+' : ''}{formatCurrency(sale.profit)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profit Margin</span>
                <span className="font-medium">{profitMargin.toFixed(1)}%</span>
              </div>
              <Progress value={Math.min(profitMargin, 100)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cash Flow Health</span>
                <Badge variant={netCash >= 0 ? 'default' : 'destructive'} className="text-xs">
                  {netCash >= 0 ? 'Healthy' : 'Warning'}
                </Badge>
              </div>
              <Progress value={stats.cashInflow > 0 ? (netCash / stats.cashInflow) * 100 + 100 : 50} className="h-2" />
            </div>

            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Low Stock Items</span>
                <Badge variant={stats.lowStock > 0 ? 'destructive' : 'secondary'}>{stats.lowStock}</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Active Targets</span>
                <Badge>{stats.activeTargets}</Badge>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">Sales/Expense Ratio</span>
                <span className="font-medium text-sm">
                  {stats.totalExpenses > 0 ? (stats.totalRevenue / stats.totalExpenses).toFixed(1) + 'x' : '—'}
                </span>
              </div>
            </div>

            <div className="pt-2 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-2">Quick Links</p>
              {[
                { label: 'Record Sale', path: '/app/business/sales', icon: DollarSign },
                { label: 'Add Expense', path: '/app/business/expenses', icon: Receipt },
                { label: 'New Invoice', path: '/app/business/invoices', icon: FileText },
                { label: 'View Reports', path: '/app/business/dashboard', icon: BarChart3 },
              ].map((link, i) => (
                <Button key={i} variant="ghost" size="sm" className="w-full justify-start gap-2 text-xs" onClick={() => navigate(link.path)}>
                  <link.icon className="w-3.5 h-3.5" />
                  {link.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </BusinessLayout>
  );
}

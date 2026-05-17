import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import { Calendar, TrendingDown } from 'lucide-react';
import ExportButton from '@/components/ExportButton';

interface Product {
  id: string;
  name: string;
  unit_price: number;
  cost_price: number | null;
}

interface StockMovement {
  id: string;
  product_id: string;
  quantity: number;
  type: 'in' | 'out';
  created_at: string;
  products: { name: string; sku: string | null; unit: string } | null;
}

interface Props {
  movements: StockMovement[];
  products: Product[];
}

export default function InventoryDailySold({ movements, products }: Props) {
  const dailySold = useMemo(() => {
    const outMovements = movements.filter(m => m.type === 'out');
    const grouped: Record<string, {
      product_name: string;
      total_qty: number;
      total_revenue: number;
      total_profit: number;
      date: string;
    }> = {};
    outMovements.forEach(m => {
      const date = new Date(m.created_at).toISOString().split('T')[0];
      const key = `${m.product_id}-${date}`;
      if (!grouped[key]) {
        grouped[key] = {
          product_name: m.products?.name || 'Unknown',
          total_qty: 0,
          total_revenue: 0,
          total_profit: 0,
          date,
        };
      }
      grouped[key].total_qty += m.quantity;
      const product = products.find(p => p.id === m.product_id);
      if (product) {
        grouped[key].total_revenue += m.quantity * product.unit_price;
        if (product.cost_price) {
          grouped[key].total_profit += m.quantity * (product.unit_price - product.cost_price);
        }
      }
    });
    return Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
  }, [movements, products]);

  const summaryByDate = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; profit: number; items: number }> = {};
    dailySold.forEach(d => {
      if (!map[d.date]) map[d.date] = { date: d.date, revenue: 0, profit: 0, items: 0 };
      map[d.date].revenue += d.total_revenue;
      map[d.date].profit += d.total_profit;
      map[d.date].items += d.total_qty;
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [dailySold]);

  const totalRevenue = summaryByDate.reduce((s, d) => s + d.revenue, 0);
  const totalProfit = summaryByDate.reduce((s, d) => s + d.profit, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium uppercase tracking-wider text-blue-800 dark:text-blue-300">Total Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{formatCurrency(totalRevenue)}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Total Profit</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">{formatCurrency(totalProfit)}</p></CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-1"><CardTitle className="text-xs font-medium uppercase tracking-wider text-purple-800 dark:text-purple-300">Total Items Sold</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-purple-800 dark:text-purple-300">{summaryByDate.reduce((s, d) => s + d.items, 0).toLocaleString()}</p></CardContent>
        </Card>
      </div>

      {/* Daily Summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Daily Sales Summary
          </CardTitle>
          <ExportButton
            data={dailySold}
            filename="inventory-daily-sold"
            title="Daily Sold Items"
            columns={[
              { key: 'date', header: 'Date' },
              { key: 'product_name', header: 'Product' },
              { key: 'total_qty', header: 'Quantity Sold' },
              { key: 'total_revenue', header: 'Revenue', formatter: v => formatCurrency(v) },
              { key: 'total_profit', header: 'Profit', formatter: v => formatCurrency(v) },
            ]}
          />
        </CardHeader>
        <CardContent>
          {dailySold.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No sales recorded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailySold.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm whitespace-nowrap">{new Date(d.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                      <TableCell className="font-medium">{d.product_name}</TableCell>
                      <TableCell className="text-right font-bold">{d.total_qty}</TableCell>
                      <TableCell className="text-right font-medium text-blue-600 dark:text-blue-400">{formatCurrency(d.total_revenue)}</TableCell>
                      <TableCell className={`text-right font-medium ${d.total_profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{formatCurrency(d.total_profit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Totals */}
      {summaryByDate.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-indigo-500" />
              Daily Totals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Items Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaryByDate.map(d => (
                    <TableRow key={d.date}>
                      <TableCell className="font-medium">{new Date(d.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                      <TableCell className="text-right">{d.items}</TableCell>
                      <TableCell className="text-right font-medium text-blue-600 dark:text-blue-400">{formatCurrency(d.revenue)}</TableCell>
                      <TableCell className={`text-right font-medium ${d.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>{formatCurrency(d.profit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, BarChart3, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  unit_price: number;
  cost_price: number | null;
}

interface StockLevel {
  product: Product;
  quantity: number;
}

interface Stats {
  totalProducts: number;
  totalMovements: number;
  lowStock: number;
  outOfStock: number;
  totalStockIn: number;
  totalStockOut: number;
  totalInventoryValue: number;
  totalCostValue: number;
}

interface Props {
  stockLevels: Record<string, StockLevel>;
  stats: Stats;
}

export default function InventoryDashboard({ stockLevels, stats }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="w-4 h-4 text-indigo-500" />
            Current Stock Levels
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.values(stockLevels).length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No products yet</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {Object.values(stockLevels).sort((a, b) => a.quantity - b.quantity).map(sl => (
                <div key={sl.product.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      sl.quantity <= 0 ? 'bg-red-500' : sl.quantity <= 5 ? 'bg-amber-500' : sl.quantity <= 20 ? 'bg-blue-500' : 'bg-emerald-500'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{sl.product.name}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        {sl.product.sku && <span>{sl.product.sku}</span>}
                        <span>{sl.product.unit || 'pcs'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className={`text-lg font-bold ${
                      sl.quantity <= 0 ? 'text-red-500' : sl.quantity <= 5 ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>{sl.quantity}</p>
                    <p className="text-[10px] text-muted-foreground">{formatCurrency(sl.quantity * sl.product.unit_price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              Inventory Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Total Inventory Value', value: formatCurrency(stats.totalInventoryValue) },
              { label: 'Total Cost Value', value: formatCurrency(stats.totalCostValue) },
              { label: 'Potential Profit', value: formatCurrency(stats.totalInventoryValue - stats.totalCostValue), highlight: true },
              { label: 'Stock In / Out Ratio', value: stats.totalStockOut > 0 ? (stats.totalStockIn / stats.totalStockOut).toFixed(2) : stats.totalStockIn > 0 ? '∞' : '—' },
              { label: 'Total Movements', value: stats.totalMovements.toLocaleString() },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <span className={`font-bold text-sm ${item.highlight ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.outOfStock > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-400"><strong>{stats.outOfStock}</strong> product(s) out of stock</p>
              </div>
            )}
            {stats.lowStock > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400"><strong>{stats.lowStock}</strong> product(s) low stock (≤ 5)</p>
              </div>
            )}
            {stats.outOfStock === 0 && stats.lowStock === 0 && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <p className="text-xs text-emerald-700 dark:text-emerald-400">All products are well-stocked</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

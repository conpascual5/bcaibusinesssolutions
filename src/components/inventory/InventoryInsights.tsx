import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Clock, Zap, AlertTriangle, Package } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  unit_price: number;
  cost_price: number | null;
  category: string;
}

interface StockMovement {
  id: string;
  product_id: string;
  quantity: number;
  type: 'in' | 'out';
  reference: string | null;
  notes: string | null;
  created_at: string;
  products: { name: string; sku: string | null; unit: string } | null;
}

interface StockLevel {
  product: Product;
  quantity: number;
}

interface Props {
  stockLevels: Record<string, StockLevel>;
  movements: StockMovement[];
  products: Product[];
}

export default function InventoryInsights({ stockLevels, movements, products }: Props) {
  const fastMoving = useMemo(() => {
    const outMap: Record<string, { product: Product; totalOut: number; count: number }> = {};
    products.forEach(p => {
      outMap[p.id] = { product: p, totalOut: 0, count: 0 };
    });
    movements
      .filter(m => m.type === 'out')
      .forEach(m => {
        if (outMap[m.product_id]) {
          outMap[m.product_id].totalOut += m.quantity;
          outMap[m.product_id].count += 1;
        }
      });
    return Object.values(outMap)
      .filter(x => x.totalOut > 0)
      .sort((a, b) => b.totalOut - a.totalOut)
      .slice(0, 3);
  }, [products, movements]);

  const slowMoving = useMemo(() => {
    const outMap: Record<string, { product: Product; totalOut: number }> = {};
    products.forEach(p => {
      outMap[p.id] = { product: p, totalOut: 0 };
    });
    movements
      .filter(m => m.type === 'out')
      .forEach(m => {
        if (outMap[m.product_id]) {
          outMap[m.product_id].totalOut += m.quantity;
        }
      });
    return Object.values(outMap)
      .sort((a, b) => a.totalOut - b.totalOut)
      .slice(0, 3);
  }, [products, movements]);

  const agingRisk = useMemo(() => {
    const now = new Date();
    const lastMovementMap: Record<string, { product: Product; lastDate: Date | null; daysSinceLast: number }> = {};
    products.forEach(p => {
      const productMovements = movements.filter(m => m.product_id === p.id);
      const dates = productMovements.map(m => new Date(m.created_at));
      const lastDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : null;
      const daysSinceLast = lastDate ? Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;
      lastMovementMap[p.id] = { product: p, lastDate, daysSinceLast };
    });
    return Object.values(lastMovementMap)
      .sort((a, b) => b.daysSinceLast - a.daysSinceLast)
      .slice(0, 5);
  }, [products, movements]);

  const getAgingBadge = (days: number) => {
    if (days === Infinity) return { label: 'No Movement', color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800' };
    if (days >= 90) return { label: 'Critical', color: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-800' };
    if (days >= 60) return { label: 'High Risk', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200 dark:border-orange-800' };
    if (days >= 30) return { label: 'At Risk', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200 dark:border-amber-800' };
    return { label: 'Healthy', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Fast Moving Items */}
      <Card className="border-emerald-200 dark:border-emerald-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            Fast Moving Items
          </CardTitle>
          <p className="text-xs text-muted-foreground">Top products by sales velocity</p>
        </CardHeader>
        <CardContent>
          {fastMoving.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">No sales data yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fastMoving.map((item, i) => {
                const stock = stockLevels[item.product.id];
                return (
                  <div key={item.product.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50/50 to-transparent dark:from-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <TrendingUp className="w-3 h-3 text-emerald-500" />
                          <span>{item.totalOut} {item.product.unit || 'pcs'} sold</span>
                          {stock && <span>· {stock.quantity} left</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{item.count}x</p>
                      <p className="text-[10px] text-muted-foreground">transactions</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Slow Moving Items */}
      <Card className="border-amber-200 dark:border-amber-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
              <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            Slow Moving Items
          </CardTitle>
          <p className="text-xs text-muted-foreground">Products with lowest sales</p>
        </CardHeader>
        <CardContent>
          {slowMoving.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">No products yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {slowMoving.map((item, i) => {
                const stock = stockLevels[item.product.id];
                const isZero = item.totalOut === 0;
                return (
                  <div key={item.product.id} className={`flex items-center justify-between p-3 rounded-xl border ${isZero ? 'bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/30' : 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${isZero ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}`}>
                        {i + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{item.product.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          {isZero ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-red-500" />
                              <span className="text-red-600 dark:text-red-400 font-medium">No sales yet</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-3 h-3 text-amber-500" />
                              <span>{item.totalOut} {item.product.unit || 'pcs'} sold</span>
                            </>
                          )}
                          {stock && stock.quantity > 0 && <span>· {stock.quantity} in stock</span>}
                        </div>
                      </div>
                    </div>
                    {stock && (
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{stock.quantity}</p>
                        <p className="text-[10px] text-muted-foreground">in stock</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Aging Risk */}
      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
              <Clock className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            Inventory Aging Risk
          </CardTitle>
          <p className="text-xs text-muted-foreground">Products with oldest activity</p>
        </CardHeader>
        <CardContent>
          {agingRisk.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs">No products yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {agingRisk.map(item => {
                const badge = getAgingBadge(item.daysSinceLast);
                const stock = stockLevels[item.product.id];
                return (
                  <div key={item.product.id} className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-red-50/50 to-transparent dark:from-red-950/10 border border-red-100 dark:border-red-900/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${badge.color}`}>
                            {badge.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {item.daysSinceLast === Infinity
                              ? 'Never moved'
                              : `${item.daysSinceLast} day${item.daysSinceLast !== 1 ? 's' : ''} ago`}
                          </span>
                          {stock && <span>· {stock.quantity} {item.product.unit || 'pcs'}</span>}
                        </div>
                      </div>
                    </div>
                    {stock && (
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm font-bold">{formatCurrency(stock.quantity * stock.product.unit_price)}</p>
                        <p className="text-[10px] text-muted-foreground">value</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

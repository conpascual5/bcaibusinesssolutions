import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import { useBusinessTeam } from '@/providers/business-team';
import BusinessLayout from '@/components/BusinessLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/currency';
import { Activity, Package, ArrowDownUp, Calendar } from 'lucide-react';
import { KPISkeleton } from '@/components/BusinessSkeleton';
import InventoryDashboard from '@/components/inventory/InventoryDashboard';
import InventoryProducts from '@/components/inventory/InventoryProducts';
import InventoryMovements from '@/components/inventory/InventoryMovements';
import InventoryDailySold from '@/components/inventory/InventoryDailySold';

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

export default function BusinessInventory() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (businessOwnerId) { fetchData(); }
  }, [businessOwnerId]);

  async function fetchData() {
    const [prodRes, movRes] = await Promise.all([
      supabase.from('products').select('id, name, sku, unit, unit_price, cost_price, category').eq('user_id', businessOwnerId!).order('name', { ascending: true }),
      supabase.from('inventory').select('*, products:product_id(name, sku, unit)').eq('user_id', businessOwnerId!).order('created_at', { ascending: false }),
    ]);
    if (prodRes.data) setProducts(prodRes.data);
    if (movRes.data) setMovements(movRes.data);
    setLoading(false);
  }

  const stockLevels = useMemo(() => {
    const map: Record<string, { product: Product; quantity: number }> = {};
    products.forEach(p => { map[p.id] = { product: p, quantity: 0 }; });
    movements.forEach(m => {
      if (map[m.product_id]) {
        map[m.product_id].quantity += m.type === 'in' ? m.quantity : -m.quantity;
      }
    });
    return map;
  }, [products, movements]);

  const stats = useMemo(() => {
    const totalProducts = products.length;
    const totalMovements = movements.length;
    const lowStock = Object.values(stockLevels).filter(sl => sl.quantity > 0 && sl.quantity <= 5).length;
    const outOfStock = Object.values(stockLevels).filter(sl => sl.quantity <= 0).length;
    const totalStockIn = movements.filter(m => m.type === 'in').reduce((s, m) => s + m.quantity, 0);
    const totalStockOut = movements.filter(m => m.type === 'out').reduce((s, m) => s + m.quantity, 0);
    const totalInventoryValue = Object.values(stockLevels).reduce((s, sl) => s + (sl.quantity * sl.product.unit_price), 0);
    const totalCostValue = Object.values(stockLevels).reduce((s, sl) => s + (sl.quantity * (sl.product.cost_price || 0)), 0);
    return { totalProducts, totalMovements, lowStock, outOfStock, totalStockIn, totalStockOut, totalInventoryValue, totalCostValue };
  }, [products, movements, stockLevels]);

  if (loading) {
    return (
      <BusinessLayout title="Inventory System" description="Accurate inventory tracking in seconds">
        <KPISkeleton count={6} />
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout title="Inventory System" description="Accurate inventory tracking in seconds">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Products', value: stats.totalProducts, color: 'emerald' },
          { label: 'Stock In', value: stats.totalStockIn.toLocaleString(), color: 'blue' },
          { label: 'Stock Out', value: stats.totalStockOut.toLocaleString(), color: 'rose' },
          { label: 'Low Stock', value: stats.lowStock, color: 'amber', highlight: stats.lowStock > 0 },
          { label: 'Out of Stock', value: stats.outOfStock, color: 'red', highlight: stats.outOfStock > 0 },
          { label: 'Inventory Value', value: formatCurrency(stats.totalInventoryValue), color: 'purple' },
        ].map((kpi, i) => {
          const colorMap: Record<string, string> = {
            emerald: 'from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
            blue: 'from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
            rose: 'from-rose-50 to-red-50 dark:from-rose-950/20 dark:to-red-950/20 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300',
            amber: 'from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300',
            red: 'from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300',
            purple: 'from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300',
          };
          return (
            <Card key={i} className={`bg-gradient-to-br ${colorMap[kpi.color]}`}>
              <CardHeader className="pb-1"><CardTitle className="text-[10px] font-medium uppercase tracking-wider">{kpi.label}</CardTitle></CardHeader>
              <CardContent><p className={`text-xl font-bold ${kpi.highlight ? 'text-red-600 dark:text-red-400' : ''}`}>{kpi.value}</p></CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-card border border-border p-1 rounded-xl">
          <TabsTrigger value="dashboard" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white gap-2">
            <Activity className="w-4 h-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="products" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white gap-2">
            <Package className="w-4 h-4" /> Products
          </TabsTrigger>
          <TabsTrigger value="movements" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white gap-2">
            <ArrowDownUp className="w-4 h-4" /> Stock Movements
          </TabsTrigger>
          <TabsTrigger value="daily" className="rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white gap-2">
            <Calendar className="w-4 h-4" /> Daily Sold
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-0">
          <InventoryDashboard stockLevels={stockLevels} stats={stats} />
        </TabsContent>

        <TabsContent value="products" className="mt-0">
          <InventoryProducts products={products} stockLevels={stockLevels} onRefresh={fetchData} />
        </TabsContent>

        <TabsContent value="movements" className="mt-0">
          <InventoryMovements movements={movements} products={products} onRefresh={fetchData} businessOwnerId={businessOwnerId!} />
        </TabsContent>

        <TabsContent value="daily" className="mt-0">
          <InventoryDailySold movements={movements} products={products} />
        </TabsContent>
      </Tabs>
    </BusinessLayout>
  );
}

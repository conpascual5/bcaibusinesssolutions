import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import { useBusinessTeam } from '@/providers/business-team';
import BusinessLayout from '@/components/BusinessLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/currency';
import { Calculator, DollarSign, Percent, TrendingUp } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  unit_price: number;
  cost_price: number | null;
}

export default function BusinessPricing() {
  const { user } = useAuth();
  const { businessOwnerId } = useBusinessTeam();
  const [products, setProducts] = useState<Product[]>([]);
  const [costPrice, setCostPrice] = useState(50);
  const [overhead, setOverhead] = useState(10);
  const [margin, setMargin] = useState([30]);

  useEffect(() => {
    if (user && businessOwnerId) fetchProducts();
  }, [user, businessOwnerId]);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('id, name, unit_price, cost_price').eq('user_id', businessOwnerId!);
    if (data) setProducts(data);
  }

  const totalCost = costPrice + overhead;
  const suggestedPrice = totalCost / (1 - margin[0] / 100);
  const profitPerUnit = suggestedPrice - totalCost;

  return (
    <BusinessLayout title="Pricing Calculator" description="Optimize cost and profit margins">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Price Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Cost Price (₱)</Label>
              <Input type="number" value={costPrice} onChange={e => setCostPrice(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-2">
              <Label>Overhead per Unit (₱)</Label>
              <Input type="number" value={overhead} onChange={e => setOverhead(parseFloat(e.target.value) || 0)} />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Target Margin: {margin[0]}%</Label>
                <span className="text-sm font-medium text-indigo-600">{margin[0]}%</span>
              </div>
              <Slider value={margin} onValueChange={setMargin} min={1} max={90} step={1} />
            </div>

            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 p-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-medium">{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Suggested Selling Price</span>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{formatCurrency(suggestedPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profit per Unit</span>
                <span className="font-medium text-green-600">{formatCurrency(profitPerUnit)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1 border-t border-indigo-200 dark:border-indigo-800">
                <span className="text-muted-foreground">Margin</span>
                <span className="font-bold">{margin[0]}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Product Margins Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No products yet</p>
            ) : (
              <div className="space-y-3">
                {products.map(p => {
                  const cost = p.cost_price || 0;
                  const productMargin = p.unit_price > 0 ? ((p.unit_price - cost) / p.unit_price) * 100 : 0;
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Cost: {formatCurrency(cost)} | Sell: {formatCurrency(p.unit_price)}</p>
                      </div>
                      <Badge variant={productMargin >= 30 ? 'default' : productMargin >= 10 ? 'secondary' : 'destructive'}>
                        {productMargin.toFixed(1)}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </BusinessLayout>
  );
}

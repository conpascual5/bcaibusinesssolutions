import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import BusinessLayout from '@/components/BusinessLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calculator, DollarSign, Percent, TrendingUp } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  unit_price: number;
  cost_price: number | null;
}

export default function BusinessPricing() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [costPrice, setCostPrice] = useState('50');
  const [desiredMargin, setDesiredMargin] = useState(30);
  const [overhead, setOverhead] = useState('10');

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  async function fetchProducts() {
    const { data } = await supabase.from('products').select('id, name, unit_price, cost_price').eq('user_id', user!.id);
    if (data) setProducts(data);
  }

  const cost = parseFloat(costPrice) || 0;
  const overheadCost = parseFloat(overhead) || 0;
  const totalCost = cost + overheadCost;
  const suggestedPrice = totalCost / (1 - desiredMargin / 100);
  const profitPerUnit = suggestedPrice - totalCost;

  return (
    <BusinessLayout title="Pricing Calculator" description="Optimize cost and profit margins">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Price Optimizer
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Cost Price ($)</Label>
              <Input type="number" step="0.01" value={costPrice} onChange={e => setCostPrice(e.target.value)} placeholder="50" />
            </div>
            <div className="space-y-2">
              <Label>Overhead per Unit ($)</Label>
              <Input type="number" step="0.01" value={overhead} onChange={e => setOverhead(e.target.value)} placeholder="10" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Desired Margin: {desiredMargin}%</Label>
                <span className="text-sm font-medium text-indigo-600">{desiredMargin}%</span>
              </div>
              <Slider value={[desiredMargin]} onValueChange={([v]) => setDesiredMargin(v)} min={5} max={80} step={1} />
            </div>

            <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Cost</span>
                <span className="font-medium">${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Suggested Price</span>
                <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">${suggestedPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Profit per Unit</span>
                <span className="font-medium text-green-600">${profitPerUnit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Margin</span>
                <Badge variant="default" className="text-xs">{desiredMargin}%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Margins Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Product Margins Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {products.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Add products first to see margin analysis</p>
            ) : (
              <div className="space-y-3">
                {products.map(p => {
                  const margin = p.cost_price ? ((p.unit_price - p.cost_price) / p.unit_price * 100) : null;
                  return (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">Cost: ${p.cost_price?.toFixed(2) || 'N/A'} | Sell: ${p.unit_price.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        {margin !== null ? (
                          <Badge variant={margin >= 30 ? 'default' : margin >= 10 ? 'secondary' : 'destructive'}>
                            {margin.toFixed(1)}%
                          </Badge>
                        ) : (
                          <Badge variant="outline">No cost</Badge>
                        )}
                      </div>
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

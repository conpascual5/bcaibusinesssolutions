import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/auth';
import {
  Download, Check, FileSpreadsheet, FileText, Star, ArrowRight,
  ShoppingCart, Loader2, ExternalLink, MessageSquare, Shield,
  Sparkles, Layers, BarChart3, ChevronRight, AlertCircle,
  Grid3X3,
} from 'lucide-react';
import MarketingToolkitDrawer from "@/components/MarketingToolkitDrawer";

type TrackerTemplate = {
  id: string;
  name: string;
  slug: string;
  description: string;
  long_description: string;
  price_excel: number;
  price_gsheets: number;
  category: string;
  features: string[];
  inclusions: string[];
  highlights: string[];
  is_active: boolean;
};

type UserPurchase = {
  id: string;
  template_id: string;
  format: 'excel' | 'gsheets';
  is_downloadable: boolean;
  purchased_at: string;
  downloadable_at: string | null;
};

const EDGE_FUNCTION_MAP: Record<string, string> = {
  'business-management-system': 'bms-template',
  'inventory-tracker': 'inventory-template',
  'finance-tracker': 'finance-template',
  'payment-tracker': 'payment-template',
};

function getEdgeFunctionSlug(slug: string): string {
  return EDGE_FUNCTION_MAP[slug] || slug;
}

export default function AppShop() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<TrackerTemplate[]>([]);
  const [purchases, setPurchases] = useState<UserPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [templatesRes, purchasesRes] = await Promise.all([
        supabase.from('tracker_templates').select('*').eq('is_active', true),
        supabase.from('user_purchases').select('*').eq('user_id', user?.id || ''),
      ]);
      setTemplates(templatesRes.data as unknown as TrackerTemplate[]);
      setPurchases(purchasesRes.data as unknown as UserPurchase[]);
      setLoading(false);
    })();
  }, [user?.id]);

  const getPurchase = (templateId: string, format: 'excel' | 'gsheets') => {
    return purchases.find(p => p.template_id === templateId && p.format === format);
  };

  const handleRequestPurchase = async (templateId: string, format: 'excel' | 'gsheets') => {
    const key = `${templateId}-${format}`;
    setRequesting(key);
    // Insert a purchase request (is_downloadable = false by default)
    const { error } = await supabase.from('user_purchases').insert({
      user_id: user?.id,
      template_id: templateId,
      format: format,
      is_downloadable: false,
    });
    if (!error) {
      setRequestSuccess(key);
      // Refresh purchases
      const { data } = await supabase.from('user_purchases').select('*').eq('user_id', user?.id || '');
      setPurchases(data as unknown as UserPurchase[]);
      setTimeout(() => setRequestSuccess(null), 3000);
    }
    setRequesting(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-20">
        <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">No Trackers Available</h2>
        <p className="text-muted-foreground text-sm">Check back soon for new tracker templates.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Tracker Shop</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Purchase downloadable tracker templates. One-time payment, lifetime access.
          </p>
        </div>
        <div className="shrink-0">
          <MarketingToolkitDrawer>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">
              <Grid3X3 className="w-3.5 h-3.5" />
              Tools
            </button>
          </MarketingToolkitDrawer>
        </div>
      </div>

      {templates.map((template) => {
        const excelPurchase = getPurchase(template.id, 'excel');
        const gsheetsPurchase = getPurchase(template.id, 'gsheets');

        return (
          <div key={template.id} className="bg-card rounded-2xl border border-border overflow-hidden">
            {/* Template Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-sm">
                      <Download className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{template.name}</h2>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{template.category}</span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{template.description}</p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="px-6 py-4 border-b border-border bg-accent/20">
              <div className="flex items-center gap-1.5 mb-3">
                <BarChart3 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">12 Integrated Trackers</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {template.features.map((feature, i) => {
                  const [title, ...descParts] = feature.split(': ');
                  return (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="font-semibold text-foreground">{title}</span>
                        {descParts.length > 0 && <span className="text-muted-foreground">: {descParts.join(': ')}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing & Purchase Cards */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Google Sheets */}
              <div className={`rounded-xl border p-5 transition-all ${gsheetsPurchase?.is_downloadable ? 'border-emerald-300 bg-emerald-50/50' : 'border-border bg-card'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-sm">
                      <FileSpreadsheet className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">Google Sheets</h3>
                      <p className="text-xs text-muted-foreground">PHP {template.price_gsheets.toLocaleString()}</p>
                    </div>
                  </div>
                  {gsheetsPurchase?.is_downloadable && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                      <Check className="w-3 h-3" /> Downloaded
                    </span>
                  )}
                </div>

                {!gsheetsPurchase && (
                  <button
                    onClick={() => handleRequestPurchase(template.id, 'gsheets')}
                    disabled={requesting === `${template.id}-gsheets`}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {requesting === `${template.id}-gsheets` ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Requesting...</>
                    ) : (
                      <><ShoppingCart className="w-4 h-4" /> Purchase — PHP {template.price_gsheets.toLocaleString()}</>
                    )}
                  </button>
                )}

                {gsheetsPurchase && !gsheetsPurchase.is_downloadable && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Payment pending. Message us on Facebook to complete your purchase.</span>
                    </div>
                    <a
                      href="https://www.facebook.com/bcsocialmediaservices"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" /> Message Us on Facebook
                    </a>
                  </div>
                )}

                {gsheetsPurchase?.is_downloadable && (
                  <a
                    href={`https://dkatgjtvhitknghvaxxn.supabase.co/functions/v1/generate-${getEdgeFunctionSlug(template.slug)}?format=gsheets`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all"
                    download
                  >
                    <Download className="w-4 h-4" /> Download Now
                  </a>
                )}

                {requestSuccess === `${template.id}-gsheets` && (
                  <p className="text-xs text-emerald-600 mt-2 text-center">Purchase request sent! We'll notify you once it's ready.</p>
                )}
              </div>

              {/* MS Excel */}
              <div className={`rounded-xl border p-5 transition-all ${excelPurchase?.is_downloadable ? 'border-emerald-300 bg-emerald-50/50' : 'border-border bg-card'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground text-sm">MS Excel</h3>
                      <p className="text-xs text-muted-foreground">PHP {template.price_excel.toLocaleString()}</p>
                    </div>
                  </div>
                  {excelPurchase?.is_downloadable && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold">
                      <Check className="w-3 h-3" /> Downloaded
                    </span>
                  )}
                </div>

                {!excelPurchase && (
                  <button
                    onClick={() => handleRequestPurchase(template.id, 'excel')}
                    disabled={requesting === `${template.id}-excel`}
                    className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {requesting === `${template.id}-excel` ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Requesting...</>
                    ) : (
                      <><ShoppingCart className="w-4 h-4" /> Purchase — PHP {template.price_excel.toLocaleString()}</>
                    )}
                  </button>
                )}

                {excelPurchase && !excelPurchase.is_downloadable && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Payment pending. Message us on Facebook to complete your purchase.</span>
                    </div>
                    <a
                      href="https://www.facebook.com/bcsocialmediaservices"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all"
                    >
                      <MessageSquare className="w-4 h-4" /> Message Us on Facebook
                    </a>
                  </div>
                )}

                {excelPurchase?.is_downloadable && (
                  <a
                    href={`https://dkatgjtvhitknghvaxxn.supabase.co/functions/v1/generate-${getEdgeFunctionSlug(template.slug)}?format=excel`}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all"
                    download
                  >
                    <Download className="w-4 h-4" /> Download Now
                  </a>
                )}

                {requestSuccess === `${template.id}-excel` && (
                  <p className="text-xs text-emerald-600 mt-2 text-center">Purchase request sent! We'll notify you once it's ready.</p>
                )}
              </div>
            </div>

            {/* Highlights */}
            <div className="px-6 py-4 border-t border-border bg-accent/10">
              <div className="flex items-center gap-1.5 mb-2">
                <Star className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Features & Benefits</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.highlights.map((h, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-background border border-border rounded-full text-[11px] text-muted-foreground">
                    <Check className="w-3 h-3 text-emerald-500" />
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      {/* How it works */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h3 className="text-base font-bold text-foreground mb-4">How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Request Purchase', desc: 'Click "Purchase" on the format you want. We\'ll record your request.', color: 'bg-emerald-500' },
            { step: '2', title: 'Pay via GCash', desc: 'Message us on Facebook and send payment via GCash. We\'ll confirm within 24 hours.', color: 'bg-amber-500' },
            { step: '3', title: 'Download Instantly', desc: 'Once confirmed, the download button will appear here. Lifetime access.', color: 'bg-purple-500' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm`}>
                <span className="text-lg font-extrabold text-white">{item.step}</span>
              </div>
              <h4 className="font-bold text-foreground text-sm mb-1">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

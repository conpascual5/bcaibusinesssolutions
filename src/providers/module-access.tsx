import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { supabase } from '@/integrations/supabase/client';

export type ModuleKey = 
  | 'sales_wizard'
  | 'sales_report'
  | 'fb_ads_targeting'
  | 'image_analyzer'
  | 'ad_analyzer'
  | 'invoices'
  | 'my_assets'
  | 'library';

const MODULE_LABELS: Record<ModuleKey, string> = {
  sales_wizard: 'Sales Wizard',
  sales_report: 'Sales Report',
  fb_ads_targeting: 'FB Ads Targeting',
  image_analyzer: 'Image Analyzer',
  ad_analyzer: 'Ad Analyzer',
  invoices: 'Invoices',
  my_assets: 'My Assets',
  library: 'Library',
};

const MODULE_ICONS: Record<ModuleKey, string> = {
  sales_wizard: 'Wand',
  sales_report: 'BarChart3',
  fb_ads_targeting: 'Target',
  image_analyzer: 'Image',
  ad_analyzer: 'Search',
  invoices: 'FileText',
  my_assets: 'Package',
  library: 'BookOpen',
};

type ModuleAccessContextType = {
  hasModuleAccess: (module: ModuleKey) => boolean;
  loading: boolean;
  grantedModules: ModuleKey[];
};

const ModuleAccessContext = createContext<ModuleAccessContextType>({
  hasModuleAccess: () => false,
  loading: true,
  grantedModules: [],
});

export function ModuleAccessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [grantedModules, setGrantedModules] = useState<ModuleKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setGrantedModules([]);
      setLoading(false);
      return;
    }

    (async () => {
      // Pro Plus and VIP users automatically get all module access
      const plan = user.plan || 'free';
      if (plan === 'pro_plus' || plan === 'vip') {
        const allModules: ModuleKey[] = [
          'sales_wizard', 'sales_report', 'fb_ads_targeting',
          'image_analyzer', 'ad_analyzer', 'invoices',
          'my_assets', 'library'
        ];
        setGrantedModules(allModules);
        setLoading(false);
        return;
      }

      // Check user_module_access table
      const { data } = await supabase
        .from('user_module_access')
        .select('module')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (data) {
        const modules = data.map((r: any) => r.module as ModuleKey);
        setGrantedModules(modules);
      } else {
        setGrantedModules([]);
      }
      setLoading(false);
    })();
  }, [user]);

  const hasModuleAccess = (module: ModuleKey): boolean => {
    return grantedModules.includes(module);
  };

  return (
    <ModuleAccessContext.Provider value={{ hasModuleAccess, loading, grantedModules }}>
      {children}
    </ModuleAccessContext.Provider>
  );
}

export function useModuleAccess() {
  return useContext(ModuleAccessContext);
}

export { MODULE_LABELS, MODULE_ICONS };

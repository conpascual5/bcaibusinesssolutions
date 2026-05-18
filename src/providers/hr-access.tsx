import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { supabase } from '@/integrations/supabase/client';
import { hasHRAccess } from '@/lib/planConfig';

type HRAccessContextType = {
  hasHRAccess: boolean;
  hrBusinessId: string | null;
  loading: boolean;
};

const HRAccessContext = createContext<HRAccessContextType>({
  hasHRAccess: false,
  hrBusinessId: null,
  loading: true,
});

export function HRAccessProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [hrBusinessId, setHrBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setHasAccess(false);
      setHrBusinessId(null);
      setLoading(false);
      return;
    }

    (async () => {
      // Pro Plus and VIP users automatically get HR access
      const plan = user.plan || 'free';
      if (hasHRAccess(plan)) {
        setHasAccess(true);
        setHrBusinessId(user.id);
        setLoading(false);
        return;
      }

      // Check if user has explicit HR access via hr_user_access table
      const { data } = await supabase
        .from('hr_user_access')
        .select('business_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (data) {
        setHasAccess(true);
        setHrBusinessId(data.business_id);
      } else {
        setHasAccess(false);
        setHrBusinessId(null);
      }
      setLoading(false);
    })();
  }, [user]);

  return (
    <HRAccessContext.Provider value={{ hasHRAccess: hasAccess, hrBusinessId, loading }}>
      {children}
    </HRAccessContext.Provider>
  );
}

export function useHRAccess() {
  return useContext(HRAccessContext);
}

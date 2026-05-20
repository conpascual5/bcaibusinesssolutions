import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './auth';
import { supabase } from '@/integrations/supabase/client';

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

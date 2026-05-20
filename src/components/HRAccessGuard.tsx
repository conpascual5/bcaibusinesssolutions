import { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@/providers/auth';
import { useHRAccess } from '@/providers/hr-access';
import { Loader2 } from 'lucide-react';

export default function HRAccessGuard({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { hasHRAccess, loading: accessLoading } = useHRAccess();

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Checking access…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  // Admins always have HR access
  if (user.isAdmin) return <>{children}</>;
  if (!hasHRAccess) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

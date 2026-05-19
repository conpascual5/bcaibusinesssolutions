import { type ReactNode } from 'react';
import { Navigate } from 'react-router';
import { useAuth } from '@/providers/auth';
import { useModuleAccess, type ModuleKey } from '@/providers/module-access';

interface ModuleAccessGuardProps {
  children: ReactNode;
  module: ModuleKey;
  fallbackPath?: string;
}

export default function ModuleAccessGuard({ children, module, fallbackPath = '/app' }: ModuleAccessGuardProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { hasModuleAccess, loading: accessLoading } = useModuleAccess();

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
  if (!hasModuleAccess(module)) return <Navigate to={fallbackPath} replace />;
  return <>{children}</>;
}

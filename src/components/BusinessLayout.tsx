import { type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/providers/auth';
import { hasBusinessAccess } from '@/lib/planConfig';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, ArrowLeft, Lock } from 'lucide-react';

interface BusinessLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export default function BusinessLayout({ children, title, description }: BusinessLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  if (!hasBusinessAccess(user.plan)) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Premium Feature</h2>
            <p className="text-muted-foreground text-sm">
              The Business Management System is available on <strong>Pro</strong>, <strong>Pro+</strong>, and <strong>VIP</strong> plans.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button onClick={() => navigate('/app/my-plan')} className="w-full gap-2">
              <Crown className="w-4 h-4" />
              Upgrade Your Plan
            </Button>
            <Button variant="outline" onClick={() => navigate('/app')} className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

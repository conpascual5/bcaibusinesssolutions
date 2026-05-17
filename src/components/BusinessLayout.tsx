import { type ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/providers/auth';
import { hasBusinessAccess } from '@/lib/planConfig';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Crown, ArrowLeft, Lock, Grid3X3, Building2, ShoppingCart, ClipboardList, DollarSign, Receipt, Calculator, Wallet, Users, FileText, FileSearch, Target, Database } from 'lucide-react';

interface BusinessLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const trackerItems = [
  { icon: Building2, label: 'Dashboard', path: '/app/business' },
  { icon: ShoppingCart, label: 'Products', path: '/app/business/products' },
  { icon: ClipboardList, label: 'Inventory', path: '/app/business/inventory' },
  { icon: DollarSign, label: 'Sales Tracker', path: '/app/business/sales' },
  { icon: Receipt, label: 'Expenses', path: '/app/business/expenses' },
  { icon: Calculator, label: 'Pricing', path: '/app/business/pricing' },
  { icon: Wallet, label: 'Finance', path: '/app/business/finance' },
  { icon: Users, label: 'Customers', path: '/app/business/customers' },
  { icon: FileText, label: 'Invoices', path: '/app/business/invoices' },
  { icon: FileSearch, label: 'Receipts', path: '/app/business/receipts' },
  { icon: Target, label: 'Targets', path: '/app/business/targets' },
  { icon: Database, label: 'Records', path: '/app/business/records' },
];

export default function BusinessLayout({ children, title, description }: BusinessLayoutProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

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
      {/* Header with off-canvas trigger */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="shrink-0 gap-2">
              <Grid3X3 className="w-4 h-4" />
              <span className="hidden sm:inline">All Trackers</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <SheetHeader className="mb-6">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-indigo-500" />
                Business Trackers
              </SheetTitle>
            </SheetHeader>
            <nav className="space-y-1">
              {trackerItems.map((item) => {
                const isActive = item.path === '/app/business'
                  ? location.pathname === '/app/business' || location.pathname === '/app/business/dashboard'
                  : location.pathname.startsWith(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSheetOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${
                      isActive
                        ? 'bg-indigo-100 dark:bg-indigo-800/40 text-indigo-600 dark:text-indigo-300'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    )}
                  </button>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {children}
    </div>
  );
}

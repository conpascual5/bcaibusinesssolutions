import { type ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/providers/auth';
import { useBusinessTeam } from '@/providers/business-team';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Crown, ArrowLeft, Lock, Grid3X3, Building2, ShoppingCart, ClipboardList, DollarSign, Receipt, Calculator, Wallet, Users, FileText, FileSearch, Target, Database, Loader2, UserPlus, Eye, Clock, Umbrella, BarChart3, BookOpen, Smartphone, Briefcase, GitBranch, MapPin, Layers, BadgeCheck, TrendingUp, Calculator, Gift, RefreshCw } from 'lucide-react';

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
  { icon: UserPlus, label: 'Team', path: '/app/business/team' },
  // ─── HR Section ──────────────────────────────────────────────
  { icon: BarChart3, label: 'HR Dashboard', path: '/app/business/hr' },
  { icon: Users, label: 'Employees', path: '/app/business/hr/employees' },
  { icon: GitBranch, label: 'Org Chart', path: '/app/business/hr/org-chart' },
  { icon: Building2, label: 'Company', path: '/app/business/hr/company' },
  { icon: MapPin, label: 'Offices', path: '/app/business/hr/offices' },
  { icon: Layers, label: 'Departments', path: '/app/business/hr/departments' },
  { icon: BadgeCheck, label: 'Designations', path: '/app/business/hr/designations' },
  { icon: Clock, label: 'Attendance', path: '/app/business/hr/attendance' },
  { icon: RefreshCw, label: 'Corrections', path: '/app/business/hr/corrections' },
  { icon: Umbrella, label: 'Leave Mgmt', path: '/app/business/hr/leave' },
  { icon: Calendar, label: 'Shift Roster', path: '/app/business/hr/shifts' },
  { icon: TrendingUp, label: 'Performances', path: '/app/business/hr/performances' },
  { icon: Calculator, label: 'Payroll Engine', path: '/app/business/hr/payroll' },
  { icon: Gift, label: 'Bonuses', path: '/app/business/hr/bonuses' },
  { icon: BookOpen, label: 'Help & Guide', path: '/app/business/help' },
];

export default function BusinessLayout({ children, title, description }: BusinessLayoutProps) {
  const { user } = useAuth();
  const { isTeamMember, ownerProfile } = useBusinessTeam();
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.isAdmin) {
      console.log("[BusinessLayout] user is admin, granting access");
      setHasAccess(true);
      return;
    }
    (async () => {
      // Check if user has direct BMS access OR is a team member of someone
      const [accessRes, teamRes] = await Promise.all([
        supabase.from('user_business_access').select('id').eq('user_id', user.id).maybeSingle(),
        supabase.from('business_team_members').select('id').eq('member_id', user.id).maybeSingle(),
      ]);
      console.log("[BusinessLayout] access check", {
        userId: user.id,
        directAccess: !!accessRes.data,
        teamAccess: !!teamRes.data,
        teamData: teamRes.data,
      });
      setHasAccess(!!accessRes.data || !!teamRes.data);
    })();
  }, [user]);

  if (!user) return null;

  if (hasAccess === null) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Access Required</h2>
            <p className="text-muted-foreground text-sm">
              You don't have access to the Business Management System yet. Contact the admin to request access.
            </p>
          </div>
          <div className="flex flex-col gap-3">
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
      {/* Team member banner */}
      {isTeamMember && ownerProfile && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 text-sm">
          <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-amber-800 dark:text-amber-300">
            You're viewing <strong>{ownerProfile.full_name || ownerProfile.email}</strong>'s business data as a team member.
          </p>
        </div>
      )}

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
          <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
            <SheetHeader className="px-6 pt-6 pb-0 mb-4">
              <SheetTitle className="flex items-center gap-2 text-lg">
                <Building2 className="w-5 h-5 text-indigo-500" />
                Business Trackers
              </SheetTitle>
            </SheetHeader>
            <nav className="space-y-1 px-6 pb-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
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

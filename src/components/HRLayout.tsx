import { type ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import AICommandBar from './AICommandBar';
import {
  BarChart3, Users, GitBranch, Building2, MapPin, Layers, BadgeCheck,
  Clock, RefreshCw, Umbrella, Calendar, TrendingUp, Calculator, Gift,
  Grid3X3, ArrowLeft, Sparkles
} from 'lucide-react';

interface HRLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const hrModules = [
  { icon: BarChart3, label: 'HR Dashboard', path: '/app/hr' },
  { icon: Users, label: 'Employees', path: '/app/hr/employees' },
  { icon: GitBranch, label: 'Org Chart', path: '/app/hr/org-chart' },
  { icon: Building2, label: 'Company', path: '/app/hr/company' },
  { icon: MapPin, label: 'Offices', path: '/app/hr/offices' },
  { icon: Layers, label: 'Departments', path: '/app/hr/departments' },
  { icon: BadgeCheck, label: 'Designations', path: '/app/hr/designations' },
  { icon: Clock, label: 'Attendance', path: '/app/hr/attendance' },
  { icon: RefreshCw, label: 'Corrections', path: '/app/hr/corrections' },
  { icon: Umbrella, label: 'Leave Mgmt', path: '/app/hr/leave' },
  { icon: Calendar, label: 'Shift Roster', path: '/app/hr/shifts' },
  { icon: TrendingUp, label: 'Performances', path: '/app/hr/performances' },
  { icon: Calculator, label: 'Payroll Engine', path: '/app/hr/payroll' },
  { icon: Gift, label: 'Bonuses', path: '/app/hr/bonuses' },
];

export default function HRLayout({ children, title, description }: HRLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/app/hr') {
      return location.pathname === '/app/hr' || location.pathname === '/app/hr/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <h1 className="text-base font-bold">{title}</h1>
            </div>
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">{description}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0 gap-2">
                  <Grid3X3 className="w-4 h-4" />
                  <span className="hidden sm:inline">All Modules</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                <SheetHeader className="px-6 pt-6 pb-0 mb-4">
                  <SheetTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    HR Management
                  </SheetTitle>
                </SheetHeader>
                <nav className="space-y-1 px-6 pb-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                  {hrModules.map((item) => {
                    const active = isActive(item.path);
                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setSheetOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                          active
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${
                          active
                            ? 'bg-indigo-100 dark:bg-indigo-800/40 text-indigo-600 dark:text-indigo-300'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span>{item.label}</span>
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />
                        )}
                      </button>
                    );
                  })}
                </nav>
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/app')}
              className="text-xs gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to App
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6 max-w-7xl mx-auto">
        {children}
      </main>

      <AICommandBar context="hr" />
    </div>
  );
}

import { type ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import AICommandBar from './AICommandBar';
import {
  Wand2, BarChart3, Target, Image, Search, FileText,
  Package, BookOpen, Grid3X3, ArrowLeft, Sparkles
} from 'lucide-react';

interface ModuleLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
}

const modules = [
  { icon: Wand2, label: 'Sales Wizard', path: '/app/modules/sales-wizard' },
  { icon: BarChart3, label: 'Sales Report', path: '/app/modules/sales-report' },
  { icon: Target, label: 'FB Ads Targeting', path: '/app/modules/fb-ads-targeting' },
  { icon: Image, label: 'Image Analyzer', path: '/app/modules/image-analyzer' },
  { icon: Search, label: 'Ad Analyzer', path: '/app/modules/ad-analyzer' },
  { icon: FileText, label: 'Invoices', path: '/app/modules/invoices' },
  { icon: Package, label: 'My Assets', path: '/app/modules/my-assets' },
  { icon: BookOpen, label: 'Library', path: '/app/modules/library' },
];

export default function ModuleLayout({ children, title, description }: ModuleLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
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
                    <Sparkles className="w-5 h-5 text-violet-500" />
                    App Modules
                  </SheetTitle>
                </SheetHeader>
                <nav className="space-y-1 px-6 pb-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                  {modules.map((item) => {
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
                            ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 shadow-sm'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${
                          active
                            ? 'bg-violet-100 dark:bg-violet-800/40 text-violet-600 dark:text-violet-300'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          <item.icon className="w-4 h-4" />
                        </div>
                        <span>{item.label}</span>
                        {active && (
                          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />
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

      <AICommandBar context="modules" />
    </div>
  );
}

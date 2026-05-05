import { type ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '@/providers/auth';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { Switch } from '@/components/ui/switch';
import {
  Crosshair,
  Sparkles,
  User,
  LogOut,
  Shield,
  Library,
  FileText,
  FileSearch,
  LayoutDashboard,
  Menu,
  Wand2,
  Moon,
  Sun,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
  { icon: Wand2, label: 'Sales Wizard', path: '/app/sales-wizard' },
  { icon: Crosshair, label: 'Captions and Video Script', path: '/app/targeting' },
  { icon: FileSearch, label: 'Ad Analyzer', path: '/app/competitor-analysis' },
  { icon: FileText, label: 'Invoices', path: '/app/invoices' },
  { icon: Library, label: 'Library', path: '/library' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3 px-1">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
                <Sparkles className="w-[18px] h-[18px] text-white" />
              </div>
              <span className="font-semibold text-[15px] tracking-tight text-sidebar-foreground truncate group-data-[collapsible=icon]:hidden">
                BC AI
              </span>
            </div>
          </SidebarHeader>

          <SidebarSeparator className="mx-4 w-auto opacity-30" />

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => navigate(item.path)}
                          tooltip={item.label}
                          className="cursor-pointer gap-3 px-3 py-2.5 text-sm font-medium"
                        >
                          <item.icon className="w-[18px] h-[18px] stroke-[1.5]" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarSeparator className="mx-4 w-auto opacity-30" />

          <SidebarFooter className="p-4 space-y-1">
            {/* Dark mode toggle */}
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg group-data-[collapsible=icon]:hidden">
              {darkMode ? (
                <Moon className="w-[18px] h-[18px] stroke-[1.5] text-sidebar-foreground/60" />
              ) : (
                <Sun className="w-[18px] h-[18px] stroke-[1.5] text-sidebar-foreground/60" />
              )}
              <span className="text-sm text-sidebar-foreground/60 flex-1">Dark Mode</span>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
                className="data-[state=checked]:bg-indigo-500"
              />
            </div>

            <SidebarMenu>
              {user?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === '/admin'}
                    onClick={() => navigate('/admin')}
                    tooltip="Admin Panel"
                    className="cursor-pointer gap-3 px-3 py-2.5 text-sm font-medium"
                  >
                    <Shield className="w-[18px] h-[18px] stroke-[1.5]" />
                    <span>Admin Panel</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={logout}
                  tooltip="Log Out"
                  className="cursor-pointer gap-3 px-3 py-2.5 text-sm font-medium text-red-400 hover:text-red-300"
                >
                  <LogOut className="w-[18px] h-[18px] stroke-[1.5]" />
                  <span>Log Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border">
            <div className="flex items-center justify-between px-6 h-16">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <span className="hidden sm:inline font-medium">{user?.name}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

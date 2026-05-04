import { type ReactNode } from 'react';
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
import {
  Crosshair,
  Sparkles,
  User,
  LogOut,
  Shield,
  Library,
  ImageIcon,
  FileText,
  FileSearch,
  LayoutDashboard,
  Menu,
} from 'lucide-react';

interface AppLayoutProps {
  children: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/app' },
  { icon: Crosshair, label: 'Targeting Generator', path: '/app/targeting' },
  { icon: ImageIcon, label: 'Caption Generator', path: '/captions' },
  { icon: FileSearch, label: 'Ad Copy Analyzer', path: '/app/competitor-analysis' },
  { icon: FileText, label: 'Invoice Generator', path: '/app/invoices' },
  { icon: Library, label: 'Library', path: '/library' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="p-3">
            <div className="flex items-center gap-2 px-1">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-sm truncate group-data-[collapsible=icon]:hidden">
                BC AI
              </span>
            </div>
          </SidebarHeader>

          <SidebarSeparator />

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
                          className="cursor-pointer"
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarSeparator />

          <SidebarFooter className="p-3">
            <SidebarMenu>
              {user?.isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={location.pathname === '/admin'}
                    onClick={() => navigate('/admin')}
                    tooltip="Admin Panel"
                    className="cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={logout}
                  tooltip="Log Out"
                  className="cursor-pointer text-red-500 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-gray-500 hover:text-gray-900">
                  <Menu className="w-5 h-5" />
                </SidebarTrigger>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user?.name}</span>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

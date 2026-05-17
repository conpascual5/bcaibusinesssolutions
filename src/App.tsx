import { Routes, Route, Navigate, useLocation } from 'react-router'
import { useEffect } from 'react'
import { useAuth } from '@/providers/auth'
import { trackPageView } from './lib/metaPixel'
import Landing from './pages/Landing'
import Tutorial from './pages/Tutorial'
import About from './pages/About'
import Auth from './pages/Auth'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Dashboard from './pages/Dashboard'

import CaptionGenerator from './pages/CaptionGenerator'
import Library from './pages/Library'
import Admin from './pages/Admin'
import Setup from './pages/Setup'
import Upload from './pages/Upload'
import CompetitorAnalysis from './pages/CompetitorAnalysis'
import Invoices from './pages/Invoices'
import SalesWizard from './pages/SalesWizard'
import FBAdsTargeting from './pages/FBAdsTargeting'
import MyPlan from './pages/MyPlan'
import MyAssets from './pages/MyAssets'
import SalesReport from './pages/SalesReport'
import AppLayout from './components/AppLayout'
import SupportChatWidget from './components/SupportChatWidget'
import PageTransition from './components/PageTransition'

// Business Management System pages
import BusinessDashboard from './pages/BusinessDashboard'
import BusinessProducts from './pages/BusinessProducts'
import BusinessInventory from './pages/BusinessInventory'
import BusinessSales from './pages/BusinessSales'
import BusinessExpenses from './pages/BusinessExpenses'
import BusinessPricing from './pages/BusinessPricing'
import BusinessFinance from './pages/BusinessFinance'
import BusinessCustomers from './pages/BusinessCustomers'
import BusinessInvoices from './pages/BusinessInvoices'
import BusinessReceipts from './pages/BusinessReceipts'
import BusinessTargets from './pages/BusinessTargets'
import BusinessRecords from './pages/BusinessRecords'
import BusinessTeam from './pages/BusinessTeam'
import BusinessEmployees from './pages/BusinessEmployees'
import BusinessAttendance from './pages/BusinessAttendance'
import BusinessLeave from './pages/BusinessLeave'
import BusinessHRDashboard from './pages/BusinessHRDashboard'
import BusinessHelp from './pages/BusinessHelp'
import { BusinessTeamProvider } from '@/providers/business-team'
import AppShop from './pages/AppShop'
import Shop from './pages/Shop'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!user?.isAdmin) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppLayoutRoute({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      <PageTransition>
        {children}
      </PageTransition>
    </AppLayout>
  );
}

export default function App() {
  const location = useLocation();

  useEffect(() => {
    trackPageView();
  }, [location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/about" element={<About />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/app" element={<ProtectedRoute><AppLayoutRoute><Dashboard /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/sales-report" element={<ProtectedRoute><AppLayoutRoute><SalesReport /></AppLayoutRoute></ProtectedRoute>} />

        {/* Business Management System */}
        <Route path="/app/business" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessDashboard /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/dashboard" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessDashboard /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/products" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessProducts /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/inventory" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessInventory /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/sales" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessSales /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/expenses" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessExpenses /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/pricing" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessPricing /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/finance" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessFinance /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/customers" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessCustomers /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/invoices" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessInvoices /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/receipts" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessReceipts /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/targets" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessTargets /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/records" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessRecords /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/team" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessTeam /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessHRDashboard /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/employees" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessEmployees /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/attendance" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessAttendance /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/leave" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessLeave /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/help" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessHelp /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />

        <Route path="/app/sales-wizard" element={<ProtectedRoute><AppLayoutRoute><SalesWizard /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/competitor-analysis" element={<ProtectedRoute><AppLayoutRoute><CompetitorAnalysis /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/invoices" element={<ProtectedRoute><AppLayoutRoute><Invoices /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/fb-ads-targeting" element={<ProtectedRoute><AppLayoutRoute><FBAdsTargeting /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/image-ad-analyzer" element={<ProtectedRoute><AppLayoutRoute><CaptionGenerator /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/my-plan" element={<ProtectedRoute><AppLayoutRoute><MyPlan /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/my-assets" element={<ProtectedRoute><AppLayoutRoute><MyAssets /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/shop" element={<ProtectedRoute><AppLayoutRoute><AppShop /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><AppLayoutRoute><Library /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AppLayoutRoute><Admin /></AppLayoutRoute></AdminRoute>} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
      </Routes>
      <SupportChatWidget />
    </>
  )
}

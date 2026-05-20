import { Routes, Route, Navigate } from 'react-router'
import { useAuth } from '@/providers/auth'
import Landing from './pages/Landing'
import Tutorial from './pages/Tutorial'
import KnowledgeBase from './pages/KnowledgeBase'
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
import Billing from './pages/Billing'
import SalesWizard from './pages/SalesWizard'
import FBAdsTargeting from './pages/FBAdsTargeting'
import MyPlan from './pages/MyPlan'
import MyAssets from './pages/MyAssets'
import Affiliate from './pages/Affiliate'
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
import BusinessCompany from './pages/BusinessCompany'
import BusinessOffices from './pages/BusinessOffices'
import BusinessDepartments from './pages/BusinessDepartments'
import BusinessDesignations from './pages/BusinessDesignations'
import BusinessOrgChart from './pages/BusinessOrgChart'
import BusinessCorrections from './pages/BusinessCorrections'
import BusinessShiftRoster from './pages/BusinessShiftRoster'
import BusinessPerformances from './pages/BusinessPerformances'
import BusinessPayroll from './pages/BusinessPayroll'
import BusinessBonuses from './pages/BusinessBonuses'
import BusinessGCash from './pages/BusinessGCash'
import BusinessHelp from './pages/BusinessHelp'
import EmployeeAuth from './pages/EmployeeAuth'
import EmployeePortal from './pages/EmployeePortal'
import { BusinessTeamProvider } from '@/providers/business-team'
import { HRAccessProvider } from '@/providers/hr-access'
import HRAccessGuard from '@/components/HRAccessGuard'
import { ModuleAccessProvider } from '@/providers/module-access'
import ModuleAccessGuard from '@/components/ModuleAccessGuard'
import StandaloneHRDashboard from './pages/StandaloneHRDashboard'
import StandaloneSalesWizard from './pages/StandaloneSalesWizard'
import StandaloneSalesReport from './pages/StandaloneSalesReport'
import StandaloneFBAdsTargeting from './pages/StandaloneFBAdsTargeting'
import StandaloneImageAnalyzer from './pages/StandaloneImageAnalyzer'
import StandaloneAdAnalyzer from './pages/StandaloneAdAnalyzer'
import StandaloneInvoices from './pages/StandaloneInvoices'
import StandaloneMyAssets from './pages/StandaloneMyAssets'
import StandaloneLibrary from './pages/StandaloneLibrary'
import AppShop from './pages/AppShop'
import Shop from './pages/Shop'
import Settings from './pages/Settings'

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
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/tutorial" element={<Tutorial />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
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
        <Route path="/app/business/hr/org-chart" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessOrgChart /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/company" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessCompany /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/offices" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessOffices /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/departments" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessDepartments /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/designations" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessDesignations /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/attendance" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessAttendance /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/corrections" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessCorrections /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/leave" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessLeave /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/shifts" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessShiftRoster /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/performances" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessPerformances /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/payroll" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessPayroll /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/hr/bonuses" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessBonuses /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/business/help" element={<ProtectedRoute><AppLayoutRoute><BusinessTeamProvider><BusinessHelp /></BusinessTeamProvider></AppLayoutRoute></ProtectedRoute>} />

        {/* Standalone HR Service (assignable to any user) */}
        <Route path="/app/hr" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/dashboard" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/employees" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/org-chart" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/company" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/offices" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/departments" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/designations" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/attendance" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/corrections" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/leave" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/shifts" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/performances" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/payroll" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />
        <Route path="/app/hr/bonuses" element={<ProtectedRoute><HRAccessProvider><HRAccessGuard><StandaloneHRDashboard /></HRAccessGuard></HRAccessProvider></ProtectedRoute>} />

        {/* Standalone App Modules (assignable to any user) */}
        <Route path="/app/modules" element={<ProtectedRoute><ModuleAccessProvider><StandaloneSalesWizard /></ModuleAccessProvider></ProtectedRoute>} />
        <Route path="/app/modules/sales-wizard" element={<ProtectedRoute><ModuleAccessProvider><ModuleAccessGuard module="sales_wizard"><StandaloneSalesWizard /></ModuleAccessGuard></ModuleAccessProvider></ProtectedRoute>} />
        <Route path="/app/modules/sales-report" element={<ProtectedRoute><ModuleAccessProvider><ModuleAccessGuard module="sales_report"><StandaloneSalesReport /></ModuleAccessGuard></ModuleAccessProvider></ProtectedRoute>} />
        <Route path="/app/modules/fb-ads-targeting" element={<ProtectedRoute><ModuleAccessProvider><ModuleAccessGuard module="fb_ads_targeting"><StandaloneFBAdsTargeting /></ModuleAccessGuard></ModuleAccessProvider></ProtectedRoute>} />
        <Route path="/app/modules/image-analyzer" element={<ProtectedRoute><ModuleAccessProvider><ModuleAccessGuard module="image_analyzer"><StandaloneImageAnalyzer /></ModuleAccessGuard></ModuleAccessProvider></ProtectedRoute>} />
        <Route path="/app/modules/ad-analyzer" element={<ProtectedRoute><ModuleAccessProvider><ModuleAccessGuard module="ad_analyzer"><StandaloneAdAnalyzer /></ModuleAccessGuard></ModuleAccessProvider></ProtectedRoute>} />
        <Route path="/app/modules/invoices" element={<ProtectedRoute><ModuleAccessProvider><ModuleAccessGuard module="invoices"><StandaloneInvoices /></ModuleAccessGuard></ModuleAccessProvider></ProtectedRoute>} />
        <Route path="/app/modules/my-assets" element={<ProtectedRoute><ModuleAccessProvider><ModuleAccessGuard module="my_assets"><StandaloneMyAssets /></ModuleAccessGuard></ModuleAccessProvider></ProtectedRoute>} />
        <Route path="/app/modules/library" element={<ProtectedRoute><ModuleAccessProvider><ModuleAccessGuard module="library"><StandaloneLibrary /></ModuleAccessGuard></ModuleAccessProvider></ProtectedRoute>} />

        <Route path="/app/sales-wizard" element={<ProtectedRoute><AppLayoutRoute><SalesWizard /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/competitor-analysis" element={<ProtectedRoute><AppLayoutRoute><CompetitorAnalysis /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/invoices" element={<ProtectedRoute><AppLayoutRoute><Invoices /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/billing" element={<ProtectedRoute><AppLayoutRoute><Billing /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/fb-ads-targeting" element={<ProtectedRoute><AppLayoutRoute><FBAdsTargeting /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/image-ad-analyzer" element={<ProtectedRoute><AppLayoutRoute><CaptionGenerator /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/my-plan" element={<ProtectedRoute><AppLayoutRoute><MyPlan /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/my-assets" element={<ProtectedRoute><AppLayoutRoute><MyAssets /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/affiliate" element={<ProtectedRoute><AppLayoutRoute><Affiliate /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/gcash" element={<ProtectedRoute><AppLayoutRoute><BusinessGCash /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/shop" element={<ProtectedRoute><AppLayoutRoute><AppShop /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/settings" element={<ProtectedRoute><AppLayoutRoute><Settings /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><AppLayoutRoute><Library /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AppLayoutRoute><Admin /></AppLayoutRoute></AdminRoute>} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/upload" element={<ProtectedRoute><Upload /></ProtectedRoute>} />
        <Route path="/employee/auth" element={<EmployeeAuth />} />
        <Route path="/employee/portal" element={<EmployeePortal />} />
      </Routes>
      <SupportChatWidget />
    </>
  )
}

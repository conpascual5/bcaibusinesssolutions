import { Routes, Route, Navigate } from 'react-router'
import { useAuth } from '@/providers/auth'
import Landing from './pages/Landing'
import About from './pages/About'
import Auth from './pages/Auth'
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
import SalesReport from './pages/SalesReport'
import AppLayout from './components/AppLayout'
import SupportChatWidget from './components/SupportChatWidget'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
    </div>
  );
  if (!user?.isAdmin) return <Navigate to="/app" replace />;
  return <>{children}</>;
}

function AppLayoutRoute({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      {children}
    </AppLayout>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/app" element={<ProtectedRoute><AppLayoutRoute><Dashboard /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/sales-report" element={<ProtectedRoute><AppLayoutRoute><SalesReport /></AppLayoutRoute></ProtectedRoute>} />

        <Route path="/app/sales-wizard" element={<ProtectedRoute><AppLayoutRoute><SalesWizard /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/competitor-analysis" element={<ProtectedRoute><AppLayoutRoute><CompetitorAnalysis /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/invoices" element={<ProtectedRoute><AppLayoutRoute><Invoices /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/fb-ads-targeting" element={<ProtectedRoute><AppLayoutRoute><FBAdsTargeting /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/image-ad-analyzer" element={<ProtectedRoute><AppLayoutRoute><CaptionGenerator /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/app/my-plan" element={<ProtectedRoute><AppLayoutRoute><MyPlan /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><AppLayoutRoute><Library /></AppLayoutRoute></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AppLayoutRoute><Admin /></AppLayoutRoute></AdminRoute>} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/upload" element={<Upload />} />
      </Routes>
      <SupportChatWidget />
    </>
  )
}

import { Routes, Route, Navigate } from 'react-router'
import { useAuth } from '@/providers/auth'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Home from './pages/Home'
import CaptionGenerator from './pages/CaptionGenerator'
import Library from './pages/Library'
import Admin from './pages/Admin'
import ChatWidget from './components/ChatWidget'

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

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/app" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/captions" element={<ProtectedRoute><CaptionGenerator /></ProtectedRoute>} />
        <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Routes>
      <ChatWidget />
    </>
  )
}

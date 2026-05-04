import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/providers/auth';
import { trpc } from '@/providers/trpc';
import {
  Crosshair,
  Sparkles,
  Target,
  BarChart3,
  MessageSquare,
  Film,
  Layers,
  User,
  ArrowRight,
  Clock,
  TrendingUp,
  FileSearch,
  FileText,
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: searches } = trpc.search.list.useQuery();

  const stats = [
    { icon: Target, label: 'Analyses Done', value: searches?.length || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: MessageSquare, label: 'Captions Generated', value: '∞', color: 'text-green-600', bg: 'bg-green-50' },
    { icon: Film, label: 'Video Scripts', value: '∞', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: TrendingUp, label: 'Tools Available', value: '5', color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const quickActions = [
    {
      icon: Crosshair,
      title: 'Targeting Generator',
      desc: 'Generate buyer personas, keywords, and ad strategies',
      path: '/app/targeting',
      color: 'from-blue-500 to-cyan-400',
    },
    {
      icon: FileSearch,
      title: 'Ad Copy Analyzer',
      desc: 'Analyze competitor ads and get counter-positioning ideas',
      path: '/app/competitor-analysis',
      color: 'from-purple-500 to-pink-400',
    },
    {
      icon: FileText,
      title: 'Invoice Generator',
      desc: 'Create and download professional invoices',
      path: '/app/invoices',
      color: 'from-emerald-500 to-teal-400',
    },
    {
      icon: MessageSquare,
      title: 'Caption Generator',
      desc: 'Generate ad captions for your images',
      path: '/captions',
      color: 'from-orange-500 to-amber-400',
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Welcome back, {user?.name?.split(' ')[0] || 'there'}!
        </h1>
        <p className="text-gray-500 mt-1">Here's your marketing intelligence overview.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-blue-600" />
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={() => navigate(action.path)}
            className="group bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all text-left"
          >
            <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
              <action.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">{action.title}</h3>
            <p className="text-sm text-gray-500">{action.desc}</p>
          </button>
        ))}
      </div>

      {/* Recent Searches */}
      {searches && searches.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-500" />
            Recent Analyses
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {searches.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  onClick={() => navigate('/app/targeting')}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{s.productQuery}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(s.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

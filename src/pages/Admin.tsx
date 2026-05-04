import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';
import {
  ArrowLeft, Search, Globe, Clock, Key, Save, Check, X,
  UserCheck, UserX, Shield, Loader2, Eye, EyeOff,
  AlertTriangle, Bug, Trash2, Palette, Mail, Users,
  MessageCircle, Send, MessageSquare,
} from 'lucide-react';

export default function Admin() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [apiKeyError, setApiKeyError] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'activity' | 'chat' | 'settings'>('leads');
  const [selectedChatUser, setSelectedChatUser] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: searches, isLoading: searchesLoading } = trpc.search.list.useQuery();
  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = trpc.user.list.useQuery();
  const { data: currentKey } = trpc.settings.getApiKey.useQuery();
  const { data: hasKey } = trpc.settings.hasApiKey.useQuery();
  const { data: debugAuth } = trpc.debug.auth.useQuery();
  const { data: conversations, refetch: refetchConversations } = trpc.chat.adminConversations.useQuery();
  const { data: unreadCount } = trpc.chat.unreadCount.useQuery();
  const { data: userChatMessages, refetch: refetchUserChat } = trpc.chat.adminUserMessages.useQuery(
    { userId: selectedChatUser! },
    { enabled: !!selectedChatUser }
  );

  const replyMutation = trpc.chat.adminReply.useMutation({
    onSuccess: () => {
      setReplyText('');
      refetchUserChat();
      refetchConversations();
    },
  });
  const markReadMutation = trpc.chat.markRead.useMutation({
    onSuccess: () => refetchConversations(),
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userChatMessages]);

  useEffect(() => {
    if (selectedChatUser) {
      markReadMutation.mutate({ userId: selectedChatUser });
    }
  }, [selectedChatUser]);

  const setApiKeyMutation = trpc.settings.setApiKey.useMutation({
    onSuccess: () => {
      setApiKeySaved(true);
      setApiKeyError('');
      setTimeout(() => setApiKeySaved(false), 3000);
    },
    onError: (err) => {
      setApiKeyError(err.message || 'Failed to save API key');
      setApiKeySaved(false);
    },
  });

  const toggleUser = trpc.user.toggleActive.useMutation({
    onSuccess: () => refetchUsers(),
    onError: (err) => alert(err.message),
  });

  const handleSaveApiKey = () => {
    if (!apiKey.trim()) return;
    setApiKeyError('');
    setApiKeyMutation.mutate({ apiKey: apiKey.trim() });
  };

  useEffect(() => {
    if (debugAuth) {
      setDebugInfo(debugAuth);
    }
  }, [debugAuth]);

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-4">Admin access required.</p>
          <Link to="/app" className="text-blue-600 hover:underline">Go to App</Link>
        </div>
      </div>
    );
  }

  const totalLeads = users?.length ?? 0;
  const activeLeads = users?.filter(u => u.isActive).length ?? 0;
  const totalSearches = searches?.length ?? 0;
  const uniqueVisitors = searches ? new Set(searches.map(s => s.ipAddress).filter(Boolean)).size : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="bg-gray-900 text-white py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold">BC AI Admin Panel</span>
          </div>
          <Link to="/app" className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Back to App
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">View your leads, client activity, at manage settings.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalLeads}</p>
                <p className="text-sm text-gray-500">Total Leads</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeLeads}</p>
                <p className="text-sm text-gray-500">Active Leads</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalSearches}</p>
                <p className="text-sm text-gray-500">Total Searches</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{uniqueVisitors}</p>
                <p className="text-sm text-gray-500">Unique Visitors</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 bg-white p-1 rounded-xl shadow-sm border border-gray-100 max-w-fit flex-wrap">
          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'leads'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Mail className="w-4 h-4" />
            Leads (Emails)
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'activity'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Palette className="w-4 h-4" />
            Activity
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            Chat
            {unreadCount && unreadCount.count > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                {unreadCount.count}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Key className="w-4 h-4" />
            Settings
          </button>
        </div>

        {activeTab === 'leads' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">All Leads (Registered Users)</h2>
              </div>
              <span className="text-sm text-gray-500">{totalLeads} total</span>
            </div>

            {usersLoading ? (
              <div className="p-10 text-center text-gray-500">
                <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
                Loading leads...
              </div>
            ) : !users || users.length === 0 ? (
              <div className="p-10 text-center text-gray-500">
                <UserX className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                <p>Wala pang leads. Mag-sign up muna ang users sa landing page.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email Address (Lead)</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm text-gray-500">#{u.id}</td>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                        <td className="px-6 py-4 text-sm">
                          <a href={`mailto:${u.email}`} className="text-blue-600 hover:underline font-medium">
                            {u.email}
                          </a>
                        </td>
                        <td className="px-6 py-4">
                          {u.isAdmin ? (
                            <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-md">Admin</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-50 text-gray-500 text-xs rounded-md">User</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {u.isActive ? (
                            <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-md flex items-center gap-1 w-fit">
                              <Check className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-50 text-red-700 text-xs font-semibold rounded-md flex items-center gap-1 w-fit">
                              <X className="w-3 h-3" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString('en-PH')}
                        </td>
                        <td className="px-6 py-4">
                          {!u.isAdmin && (
                            <button
                              onClick={() => toggleUser.mutate({ userId: u.id, isActive: !u.isActive })}
                              disabled={toggleUser.isPending}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                u.isActive
                                  ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                  : 'bg-green-50 text-green-600 hover:bg-green-100'
                              }`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-bold text-gray-900">Product Search Activity</h2>
                </div>
                <span className="text-sm text-gray-500">{totalSearches} searches</span>
              </div>

              {searchesLoading ? (
                <div className="p-10 text-center text-gray-500">
                  <Clock className="w-6 h-6 mx-auto mb-2 animate-spin" />
                  Loading activity...
                </div>
              ) : !searches || searches.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  <Search className="w-8 h-8 mx-auto mb-3 text-gray-300" />
                  <p>Wala pang activity. Users need to analyze products first.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product Query</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">IP Address</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {searches.map((search) => (
                        <tr key={search.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-500">#{search.id}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {search.userId ? (
                              <span className="font-medium">User #{search.userId}</span>
                            ) : (
                              <span className="text-gray-400">Guest</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">{search.productQuery}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">{search.ipAddress ?? 'N/A'}</td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(search.createdAt).toLocaleString('en-PH', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-blue-600" />
                  Conversations
                </h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {conversations && conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <button
                      key={conv.userId}
                      onClick={() => setSelectedChatUser(conv.userId)}
                      className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors ${
                        selectedChatUser === conv.userId ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-900">{conv.userName}</p>
                        {conv.unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.userEmail}</p>
                      <p className="text-xs text-gray-600 mt-1 truncate">{conv.latestMessage}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {new Date(conv.latestAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-400 text-sm">No conversations yet</div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
              {selectedChatUser ? (
                <>
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div>
                      <p className="font-bold text-gray-900">
                        {conversations?.find(c => c.userId === selectedChatUser)?.userName || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {conversations?.find(c => c.userId === selectedChatUser)?.userEmail}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedChatUser(null)}
                      className="text-xs text-gray-500 hover:text-gray-900"
                    >
                      Close
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {userChatMessages && userChatMessages.length > 0 ? (
                      userChatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isAdmin ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                              msg.isAdmin
                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                            }`}
                          >
                            <p>{msg.message}</p>
                            <p className={`text-[10px] mt-1 ${msg.isAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                              {new Date(msg.createdAt).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-gray-400 text-sm py-10">No messages yet</div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-4 border-t border-gray-100 flex-shrink-0">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && replyText.trim()) {
                            replyMutation.mutate({ userId: selectedChatUser, message: replyText.trim() });
                          }
                        }}
                        placeholder="Type your reply..."
                        className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          if (replyText.trim()) {
                            replyMutation.mutate({ userId: selectedChatUser, message: replyText.trim() });
                          }
                        }}
                        disabled={!replyText.trim() || replyMutation.isPending}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Select a conversation to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-gray-900">Fal.ai API Key Settings</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-600 mb-4">
                  I-enter ang iyong fal.ai API key para ma-enable ang AI image generation para sa users. Makukuha ito sa <a href="https://fal.ai/dashboard/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">fal.ai dashboard</a>.
                </p>
                {apiKeyError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
                    Error: {apiKeyError}
                  </div>
                )}
                {apiKeySaved && (
                  <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    API key saved successfully!
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder={currentKey?.apiKey ? 'API key is set (enter new to update)' : 'Paste your fal.ai API key here...'}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-amber-500 transition-all pr-12"
                    />
                    <button
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <button
                    onClick={handleSaveApiKey}
                    disabled={!apiKey.trim() || setApiKeyMutation.isPending}
                    className="px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {setApiKeyMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : apiKeySaved ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {apiKeySaved ? 'Saved!' : 'Save Key'}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <Bug className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Auth Debug</h2>
              </div>
              <div className="p-6">
                {debugInfo ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs text-gray-500">Authenticated</span>
                      <p className={`font-bold ${debugInfo.authenticated ? 'text-green-600' : 'text-red-600'}`}>
                        {debugInfo.authenticated ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs text-gray-500">User ID</span>
                      <p className="font-bold text-gray-900">{debugInfo.userId ?? 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs text-gray-500">Email</span>
                      <p className="font-bold text-gray-900">{debugInfo.email ?? 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <span className="text-xs text-gray-500">Is Admin</span>
                      <p className={`font-bold ${debugInfo.isAdmin ? 'text-green-600' : 'text-red-600'}`}>
                        {debugInfo.isAdmin ? 'Yes' : 'No'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Loading auth status...</p>
                )}
                {!debugInfo?.authenticated && (
                  <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Auth context not detected. Try logging out and back in.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';
import { Sparkles, ImageIcon, Search, Trash2, Clock, AlertTriangle, Download, Type, FileText, Wand2, Copy, CheckCheck } from 'lucide-react';

export default function Library() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'images' | 'searches' | 'saved-copy'>('images');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<'image' | 'saved-copy' | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const { data: images, isLoading: imagesLoading, refetch: refetchImages } = trpc.image.list.useQuery();
  const { data: searches, isLoading: searchesLoading } = trpc.search.list.useQuery();
  const { data: savedCopy, isLoading: savedCopyLoading, refetch: refetchSavedCopy } = trpc.salesWizardSaves.list.useQuery();
  
  const deleteImageMutation = trpc.image.delete.useMutation({
    onSuccess: () => {
      refetchImages();
      setDeleteId(null);
      setDeleteType(null);
    },
  });

  const deleteSavedCopyMutation = trpc.salesWizardSaves.delete.useMutation({
    onSuccess: () => {
      refetchSavedCopy();
      setDeleteId(null);
      setDeleteType(null);
    },
  });

  const userImages = images?.filter(img => img.userId === user?.id) ?? [];
  const userSearches = searches?.filter(s => s.userId === user?.id) ?? [];
  const userSavedCopy = savedCopy ?? [];

  const handleCopy = async (text: string, id: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: number, type: 'image' | 'saved-copy') => {
    setDeleteId(id);
    setDeleteType(type);
  };

  const confirmDelete = () => {
    if (deleteId === null || !deleteType) return;
    if (deleteType === 'image') {
      deleteImageMutation.mutate({ imageId: deleteId });
    } else {
      deleteSavedCopyMutation.mutate({ id: deleteId });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Library</h1>
          <p className="text-gray-600">
            All your generated images, searches, and saved sales copy in one place.
          </p>
        </div>

        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">30-Day Storage Policy</p>
            <p className="text-sm text-amber-700 mt-1">
              Generated images and search history are kept for <strong>30 days only</strong> and are automatically deleted after that period. 
              Please download any images you want to keep before they expire. Saved copy is kept indefinitely.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'images'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Images ({userImages.length})
          </button>
          <button
            onClick={() => setActiveTab('searches')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'searches'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Search className="w-4 h-4" />
            Searches ({userSearches.length})
          </button>
          <button
            onClick={() => setActiveTab('saved-copy')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'saved-copy'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FileText className="w-4 h-4" />
            Saved Copy ({userSavedCopy.length})
          </button>
        </div>

        {activeTab === 'images' && (
          <div>
            {imagesLoading ? (
              <div className="text-center py-20 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-3 animate-spin" />
                Loading images...
              </div>
            ) : userImages.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No generated images yet.</p>
                <button
                  onClick={() => navigate('/generate')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Generate Images Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {userImages.map((img) => (
                  <div key={img.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group">
                    <div className="relative aspect-square bg-gray-100">
                      {img.url ? (
                        <img
                          src={img.url}
                          alt={img.prompt}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400?text=Image+Unavailable'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 truncate">{img.prompt}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(img.createdAt).toLocaleDateString('en-PH', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        {img.url && (
                          <a
                            href={img.url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold text-center hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            Download
                          </a>
                        )}
                        <button
                          onClick={() => handleDelete(img.id, 'image')}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'searches' && (
          <div>
            {searchesLoading ? (
              <div className="text-center py-20 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-3 animate-spin" />
                Loading searches...
              </div>
            ) : userSearches.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No searches yet.</p>
                <button
                  onClick={() => navigate('/app')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  Start Analyzing
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {userSearches.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{s.productQuery}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(s.createdAt).toLocaleString('en-PH', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved-copy' && (
          <div>
            {savedCopyLoading ? (
              <div className="text-center py-20 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-3 animate-spin" />
                Loading saved copy...
              </div>
            ) : userSavedCopy.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <Wand2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No saved sales copy yet.</p>
                <button
                  onClick={() => navigate('/app/sales-wizard')}
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-sm font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg shadow-indigo-600/20"
                >
                  Open Sales Wizard
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userSavedCopy.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                    <div className="p-5 border-b border-gray-50">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-gray-900 truncate">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
                              <FileText className="w-3 h-3" />
                              {item.contentType === 'caption' ? 'Caption' : item.contentType === 'blog' ? 'Blog Post' : 'FB Post'}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                              <Wand2 className="w-3 h-3" />
                              {item.frameworkName}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(item.createdAt).toLocaleDateString('en-PH', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleCopy(item.output, item.id)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Copy to clipboard"
                          >
                            {copiedId === item.id ? (
                              <CheckCheck className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, 'saved-copy')}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-4 max-h-48 overflow-y-auto">
                      <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed line-clamp-6">
                        {item.output}
                      </p>
                    </div>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-500">
                      <span><strong>Product:</strong> {item.productName}</span>
                      <span><strong>Audience:</strong> {item.targetAudience.length > 40 ? item.targetAudience.slice(0, 40) + '...' : item.targetAudience}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {deleteId !== null && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {deleteType === 'image' ? 'Delete Image?' : 'Delete Saved Copy?'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { setDeleteId(null); setDeleteType(null); }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

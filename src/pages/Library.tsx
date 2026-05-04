import { useState } from 'react';
import { useNavigate } from 'react-router';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';
import { Sparkles, ImageIcon, Search, Trash2, Clock, AlertTriangle, Download, Type } from 'lucide-react';

export default function Library() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'images' | 'searches'>('images');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: images, isLoading: imagesLoading, refetch: refetchImages } = trpc.image.list.useQuery();
  const { data: searches, isLoading: searchesLoading } = trpc.search.list.useQuery();
  const deleteMutation = trpc.image.delete.useMutation({
    onSuccess: () => {
      refetchImages();
      setDeleteId(null);
    },
  });

  const userImages = images?.filter(img => img.userId === user?.id) ?? [];
  const userSearches = searches?.filter(s => s.userId === user?.id) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Library</h1>
          <p className="text-gray-600">
            Lahat ng iyong generated images at searches. Items older than 30 days are automatically deleted to save storage.
          </p>
        </div>

        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">30-Day Storage Policy</p>
            <p className="text-sm text-amber-700 mt-1">
              Generated images and search history are kept for <strong>30 days only</strong> and are automatically deleted after that period. 
              Please download any images you want to keep before they expire.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-fit mb-6">
          <button
            onClick={() => setActiveTab('images')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'images'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            My Images ({userImages.length})
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
            My Searches ({userSearches.length})
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
                <p className="text-gray-500">Wala pang generated images.</p>
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
                          onClick={() => setDeleteId(img.id)}
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
                <p className="text-gray-500">Wala pang searches.</p>
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

        {deleteId !== null && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Image?</h3>
              <p className="text-sm text-gray-600 mb-4">This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteMutation.mutate({ imageId: deleteId })}
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

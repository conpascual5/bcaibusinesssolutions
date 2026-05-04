import { useState } from 'react';
import { useNavigate } from 'react-router';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';
import { ArrowLeft, Sparkles, ImageIcon, Download, Trash2, Loader2, AlertTriangle } from 'lucide-react';

const IMAGE_SIZES = [
  { value: 'square_hd', label: 'Square HD (1024x1024)' },
  { value: 'square', label: 'Square (512x512)' },
  { value: 'portrait_4_3', label: 'Portrait 4:3' },
  { value: 'portrait_16_9', label: 'Portrait 16:9' },
  { value: 'landscape_4_3', label: 'Landscape 4:3' },
  { value: 'landscape_16_9', label: 'Landscape 16:9' },
] as const;

const STYLES = [
  { value: 'auto', label: 'Auto' },
  { value: 'cinematic', label: 'Cinematic' },
  { value: 'digital-art', label: 'Digital Art' },
  { value: 'photographic', label: 'Photographic' },
  { value: 'anime', label: 'Anime' },
  { value: 'fantasy-art', label: 'Fantasy Art' },
  { value: 'comic-book', label: 'Comic Book' },
  { value: 'low-poly', label: 'Low Poly' },
  { value: 'line-art', label: 'Line Art' },
  { value: 'pixel-art', label: 'Pixel Art' },
  { value: '3d-model', label: '3D Model' },
  { value: 'watercolor', label: 'Watercolor' },
  { value: 'isometric', label: 'Isometric' },
  { value: 'craft-clay', label: 'Craft Clay' },
  { value: 'origami', label: 'Origami' },
  { value: 'modeling-compound', label: 'Modeling Compound' },
] as const;

export default function Generate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [imageSize, setImageSize] = useState<'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9'>('square_hd');
  const [imageCount, setImageCount] = useState(1);
  const [style, setStyle] = useState<'auto' | 'cinematic' | 'digital-art' | 'photographic' | 'anime' | 'fantasy-art' | 'comic-book' | 'low-poly' | 'line-art' | 'pixel-art' | '3d-model' | 'watercolor' | 'isometric' | 'craft-clay' | 'origami' | 'modeling-compound'>('auto');
  const [error, setError] = useState('');

  const generateMutation = trpc.image.generate.useMutation();
  const { data: myImages, refetch: refetchImages } = trpc.image.list.useQuery();
  const deleteMutation = trpc.image.delete.useMutation({
    onSuccess: () => refetchImages(),
  });

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setError('');
    generateMutation.mutate(
      { prompt: prompt.trim(), imageSize, numImages: imageCount, style },
      {
        onSuccess: (result) => {
          refetchImages();
        },
        onError: (err) => {
          setError(err.message);
        },
      }
    );
  };

  const userImages = myImages?.filter(img => img.userId === user?.id) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="bg-gray-900 text-white py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold">BC AI Business Solutions</span>
          </div>
          <button onClick={() => navigate('/app')} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" />
            Back to App
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Image Generator</h1>
          <p className="text-gray-600">Generate stunning product images and marketing visuals using AI.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to generate..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Image Size</label>
                <select
                  value={imageSize}
                  onChange={(e) => setImageSize(e.target.value as typeof imageSize)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {IMAGE_SIZES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Number of Images</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4].map((n) => (
                    <button
                      key={n}
                      onClick={() => setImageCount(n)}
                      className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${
                        imageCount === n
                          ? 'bg-gray-900 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value as typeof style)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {STYLES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generateMutation.isPending}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Images
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            {generateMutation.data && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Generated Images</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {generateMutation.data.images.map((img: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                      <div className="aspect-square bg-gray-100">
                        <img src={img.url} alt={`Generated ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3 flex items-center gap-2">
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-lg font-bold text-gray-900 mb-3">My Saved Images</h2>
            {userImages.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No saved images yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userImages.map((img) => (
                  <div key={img.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 group">
                    <div className="aspect-square bg-gray-100">
                      {img.url ? (
                        <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-500 truncate">{img.prompt}</p>
                      <div className="flex items-center gap-2 mt-2">
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
                          onClick={() => deleteMutation.mutate({ imageId: img.id })}
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
        </div>
      </div>
    </div>
  );
}


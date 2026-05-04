import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Upload, Wand2, ArrowLeft, ImageIcon, Minus, Plus, Loader2, Download, Sparkles, Trash2, Library, Type, Check, AlertCircle } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';
import { generateImageThemes, type ImageTheme } from '@/lib/trendEngine';
import { resizeImage } from '@/lib/imageResize';
import TextOverlayModal from '@/components/TextOverlayModal';

export default function Generate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [productName, setProductName] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [themes, setThemes] = useState<ImageTheme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<ImageTheme | null>(null);
  const [imageCount, setImageCount] = useState(4);
  const [imageSize, setImageSize] = useState<'1:1' | '9:16' | '16:9'>('1:1');
  const [generatedImages, setGeneratedImages] = useState<{ id: number; url: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [error, setError] = useState('');
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlayImageId, setOverlayImageId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [addTextOverlay, setAddTextOverlay] = useState(false);
  const [overlayText, setOverlayText] = useState('');
  const [overlayFont, setOverlayFont] = useState('Inter');
  const [overlayColor, setOverlayColor] = useState('#FFFFFF');
  const [overlaySize, setOverlaySize] = useState(48);
  const [overlayPosition, setOverlayPosition] = useState('center');

  const generateMutation = trpc.image.generate.useMutation();
  const saveOverlayMutation = trpc.image.saveOverlay.useMutation();
  const { data: myImages, refetch: refetchImages } = trpc.image.listMyImages.useQuery();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image masyadong malaki. Max 5MB lang.');
      return;
    }
    try {
      setGenerationStep('Resizing image...');
      const resized = await resizeImage(file, 1024, 0.85);
      setUploadedImage(resized);
      setError('');
      setGenerationStep('');
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        setError('');
        setGenerationStep('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeThemes = () => {
    if (!productName.trim()) return;
    const t = generateImageThemes(productName);
    setThemes(t);
    setSelectedTheme(t[0] ?? null);
  };

  const handleGenerate = async () => {
    if (!uploadedImage || !selectedTheme || !productName.trim()) return;
    console.log('[generate] Starting generation...');
    setIsGenerating(true);
    setError('');
    setGenerationStep('Submitting to fal.ai... this may take 30-120 seconds');
    setGeneratedImages([]);

    try {
      const result = await generateMutation.mutateAsync({
        productImageUrl: uploadedImage,
        themeTitle: selectedTheme.title,
        themeDescription: selectedTheme.description,
        productName: productName.trim(),
        count: imageCount,
        imageSize: imageSize,
      });

      console.log('[generate] Result:', result);
      setGeneratedImages(result.images);
      refetchImages();

      if (result.failed > 0) {
        setError(`${result.failed} image(s) failed. Errors: ${result.errors.join('; ')}`);
      }
    } catch (err: any) {
      console.error('[generate] ERROR:', err);
      setError(err?.message || 'Generation failed. Check console for details.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  const handleOverlaySave = (text: string, settings: any, finalUrl: string) => {
    if (overlayImageId) {
      saveOverlayMutation.mutate({
        imageId: overlayImageId,
        overlayText: text,
        overlaySettings: settings,
        finalImageUrl: finalUrl,
      }, {
        onSuccess: () => {
          refetchImages();
          setOverlayImage(null);
          setOverlayImageId(null);
        },
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="bg-gray-900 text-white py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold">BC AI Business Solutions</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/library')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
              <Library className="w-3 h-3" />
              My Library
            </button>
            <button onClick={() => navigate('/app')} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              Back to App
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Image Generation</h1>
          <p className="text-gray-600">
            I-upload ang produkto mo, pumili ng theme, at i-generate ang best ad images gamit ang AI.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="Hal. Wireless Headphones, Face Serum..."
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                onClick={handleAnalyzeThemes}
                disabled={!productName.trim()}
                className="mt-3 w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                <Wand2 className="w-4 h-4 inline mr-1" />
                Generate Themes
              </button>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Product Image</label>
              {uploadedImage ? (
                <div className="relative">
                  <img src={uploadedImage} alt="Product" className="w-full h-48 object-contain bg-gray-50 rounded-xl" />
                  <button
                    onClick={() => setUploadedImage(null)}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-lg shadow-sm text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                >
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Click para mag-upload ng product image</p>
                  <p className="text-xs text-gray-400 mt-1">PNG, JPG (Max 5MB)</p>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={addTextOverlay}
                  onChange={(e) => setAddTextOverlay(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                  <Type className="w-4 h-4" />
                  Add text overlay to generated images
                </span>
              </label>

              {addTextOverlay && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <textarea
                    value={overlayText}
                    onChange={(e) => setOverlayText(e.target.value)}
                    rows={2}
                    placeholder="e.g. SALE\n50% OFF\nLimited Time"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={overlayFont}
                      onChange={(e) => setOverlayFont(e.target.value)}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none"
                    >
                      <option value="Inter">Inter</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Arial Black">Arial Black</option>
                      <option value="Impact">Impact</option>
                    </select>
                    <input
                      type="color"
                      value={overlayColor}
                      onChange={(e) => setOverlayColor(e.target.value)}
                      className="w-full h-9 rounded-lg border border-gray-200"
                    />
                  </div>
                  <div className="flex gap-2">
                    {['top', 'center', 'bottom'].map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setOverlayPosition(pos)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                          overlayPosition === pos ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Size ({overlaySize}px)</label>
                    <input
                      type="range"
                      min={16}
                      max={100}
                      value={overlaySize}
                      onChange={(e) => setOverlaySize(Number(e.target.value))}
                      className="w-full mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Number of Images to Generate</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setImageCount(Math.max(1, imageCount - 1))}
                  className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-2xl font-bold text-gray-900 w-8 text-center">{imageCount}</span>
                <button
                  onClick={() => setImageCount(Math.min(10, imageCount + 1))}
                  className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 flex gap-2">
                {[1, 2, 4, 6, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setImageCount(n)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      imageCount === n ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3">Image Size (Aspect Ratio)</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setImageSize('1:1')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    imageSize === '1:1'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-8 h-8 bg-gray-200 rounded-sm" />
                  <span className="text-xs font-semibold">Square</span>
                  <span className="text-[10px] text-gray-500">1:1 · Instagram</span>
                </button>
                <button
                  onClick={() => setImageSize('9:16')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    imageSize === '9:16'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-5 h-8 bg-gray-200 rounded-sm" />
                  <span className="text-xs font-semibold">Vertical</span>
                  <span className="text-[10px] text-gray-500">9:16 · TikTok/Reels</span>
                </button>
                <button
                  onClick={() => setImageSize('16:9')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    imageSize === '16:9'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="w-8 h-5 bg-gray-200 rounded-sm" />
                  <span className="text-xs font-semibold">Landscape</span>
                  <span className="text-[10px] text-gray-500">16:9 · YouTube/Facebook</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || !selectedTheme || !productName.trim() || isGenerating}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {generationStep || `Generating ${imageCount} Images...`}
                </>
              ) : (
                <>
                  <Wand2 className="w-5 h-5" />
                  Generate {imageCount} AI Images
                </>
              )}
            </button>

            {(!productName.trim() || !selectedTheme || !uploadedImage) && !isGenerating && (
              <div className="text-xs text-gray-500 text-center space-y-1">
                {!productName.trim() && <p>Enter a product name above</p>}
                {productName.trim() && themes.length === 0 && <p>Click &ldquo;Generate Themes&rdquo; to see theme options</p>}
                {themes.length > 0 && !selectedTheme && <p>Select a theme from the panel on the right</p>}
                {!uploadedImage && <p>Upload a product image</p>}
              </div>
            )}

            {isGenerating && (
              <div className="text-center text-sm text-gray-500">
                <p>Using fal-ai/nano-banana-2/edit</p>
                <p className="text-xs mt-1">thinking_level: high | resolution: 1K</p>
                <p className="text-xs mt-1">This may take 30-120 seconds depending on queue</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {themes.length > 0 ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Select Theme
                  {!selectedTheme && <span className="text-red-500 ml-1">*</span>}
                </h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        selectedTheme?.id === theme.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-12 rounded-full" style={{ background: `linear-gradient(to bottom, ${theme.colorPalette[0]}, ${theme.colorPalette[1]})` }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{theme.title}</p>
                          <p className="text-xs text-gray-500 truncate">{theme.description}</p>
                        </div>
                        {selectedTheme?.id === theme.id && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
                {!selectedTheme && (
                  <p className="text-xs text-amber-600 mt-3 text-center font-medium">Click a theme above to select it</p>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 text-center">
                <Wand2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Enter a product name and click</p>
                <p className="text-sm text-gray-500">&ldquo;Generate Themes&rdquo; to see options</p>
              </div>
            )}

            {generatedImages.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Newly Generated
                  </h3>
                  <span className="text-xs text-gray-500">{generatedImages.length} image(s)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {generatedImages.map((img, i) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.url || ''}
                        alt={`Generated ${i + 1}`}
                        className="w-full h-40 object-cover rounded-xl bg-gray-100"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Image+Failed'; }}
                      />
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <a
                          href={img.url || ''}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Download className="w-4 h-4 text-gray-700" />
                        </a>
                        <button
                          onClick={() => { setOverlayImage(img.url); setOverlayImageId(img.id); }}
                          className="p-1.5 bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Add text overlay"
                        >
                          <Type className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {myImages && myImages.filter(img => img.status === 'completed').length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Previously Generated</h3>
                  <button onClick={() => navigate('/library')} className="text-xs text-blue-600 hover:underline">
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {myImages
                    .filter(img => img.status === 'completed')
                    .slice(0, 4)
                    .map((img) => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.finalImageUrl || img.resultImageUrl || ''}
                        alt={img.themeTitle}
                        className="w-full h-32 object-cover rounded-xl bg-gray-100"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Unavailable'; }}
                      />
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <button
                          onClick={() => { setOverlayImage(img.resultImageUrl || ''); setOverlayImageId(img.id); }}
                          className="p-1.5 bg-white rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Type className="w-3 h-3 text-blue-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {themes.length === 0 && generatedImages.length === 0 && (!myImages || myImages.length === 0) && (
              <div className="bg-white rounded-2xl p-10 shadow-sm border border-gray-100 text-center">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  Mag-enter ng product name at i-upload ang image para makakuha ng AI-generated ad images.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {overlayImage && (
        <TextOverlayModal
          imageUrl={overlayImage}
          onClose={() => { setOverlayImage(null); setOverlayImageId(null); }}
          onSave={handleOverlaySave}
        />
      )}
    </div>
  );
}

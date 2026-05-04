import { useState, useRef } from 'react';
import { Upload, Sparkles, Copy, Check, MessageSquare, ImageIcon, Wand2 } from 'lucide-react';
import { generateImageCaptions } from '@/lib/captionEngine';
import type { ImageCaption } from '@/lib/captionEngine';

export default function CaptionGenerator() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState('');
  const [captions, setCaptions] = useState<ImageCaption[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image masyadong malaki. Max 5MB lang.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
      setCaptions([]);
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    if (!uploadedImage) return;
    setIsGenerating(true);

    setTimeout(() => {
      const desc = imageDescription.trim() || 'ad image';
      const result = generateImageCaptions(desc, uploadedImage);
      setCaptions(result);
      setIsGenerating(false);
    }, 800);
  };

  const handleCopy = (text: string, index: number) => {
    const fullText = `${text}\n${captions[index].hashtags.join(' ')}`;
    navigator.clipboard.writeText(fullText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const platformColors: Record<string, string> = {
    facebook: 'bg-blue-50 border-blue-200',
    instagram: 'bg-pink-50 border-pink-200',
    tiktok: 'bg-cyan-50 border-cyan-200',
  };

  const platformLabels: Record<string, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    tiktok: 'TikTok',
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Branding Bar */}
      <div className="bg-gradient-to-r from-[#1a1b2e] to-[#2d2e4f] text-white py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/app')} className="text-sm font-semibold hover:text-blue-300 transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" />
              BC AI Business Solutions
            </button>
          </div>
          <div className="flex items-center gap-4">
            {user.isAdmin && (
              <button onClick={() => navigate('/admin')} className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                <Shield className="w-3 h-3" />
                Admin Panel
              </button>
            )}
            <button onClick={() => navigate('/library')} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
              <Library className="w-3 h-3" />
              Library
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <User className="w-3 h-3" />
              {user.name}
            </div>
            <button onClick={logout} className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1">
              <LogOut className="w-3 h-3" />
              Log Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 rounded-full mb-4">
            <MessageSquare className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">AI Caption Generator</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Mag-generate ng Ad Captions
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            I-upload ang iyong ad image at makakuha ng 3 optimized captions with hashtags para sa Facebook, Instagram, at TikTok.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column — Upload */}
          <div className="space-y-6">
            {/* Image Upload */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Upload Ad Image <span className="text-red-500">*</span>
              </label>

              {!uploadedImage ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-blue-400 hover:bg-blue-50/50 transition-all"
                >
                  <Upload className="w-10 h-10 text-gray-400" />
                  <p className="text-sm text-gray-500">Click to upload image</p>
                  <p className="text-xs text-gray-400">PNG, JPG, WEBP (max 5MB)</p>
                </button>
              ) : (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full h-64 object-contain rounded-xl border border-gray-200 bg-gray-50"
                  />
                  <button
                    onClick={() => { setUploadedImage(null); setCaptions([]); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <ArrowLeft className="w-3 h-3 rotate-45" />
                  </button>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Image Description */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Ano ang laman ng image? <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={imageDescription}
                onChange={(e) => setImageDescription(e.target.value)}
                placeholder="e.g., Organic face serum, Fitness smartwatch, Baby stroller..."
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">
                Mas maganda kung may description — mas accurate ang captions!
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || isGenerating}
              className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Captions...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Captions
                </>
              )}
            </button>
          </div>

          {/* Right Column — Results */}
          <div>
            {captions.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-5 h-5 text-green-600" />
                  <h3 className="text-lg font-bold text-gray-900">Generated Captions</h3>
                  <span className="text-xs text-gray-500">{captions.length} captions</span>
                </div>

                {captions.map((cap, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl p-5 border-2 ${platformColors[cap.platform] || 'bg-gray-50 border-gray-200'} transition-all hover:shadow-md`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-gray-500 uppercase">
                        {platformLabels[cap.platform] || cap.platform}
                      </span>
                      <span className="text-xs text-gray-400">#{i + 1}</span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed mb-3">{cap.text}</p>
                    <p className="text-xs text-gray-500 mb-4">{cap.hashtags.join(' ')}</p>
                    <button
                      onClick={() => handleCopy(cap.text, i)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      {copiedIndex === i ? (
                        <>
                          <Check className="w-4 h-4 text-green-600" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy with Hashtags
                        </>
                      )}
                    </button>
                  </div>
                ))}

                {/* Action */}
                <button
                  onClick={() => { setCaptions([]); setImageDescription(''); }}
                  className="w-full py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-gray-300 transition-all"
                >
                  Generate New Captions
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">No Captions Yet</h3>
                <p className="text-sm text-gray-400">
                  Upload an image and click &ldquo;Generate Captions&rdquo; to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { Upload, Sparkles, Copy, Check, ImageIcon, X, Target, MessageSquare, Eye, Loader2, AlertCircle } from 'lucide-react';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import UpgradePrompt from '@/components/UpgradePrompt';

export default function ImageAdAnalyzer() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string>('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'captions' | 'targeting'>('captions');
  const [showUpgrade, setShowUpgrade] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const { usage, loading: usageLoading, increment } = useUsageLimit('image-ad-analyzer');

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
      setResult('');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!uploadedImage) return;

    // Check usage limit first
    const incResult = await increment();
    if (!incResult.success) {
      if (incResult.limitReached) {
        setShowUpgrade(true);
        return;
      }
      alert(incResult.error || 'Failed to check usage');
      return;
    }

    setIsGenerating(true);
    setResult('');

    try {
      const response = await fetch('/api/image-ad-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDescription: imageDescription.trim() || 'a product in an advertisement image',
          imageDataUrl: uploadedImage,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to analyze image');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullText += parsed.content;
              setResult(fullText);
            }
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } catch (err: any) {
      setResult(`❌ Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const sections = result ? parseSections(result) : null;

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const remaining = usage ? usage.remaining : 0;
  const limit = usage ? usage.limit : 0;
  const isPro = usage?.isPro ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-50 rounded-full mb-4">
            <Eye className="w-4 h-4 text-violet-600" />
            <span className="text-sm font-semibold text-violet-700">AI Image Ad Analyzer</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Image Ad Analyzer
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            I-upload ang iyong ad image at gagamit ang AI para i-analyze ito, mag-generate ng <strong>3 Taglish captions</strong>, at gumawa ng <strong>Facebook Ads targeting strategy</strong> para sa'yo.
          </p>

          {/* Usage indicator */}
          {!usageLoading && !isPro && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-violet-500" />
              <span className="text-sm text-gray-600">
                <strong className="text-gray-900">{remaining}</strong>/{limit} analyses remaining this month
              </span>
            </div>
          )}
          {!usageLoading && isPro && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-full border border-amber-200 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700">Unlimited — Pro Plan</span>
            </div>
          )}
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
                  className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-violet-400 hover:bg-violet-50/50 transition-all"
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
                    onClick={() => { setUploadedImage(null); setResult(''); }}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-3 h-3" />
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
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
              />
              <p className="text-xs text-gray-500 mt-2">
                Mas maganda kung may description — mas accurate ang AI analysis!
              </p>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!uploadedImage || isGenerating || (!isPro && remaining <= 0)}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-violet-700 hover:to-indigo-700 transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg shadow-violet-200"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI is Analyzing Image...
                </>
              ) : !isPro && remaining <= 0 ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  Limit Reached — Upgrade to Pro
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze with AI
                </>
              )}
            </button>

            {/* Upgrade prompt inline */}
            {showUpgrade && (
              <UpgradePrompt
                feature="image-ad-analyzer"
                used={usage?.used ?? 0}
                limit={usage?.limit ?? 5}
                onClose={() => setShowUpgrade(false)}
              />
            )}
          </div>

          {/* Right Column — Results */}
          <div ref={resultRef}>
            {result ? (
              <div className="space-y-4">
                {/* Tab Switcher */}
                {sections && (
                  <div className="flex gap-2 bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm">
                    <button
                      onClick={() => setActiveTab('captions')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === 'captions'
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      Taglish Captions
                    </button>
                    <button
                      onClick={() => setActiveTab('targeting')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === 'targeting'
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Target className="w-4 h-4" />
                      FB Ads Targeting
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  {activeTab === 'captions' && sections?.captions && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="w-5 h-5 text-violet-600" />
                        <h3 className="text-lg font-bold text-gray-900">Taglish Captions</h3>
                      </div>
                      {sections.captions.map((cap, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-gray-200 p-5 hover:border-violet-200 hover:shadow-sm transition-all"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                              {cap.platform || `Caption ${i + 1}`}
                            </span>
                            <span className="text-xs text-gray-400">#{i + 1}</span>
                          </div>
                          <p className="text-sm text-gray-800 leading-relaxed mb-3 whitespace-pre-wrap">{cap.text}</p>
                          {cap.hashtags && (
                            <p className="text-xs text-violet-500 mb-4">{cap.hashtags}</p>
                          )}
                          <button
                            onClick={() => handleCopy(`${cap.text}\n${cap.hashtags || ''}`, i)}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-violet-50 hover:border-violet-200 transition-colors flex items-center gap-2"
                          >
                            {copiedIndex === i ? (
                              <><Check className="w-4 h-4 text-green-600" /> Copied!</>
                            ) : (
                              <><Copy className="w-4 h-4" /> Copy with Hashtags</>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'targeting' && sections?.targeting && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-violet-600" />
                        <h3 className="text-lg font-bold text-gray-900">FB Ads Targeting Strategy</h3>
                      </div>
                      <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {sections.targeting}
                      </div>
                      <button
                        onClick={() => handleCopy(sections.targeting!, 99)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-violet-50 hover:border-violet-200 transition-colors flex items-center gap-2"
                      >
                        {copiedIndex === 99 ? (
                          <><Check className="w-4 h-4 text-green-600" /> Copied!</>
                        ) : (
                          <><Copy className="w-4 h-4" /> Copy Targeting Strategy</>
                        )}
                      </button>
                    </div>
                  )}

                  {!sections && (
                    <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {result}
                    </div>
                  )}
                </div>

                {/* Reset */}
                <button
                  onClick={() => { setResult(''); setImageDescription(''); }}
                  className="w-full py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-gray-300 transition-all"
                >
                  Analyze New Image
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
                <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-400 mb-2">No Analysis Yet</h3>
                <p className="text-sm text-gray-400">
                  Upload an image and click <strong>"Analyze with AI"</strong> to get Taglish captions + FB Ads targeting strategy.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to parse the AI response into sections
function parseSections(text: string): { captions: { text: string; platform: string; hashtags: string }[]; targeting: string } | null {
  const captions: { text: string; platform: string; hashtags: string }[] = [];
  let targeting = '';

  const targetingMatch = text.match(/(?:##\s*SECTION\s*3|##\s*FB ADS TARGETING|FB ADS TARGETING STRATEGY)[:\s]*([\s\S]*?)$/i);
  if (targetingMatch) {
    targeting = targetingMatch[1].trim();
  }

  const captionRegex = /\*\*Caption\s*(\d+)\s*\(([^)]+)\):\*\*\s*([\s\S]*?)(?=\*\*Caption\s*\d+\s*\(|##\s*SECTION\s*3|##\s*FB ADS|$)/gi;
  let match;
  while ((match = captionRegex.exec(text)) !== null) {
    const fullText = match[3].trim();
    const hashtagMatch = fullText.match(/(#[\w#]+[\s#]*[\w#]*)\s*$/);
    const captionText = hashtagMatch ? fullText.slice(0, fullText.lastIndexOf(hashtagMatch[1])).trim() : fullText;
    const hashtags = hashtagMatch ? hashtagMatch[1].trim() : '';
    captions.push({
      text: captionText,
      platform: match[2].trim(),
      hashtags,
    });
  }

  if (captions.length === 0) {
    const section2Match = text.match(/##\s*SECTION\s*2[:\s]*([\s\S]*?)(?:##\s*SECTION\s*3|##\s*FB ADS)/i);
    if (section2Match) {
      const raw = section2Match[1].trim();
      const parts = raw.split(/\*\*Caption\s*\d+/i);
      parts.forEach((part, i) => {
        if (i === 0) return;
        const platformMatch = part.match(/\(([^)]+)\):\*\*/);
        const platform = platformMatch ? platformMatch[1].trim() : `Caption ${i}`;
        const text = part.replace(/\([^)]+\):\*\*/, '').trim();
        const hashtagMatch = text.match(/(#[\w#]+[\s#]*[\w#]*)\s*$/);
        const captionText = hashtagMatch ? text.slice(0, text.lastIndexOf(hashtagMatch[1])).trim() : text;
        const hashtags = hashtagMatch ? hashtagMatch[1].trim() : '';
        captions.push({ text: captionText, platform, hashtags });
      });
    }
  }

  if (captions.length === 0 && !targeting) return null;

  return { captions, targeting };
}

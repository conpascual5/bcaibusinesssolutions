import { useState, useRef, useEffect } from 'react';
import { Crosshair, Sparkles, User, MessageSquare, Film, Loader2, Crown } from 'lucide-react';
import { generateTargeting } from '@/lib/targetingEngine';
import type { TargetingResult } from '@/lib/targetingEngine';
import { CaptionCard, VideoScriptCard } from '@/components/ResultCards';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';
import { useUsageLimit } from '@/hooks/useUsageLimit';
import UpgradePrompt from '@/components/UpgradePrompt';
import UsageBadge from '@/components/UsageBadge';

export default function Home() {
  const { usage, loading: usageLoading } = useUsageLimit('captions-video-script');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Crosshair className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground tracking-tight">Captions and Video Script</h1>
                {usage && <UsageBadge isPro={usage.isPro} used={usage.used} limit={usage.limit} />}
              </div>
              <p className="text-sm text-muted-foreground">Generate ad captions and video scripts for your products</p>
            </div>
          </div>
        </div>

        <CaptionsAndScripts />
      </div>
    </div>
  );
}

function CaptionsAndScripts() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TargetingResult | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const { usage, loading: usageLoading, increment } = useUsageLimit('captions-video-script');

  const saveSearch = trpc.search.save.useMutation();
  const { data: searches } = trpc.search.list.useQuery();

  useEffect(() => {
    if (result && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [result]);

  const handleAnalyze = () => {
    if (!query.trim()) return;

    // Check usage limit
    if (usage && !usage.isPro && usage.remaining <= 0) {
      setShowUpgrade(true);
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      const targeting = generateTargeting(query.trim());
      setResult(targeting);
      setIsAnalyzing(false);

      // Increment usage after successful generation
      increment();

      try {
        saveSearch.mutate({ productQuery: query.trim() });
      } catch {
        // silent fail
      }
    }, 1200);
  };

  if (!user) return null;

  return (
    <>
      {/* Search Input */}
      <div className="mb-8">
        <div className="max-w-2xl">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="e.g., Organic Face Serum, Smart Fitness Watch, Baby Stroller..."
              className="w-full px-6 py-4 bg-card border-2 border-border rounded-2xl outline-none focus:border-indigo-500 transition-all shadow-sm pr-36 text-foreground"
            />
            <button
              onClick={handleAnalyze}
              disabled={!query.trim() || isAnalyzing}
              className="absolute right-2 top-2 bottom-2 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isAnalyzing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isAnalyzing ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {/* Quick Examples */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-sm text-muted-foreground">Try:</span>
            {['Organic Face Serum', 'Smart Fitness Watch', 'Baby Stroller', 'Vegan Protein Powder', 'LED Desk Lamp'].map(example => (
              <button
                key={example}
                onClick={() => { setQuery(example); }}
                className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:border-indigo-300 hover:text-indigo-600 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div ref={resultsRef} className="pb-16">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Results for &ldquo;{result.product}&rdquo;</h2>
              <p className="text-sm text-muted-foreground">AI-generated captions and video scripts</p>
            </div>
          </div>

          {/* Ad Captions */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-emerald-600" />
              <h3 className="text-lg font-bold text-foreground">Ad Captions ({result.captions.length} total)</h3>
              <span className="text-xs text-muted-foreground ml-2">Ready-to-use with hashtags</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.captions.map((cap, i) => (
                <CaptionCard key={i} caption={cap} index={i} />
              ))}
            </div>
          </div>

          {/* Video Ad Scripts */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Film className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-bold text-foreground">Video Ad Scripts (3 scripts)</h3>
              <span className="text-xs text-muted-foreground ml-2">Hook, scenes, and CTA included</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {result.videoScripts.map((script, i) => (
                <VideoScriptCard key={i} script={script} index={i} />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => {
                setResult(null);
                setQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 bg-card border-2 border-border rounded-xl text-foreground font-semibold hover:border-muted-foreground/30 transition-all"
            >
              Generate Another Product
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Prompt */}
      {showUpgrade && usage && (
        <div className="max-w-md mx-auto mb-8">
          <UpgradePrompt
            feature="captions-video-script"
            used={usage.used}
            limit={usage.limit}
            onClose={() => setShowUpgrade(false)}
          />
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="pb-16 text-center">
          <div className="w-12 h-12 border-4 border-border border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground font-medium">Generating captions and video scripts...</p>
          <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
        </div>
      )}

      {/* Empty State */}
      {!result && !isAnalyzing && (
        <div className="pb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
            {[
              { icon: <MessageSquare className="w-6 h-6 text-emerald-600" />, title: 'Ad Captions', desc: 'Ready-to-use captions with hashtags for FB/IG/TikTok' },
              { icon: <Film className="w-6 h-6 text-purple-600" />, title: 'Video Scripts', desc: '3 complete ad scripts with hook, scenes, and CTA' },
            ].map((item, i) => (
              <div key={i} className="bg-card rounded-2xl p-6 border border-border text-center">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Recent Searches */}
          {searches && searches.length > 0 && (
            <div className="mt-12">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                {searches.slice(0, 8).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setQuery(s.productQuery)}
                    className="px-3 py-1.5 bg-card border border-border rounded-lg text-sm text-muted-foreground hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                  >
                    {s.productQuery}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}


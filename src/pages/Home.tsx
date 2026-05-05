import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Crosshair, Sparkles, User, Users, Target, BarChart3, Lightbulb, ImageIcon, MessageSquare, Film, Layers, Loader2, AlertCircle, Copy, Check, Facebook, Instagram, Music2, Wand2 } from 'lucide-react';
import { generateTargeting } from '@/lib/targetingEngine';
import type { TargetingResult, Caption, VideoScript, VisualPrompt } from '@/lib/targetingEngine';
import { CaptionCard, VideoScriptCard } from '@/components/ResultCards';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

type Tab = 'captions-scripts' | 'fb-ads-targeting';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>('captions-scripts');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Crosshair className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Captions and Video Script</h1>
              <p className="text-sm text-muted-foreground">Generate ad captions, video scripts, and Facebook Ads targeting</p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl card-shadow border border-border w-fit mb-8">
          <button
            onClick={() => setActiveTab('captions-scripts')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'captions-scripts'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Film className="w-4 h-4 stroke-[1.5]" />
            Captions & Video Script
          </button>
          <button
            onClick={() => setActiveTab('fb-ads-targeting')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'fb-ads-targeting'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            <Target className="w-4 h-4 stroke-[1.5]" />
            FB Ads Targeting
          </button>
        </div>

        {activeTab === 'captions-scripts' && <CaptionsAndScripts />}
        {activeTab === 'fb-ads-targeting' && <FBAdsTargeting />}
      </div>
    </div>
  );
}

function CaptionsAndScripts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<TargetingResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

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
    setIsAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      const targeting = generateTargeting(query.trim());
      setResult(targeting);
      setIsAnalyzing(false);

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
            <button
              onClick={() => navigate('/generate')}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
            >
              <ImageIcon className="w-5 h-5" />
              Generate Ad Images
            </button>
          </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { icon: <MessageSquare className="w-6 h-6 text-emerald-600" />, title: 'Ad Captions', desc: 'Ready-to-use captions with hashtags for FB/IG/TikTok' },
              { icon: <Film className="w-6 h-6 text-purple-600" />, title: 'Video Scripts', desc: '3 complete ad scripts with hook, scenes, and CTA' },
              { icon: <Wand2 className="w-6 h-6 text-indigo-600" />, title: 'AI Image Prompts', desc: 'Visual prompts for each video scene' },
              { icon: <Facebook className="w-6 h-6 text-blue-600" />, title: 'FB Captions', desc: 'Long-form Facebook ad captions' },
              { icon: <Instagram className="w-6 h-6 text-pink-600" />, title: 'IG Captions', desc: 'Aesthetic Instagram ad captions' },
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

function FBAdsTargeting() {
  const [productName, setProductName] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  const handleGenerate = async () => {
    if (!productName || !targetAudience) {
      setError('Please fill in Product Name and Target Audience.');
      return;
    }
    setIsGenerating(true);
    setOutput('');
    setError('');

    try {
      const response = await fetch('/api/fb-ads-targeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName, targetAudience, productDescription }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Generation failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.content) setOutput((prev) => prev + parsed.content);
          } catch { /* skip */ }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Left Panel — Inputs */}
      <div className="lg:col-span-2 space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="bg-card rounded-2xl card-shadow border border-border p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400 stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Product Details</h3>
              <p className="text-xs text-muted-foreground">What are you advertising?</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="fb-product" className="text-xs font-medium text-muted-foreground">Product Name *</Label>
              <Input id="fb-product" placeholder="e.g., Organic Face Serum" value={productName} onChange={(e) => setProductName(e.target.value)} className="bg-background/50 border-border/60 focus:border-indigo-400 focus:ring-indigo-400/20 h-10" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-audience" className="text-xs font-medium text-muted-foreground">Target Audience *</Label>
              <Textarea id="fb-audience" placeholder="e.g., Health-conscious women aged 25-45 interested in natural skincare..." value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="min-h-[100px] bg-background/50 border-border/60 focus:border-indigo-400 focus:ring-indigo-400/20 resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fb-desc" className="text-xs font-medium text-muted-foreground">Product Description (optional)</Label>
              <Textarea id="fb-desc" placeholder="e.g., Organic serum with vitamin C and hyaluronic acid, P499..." value={productDescription} onChange={(e) => setProductDescription(e.target.value)} className="min-h-[80px] bg-background/50 border-border/60 focus:border-indigo-400 focus:ring-indigo-400/20 resize-none" />
            </div>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={isGenerating || !productName || !targetAudience} className="w-full h-13 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-sm font-semibold shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none">
          {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4 mr-2" /> Generate FB Ads Targeting</>}
        </Button>

        {error && (
          <div className="flex items-start gap-2.5 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive animate-fade-in">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Right Panel — Output */}
      <div className="lg:col-span-3">
        <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden animate-fade-in-up">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[1.5]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">FB Ads Targeting Strategy</h3>
                <p className="text-xs text-muted-foreground">AI-powered audience insights</p>
              </div>
            </div>
            {output && (
              <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs gap-1.5 rounded-xl border-border/60">
                {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
              </Button>
            )}
          </div>
          <div ref={outputRef} className="h-[500px] overflow-y-auto p-6">
            {isGenerating && !output ? (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-indigo-500" />
                <p className="text-sm font-medium">Generating targeting strategy...</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Using AI to analyze your product and audience</p>
              </div>
            ) : output ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-[450]">
                {output}
                {isGenerating && <span className="inline-block w-[3px] h-[18px] bg-indigo-500 animate-pulse ml-0.5 align-text-bottom" />}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <Target className="w-7 h-7 text-muted-foreground/50 stroke-[1]" />
                </div>
                <p className="text-sm font-medium">Your FB Ads Targeting strategy will appear here</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Fill in the details and click Generate</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

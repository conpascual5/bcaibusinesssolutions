import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Crosshair, Sparkles, User, Users, Target, BarChart3, Lightbulb, LogOut, Shield, Plus, ImageIcon, Library, MessageSquare, Film, Layers } from 'lucide-react';
import { generateTargeting } from '@/lib/targetingEngine';
import type { TargetingResult } from '@/lib/targetingEngine';
import { PersonaCard, KeywordsCard, DemographicsCard, BehavioralLayerCard, WhyCard, CaptionCard, VideoScriptCard } from '@/components/ResultCards';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/providers/auth';

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Branding Bar */}
      <div className="bg-gradient-to-r from-[#1a1b2e] to-[#2d2e4f] text-white py-2 px-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="text-sm font-semibold">BC AI Business Solutions</span>
          <div className="flex items-center gap-4">
            {user.isAdmin && (
              <button
                onClick={() => navigate('/admin')}
                className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Shield className="w-3 h-3" />
                Admin Panel
              </button>
            )}
            <button
              onClick={() => navigate('/library')}
              className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Library className="w-3 h-3" />
              Library
            </button>
            <button
              onClick={() => navigate('/captions')}
              className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Caption Generator
            </button>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <User className="w-3 h-3" />
              {user.name}
            </div>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="max-w-4xl mx-auto px-4 pt-12 pb-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
            <Crosshair className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">AI-Powered Audience Intelligence</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Facebook Ads Targeting Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            I-type ang iyong product name at makakuha ng laser-focused audience personas, 
            targeting keywords, at demographic guardrails para sa iyong Facebook ads.
          </p>
        </div>

        {/* Search Input */}
        <div className="mt-10 max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="e.g., Organic Face Serum, Smart Fitness Watch, Baby Stroller..."
              className="w-full px-6 py-4 text-lg bg-white border-2 border-gray-200 rounded-2xl outline-none focus:border-blue-500 transition-all shadow-sm pr-36"
            />
            <button
              onClick={handleAnalyze}
              disabled={!query.trim() || isAnalyzing}
              className="absolute right-2 top-2 bottom-2 px-6 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isAnalyzing ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Crosshair className="w-4 h-4" />
              )}
              {isAnalyzing ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {/* Quick Examples */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="text-sm text-gray-500">Subukan:</span>
            {['Organic Face Serum', 'Smart Fitness Watch', 'Baby Stroller', 'Vegan Protein Powder', 'LED Desk Lamp'].map(example => (
              <button
                key={example}
                onClick={() => { setQuery(example); }}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>

          {/* Caption Generator CTA */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate('/captions')}
              className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-200 rounded-xl text-blue-700 font-semibold hover:bg-blue-50 transition-all shadow-sm"
            >
              <ImageIcon className="w-5 h-5" />
              O mag-generate ng Ad Captions
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div ref={resultsRef} className="max-w-6xl mx-auto px-4 pb-16">
          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Targeting Strategy for &ldquo;{result.product}&rdquo;</h2>
              <p className="text-sm text-gray-500">Generated using lateral thinking AI — going beyond the obvious to find hidden audiences</p>
            </div>
          </div>

          {/* 3 Personas */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-bold text-gray-900">3 Buyer Personas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {result.personas.map((persona, i) => (
                <PersonaCard key={i} persona={persona} index={i} />
              ))}
            </div>
          </div>

          {/* Targeting Keywords */}
          <div className="mb-8">
            <KeywordsCard keywords={result.keywords} />
          </div>

          {/* Behavioral Layer — the "pro" move */}
          <div className="mb-8">
            <BehavioralLayerCard behavioralLayer={result.behavioralLayer} />
          </div>

          {/* Demographics & Why - side by side on desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <DemographicsCard demographics={result.demographics} />
            <WhyCard why={result.why} />
          </div>

          {/* Ad Captions */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-bold text-gray-900">Ad Captions ({result.captions.length} total)</h3>
              <span className="text-xs text-gray-500 ml-2">Ready-to-use with hashtags</span>
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
              <h3 className="text-lg font-bold text-gray-900">Video Ad Scripts (3 scripts)</h3>
              <span className="text-xs text-gray-500 ml-2">Hook, scenes, and CTA included</span>
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
              className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-gray-300 transition-all"
            >
              Generate Another Product
            </button>
            <button
              onClick={() => navigate('/generate')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:opacity-90 transition-all shadow-lg flex items-center gap-2"
            >
              <ImageIcon className="w-5 h-5" />
              Generate Ad Images
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isAnalyzing && (
        <div className="max-w-4xl mx-auto px-4 pb-16 text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Analyzing audience data and applying lateral thinking...</p>
          <p className="text-sm text-gray-400 mt-1">This may take a few seconds</p>
        </div>
      )}

      {/* Empty State */}
      {!result && !isAnalyzing && (
        <div className="max-w-4xl mx-auto px-4 pb-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: <User className="w-6 h-6 text-blue-600" />, title: '3 Buyer Personas', desc: 'Detailed descriptions of who will buy your product' },
              { icon: <Target className="w-6 h-6 text-purple-600" />, title: 'Targeting Keywords', desc: 'Facebook Interests & Behaviors using lateral thinking' },
              { icon: <Layers className="w-6 h-6 text-emerald-600" />, title: 'Behavioral Layer', desc: 'Engaged Shoppers + secondary behavior targeting' },
              { icon: <MessageSquare className="w-6 h-6 text-green-600" />, title: 'Ad Captions', desc: 'Ready-to-use captions with hashtags for FB/IG/TikTok' },
              { icon: <Film className="w-6 h-6 text-purple-600" />, title: 'Video Scripts', desc: '3 complete ad scripts with hook, scenes, and CTA' },
              { icon: <BarChart3 className="w-6 h-6 text-rose-600" />, title: 'Demographics', desc: 'Age, gender, and income recommendations' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Recent Searches */}
          {searches && searches.length > 0 && (
            <div className="mt-12">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Recent Analysis</h3>
              <div className="flex flex-wrap gap-2">
                {searches.slice(0, 8).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setQuery(s.productQuery)}
                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                  >
                    {s.productQuery}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

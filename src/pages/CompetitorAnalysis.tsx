import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/providers/auth';
import {
  FileSearch,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  Target,
  ArrowRight,
  Copy,
  Check,
  Loader2,
  Link as LinkIcon,
  FileText,
  Brain,
  Zap,
  Shield,
  TrendingUp,
} from 'lucide-react';

interface AnalysisResult {
  psychologicalTriggers: {
    name: string;
    description: string;
    found: boolean;
    evidence: string;
  }[];
  counterPositioning: {
    title: string;
    strategy: string;
    example: string;
  }[];
  summary: string;
}

export default function CompetitorAnalysis() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [inputType, setInputType] = useState<'url' | 'text'>('text');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState('');

  const triggerCategories = [
    { name: 'Scarcity', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
    { name: 'Social Proof', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Problem-Agitation-Solution', icon: Brain, color: 'text-purple-500', bg: 'bg-purple-50' },
    { name: 'Urgency', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
    { name: 'Authority', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { name: 'Reciprocity', icon: Lightbulb, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  ];

  const analyzeCopy = async () => {
    if (!input.trim()) return;
    setIsAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/analyze-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input.trim(), type: inputType }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
          <FileSearch className="w-3 h-3" /> AI-Powered
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Competitor Ad Copy Analyzer</h1>
        <p className="text-gray-500 mt-1 max-w-xl">
          Paste a competitor's landing page URL or ad copy to analyze psychological triggers and get counter-positioning strategies.
        </p>
      </div>

      {/* Input */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        {/* Toggle */}
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setInputType('text')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              inputType === 'text'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1.5" />
            Paste Text
          </button>
          <button
            onClick={() => setInputType('url')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              inputType === 'url'
                ? 'bg-purple-100 text-purple-700'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            <LinkIcon className="w-4 h-4 inline mr-1.5" />
            Landing Page URL
          </button>
        </div>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            inputType === 'text'
              ? 'Paste the competitor\'s ad copy here...\n\nExample:\n"Limited time offer! Join 50,000+ happy customers who transformed their skin. Our dermatologist-approved formula is backed by 15 years of research. Buy now before it\'s gone!"'
              : 'Paste a landing page URL...\n\nExample: https://competitor.com/product-page'
          }
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-purple-400 focus:bg-white transition-all resize-none text-sm"
          rows={6}
        />

        <button
          onClick={analyzeCopy}
          disabled={!input.trim() || isAnalyzing}
          className="mt-4 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-xl font-semibold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-200"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing with Deepseek AI...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Analyze Ad Copy
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Analysis Failed</p>
            <p className="text-red-600 text-sm mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isAnalyzing && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-purple-600 animate-pulse" />
          </div>
          <p className="text-gray-700 font-semibold">Analyzing psychological triggers...</p>
          <p className="text-sm text-gray-400 mt-1">Deepseek AI is scanning for persuasion patterns</p>
          <div className="flex justify-center gap-2 mt-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5" />
              <h3 className="font-bold">AI Analysis Summary</h3>
            </div>
            <p className="text-purple-100 text-sm leading-relaxed">{result.summary}</p>
          </div>

          {/* Psychological Triggers Found */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Psychological Triggers Detected
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.psychologicalTriggers.map((trigger, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-4 border ${
                    trigger.found
                      ? 'bg-purple-50 border-purple-100'
                      : 'bg-gray-50 border-gray-100 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${trigger.found ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span className={`font-semibold text-sm ${trigger.found ? 'text-gray-900' : 'text-gray-400'}`}>
                      {trigger.name}
                    </span>
                    {trigger.found && (
                      <span className="text-xs text-green-600 font-medium ml-auto">Detected</span>
                    )}
                  </div>
                  {trigger.found && (
                    <p className="text-xs text-gray-600 leading-relaxed">{trigger.evidence}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Counter-Positioning Strategies */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Counter-Positioning Strategies
            </h3>
            <div className="space-y-4">
              {result.counterPositioning.map((strategy, i) => (
                <div key={i} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-5 border border-amber-100">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <span className="w-6 h-6 bg-amber-200 rounded-lg flex items-center justify-center text-xs font-bold text-amber-800">
                        {i + 1}
                      </span>
                      {strategy.title}
                    </h4>
                    <button
                      onClick={() => copyToClipboard(strategy.example, i)}
                      className="flex-shrink-0 p-1.5 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 transition-colors"
                    >
                      {copiedIndex === i ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-amber-600" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{strategy.strategy}</p>
                  <div className="bg-white/80 rounded-lg p-3 border border-amber-100">
                    <p className="text-xs text-gray-500 font-medium mb-1">Example counter-copy:</p>
                    <p className="text-sm text-gray-800 italic">"{strategy.example}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Analyze Another */}
          <div className="text-center pb-8">
            <button
              onClick={() => {
                setResult(null);
                setInput('');
                setError('');
              }}
              className="px-6 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-700 font-semibold hover:border-gray-300 transition-all"
            >
              Analyze Another Ad
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/providers/auth";
import {
  Search,
  ExternalLink,
  Loader2,
  Globe,
  MessageCircle,
  Heart,
  X,
  AlertTriangle,
} from "lucide-react";

interface AdAnalyzerProps {
  language: string;
}

const LANGUAGE_OPTIONS = [
  { id: "taglish", label: "Taglish", icon: Globe },
  { id: "english", label: "English", icon: MessageCircle },
  { id: "filipino", label: "Filipino", icon: Heart },
];

function AnalysisSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-4/6" />
      <div className="pt-3">
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export default function AdAnalyzer({ language }: AdAnalyzerProps) {
  const { token } = useAuth();
  const [adUrl, setAdUrl] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const analysisRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (analysisRef.current) {
      analysisRef.current.scrollTop = analysisRef.current.scrollHeight;
    }
  }, [analysis]);

  const handleAnalyze = async () => {
    if (!adUrl.trim() || !token) return;

    // This tool previously depended on Vercel API and has been disabled per request
    // to remove provider-specific references from the product UI.
    setIsAnalyzing(false);
    setAnalysis("");
    setError("Temporarily unavailable while AI provider integrations are being removed from the UI.");
  };

  return (
    <div className="bg-card rounded-2xl card-shadow border border-border overflow-hidden animate-fade-in-up">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
            <Search className="w-4 h-4 text-orange-600 dark:text-orange-400 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Ad Analyzer</h3>
            <p className="text-xs text-muted-foreground">I-paste ang ad URL para ma-analyze ang sales framework nito</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs gap-1.5 rounded-xl"
        >
          {isOpen ? "Close" : "Open"}
          {isOpen ? <X className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {isOpen && (
        <div className="p-5 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Ad URL</label>
            <Input
              value={adUrl}
              onChange={(e) => setAdUrl(e.target.value)}
              placeholder="https://..."
              className="rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            {LANGUAGE_OPTIONS.map((opt) => (
              <div
                key={opt.id}
                className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  language === opt.id ? "bg-accent border-border" : "bg-background border-border"
                }`}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </div>
            ))}
          </div>

          <Button onClick={handleAnalyze} disabled className="w-full rounded-xl">
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Analyzing...
              </>
            ) : (
              "Analyze (Disabled)"
            )}
          </Button>

          {error && (
            <div className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="rounded-2xl border border-border overflow-hidden">
            <ScrollArea className="h-72" ref={analysisRef as any}>
              {isAnalyzing ? <AnalysisSkeleton /> : <div className="p-4 text-sm whitespace-pre-wrap text-foreground">{analysis}</div>}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}

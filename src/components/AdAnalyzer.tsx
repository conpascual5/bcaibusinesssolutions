import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ExternalLink,
  Loader2,
  Globe,
  MessageCircle,
  Heart,
  X,
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
    if (!adUrl.trim()) return;
    setIsAnalyzing(true);
    setAnalysis("");
    setError("");
    try {
      const response = await fetch("/api/sales-wizard/analyze-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adUrl: adUrl.trim(), language }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Analysis failed");
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") continue;
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.content) setAnalysis((prev) => prev + parsed.content);
          } catch { /* skip */ }
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
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
            <p className="text-xs text-muted-foreground">
              I-paste ang ad URL para ma-analyze ang sales framework nito
            </p>
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
          <div className="flex gap-2">
            <Input
              placeholder="Paste ad URL (e.g., Facebook ad link)..."
              value={adUrl}
              onChange={(e) => setAdUrl(e.target.value)}
              className="bg-background/50 border-border/60 focus:border-orange-400 focus:ring-orange-400/20 h-10 flex-1"
            />
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !adUrl.trim()}
              className="bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-xl shadow-lg shadow-orange-500/20 px-5"
            >
              {isAnalyzing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Analyze"
              )}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-sm text-destructive">
              {error}
            </div>
          )}

          <ScrollArea className="h-[300px]" ref={analysisRef}>
            {isAnalyzing && !analysis ? (
              <AnalysisSkeleton />
            ) : analysis ? (
              <div className="p-4">
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90 font-[450]">
                  {analysis}
                  {isAnalyzing && (
                    <span className="inline-block w-[3px] h-[18px] bg-orange-500 animate-pulse ml-0.5 align-text-bottom" />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <Search className="w-6 h-6 text-muted-foreground/50 stroke-[1]" />
                </div>
                <p className="text-sm font-medium">Paste an ad URL to analyze</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  We'll identify the sales framework and copy techniques used
                </p>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

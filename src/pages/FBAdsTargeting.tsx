import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/providers/auth";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UpgradePrompt from "@/components/UpgradePrompt";
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  Package,
  Sparkles,
  Target,
  Wand2,
} from "lucide-react";

export default function FBAdsTargeting() {
  const { token } = useAuth();

  const [businessName, setBusinessName] = useState("");
  const [productName, setProductName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const outputRef = useRef<HTMLPreElement>(null);

  const { usage, loading: usageLoading, increment } = useUsageLimit("fb-ads-targeting");

  useEffect(() => {
    if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [output]);

  const handleGenerate = async () => {
    if (!businessName || !productName) {
      setError("Please enter your Business Name and Product Name.");
      return;
    }

    const incResult = await increment();
    if (!incResult.success) {
      if (incResult.limitReached) {
        setShowUpgrade(true);
        return;
      }
      setError(incResult.error || "Failed to check usage");
      return;
    }

    if (!token) {
      setError("Please log in again.");
      return;
    }

    setIsGenerating(true);
    setOutput("");
    setError("");

    try {
      const res = await fetch("/api/fb-ads-targeting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ businessName, product: productName }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `Server error (${res.status})`);
      }

      // Handle SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              setError(parsed.error);
              setIsGenerating(false);
              return;
            }
            if (parsed.content) {
              fullText += parsed.content;
              setOutput(fullText);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }

      setOutput(fullText || "No output");
    } catch (e: any) {
      setError(e?.message || "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const remaining = usage?.remaining ?? 0;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-slate-900">FB Ads Targeting</h1>
            <p className="text-sm text-slate-500">Generate personas, interests, and angles.</p>
          </div>
          {!usageLoading && usage && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              {remaining} left
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Business Name</label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Con's Online Store"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Product Name</label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Whitening Soap"
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl border border-red-200 bg-red-50 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || !token}
          className="mt-5 w-full px-5 py-4 rounded-2xl font-extrabold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 pointer-events-auto"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wand2 className="w-5 h-5" />}
          {isGenerating ? "Generating…" : "Generate Targeting"}
        </button>
      </div>

      {output && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-indigo-600" />
              <p className="text-sm font-extrabold text-slate-900">Results</p>
            </div>
            <button
              onClick={copyToClipboard}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre ref={outputRef} className="p-5 text-sm whitespace-pre-wrap text-slate-900 leading-relaxed">{output}</pre>
        </div>
      )}

      {showUpgrade && (
        <UpgradePrompt
          feature="fb-ads-targeting"
          used={usage?.used ?? 0}
          limit={usage?.limit ?? 3}
          plan={usage?.plan}
          isVip={usage?.isVip}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
}

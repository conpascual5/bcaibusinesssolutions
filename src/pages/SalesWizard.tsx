import { useMemo, useState } from "react";
import { useAuth } from "@/providers/auth";
import { Sparkles, Loader2, Copy, Check, Wand2 } from "lucide-react";

export default function SalesWizard() {
  const { token } = useAuth();
  const [productName, setProductName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [messageContext, setMessageContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const canSubmit = useMemo(
    () => !!token && productName.trim().length > 0 && targetAudience.trim().length > 0,
    [token, productName, targetAudience]
  );

  const generate = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("https://dkatgjtvhitknghvaxxn.supabase.co/functions/v1/deepseek-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token ?? ""}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a high-converting sales copywriter. Produce structured output with clear sections, bullets, and CTA. Taglish is allowed if it fits.",
            },
            {
              role: "user",
              content: `Product: ${productName}\nTarget Audience: ${targetAudience}\nContext: ${messageContext}\n\nCreate: (1) Short caption, (2) Messenger/DM script, (3) Objection-handling replies, (4) 3 hooks, (5) 3 CTAs.`,
            },
          ],
          max_tokens: 1800,
          temperature: 0.7,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Generation failed");
      setOutput(json.content || "No output");
    } catch (e: any) {
      setOutput(`❌ ${e?.message || "Generation failed"}`);
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Sales Wizard</h1>
            <p className="text-sm text-gray-500">Deepseek-powered (Edge Function).</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Product</label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Whitening Soap"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Target Audience</label>
            <input
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Busy moms, students, online sellers"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Context (optional)</label>
          <textarea
            value={messageContext}
            onChange={(e) => setMessageContext(e.target.value)}
            className="mt-2 w-full min-h-[120px] px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., Promo details, price, unique benefits, delivery, etc."
          />
        </div>

        <button
          onClick={generate}
          disabled={!canSubmit || loading}
          className="mt-4 w-full px-5 py-4 rounded-2xl font-extrabold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {loading ? "Generating…" : "Generate"}
        </button>

        {!token && <div className="mt-4 text-sm text-gray-500">Please log in to use this tool.</div>}
      </div>

      {output && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-extrabold text-gray-900">Output</p>
            <button
              onClick={copy}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <pre className="p-4 text-sm whitespace-pre-wrap text-gray-900 leading-relaxed">{output}</pre>
        </div>
      )}
    </div>
  );
}

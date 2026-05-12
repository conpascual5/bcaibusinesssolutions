import { useState } from "react";
import { Search, Sparkles, Copy, Check, AlertTriangle } from "lucide-react";

export default function CompetitorAnalysis() {
  const [text, setText] = useState("");
  const [type, setType] = useState<"copy" | "url">("copy");
  const [output, setOutput] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const analyze = async () => {
    setOutput("This tool is temporarily unavailable while AI provider integrations are being removed from the UI.");
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
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
            <Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Competitor Analysis</h1>
            <p className="text-sm text-gray-500">AI-powered copy analysis.</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={() => setType("copy")}
            className={`px-4 py-2 rounded-xl text-sm font-bold border ${
              type === "copy" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            Ad Copy
          </button>
          <button
            onClick={() => setType("url")}
            className={`px-4 py-2 rounded-xl text-sm font-bold border ${
              type === "url" ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 border-gray-200"
            }`}
          >
            Landing Page Text
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-4 w-full min-h-[180px] px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
          placeholder={type === "copy" ? "Paste competitor ad copy here…" : "Paste landing page text here…"}
        />

        <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-900">Temporarily unavailable</p>
            <p className="text-sm text-amber-800 mt-1">We’re removing provider-specific AI wiring from the product UI right now.</p>
          </div>
        </div>

        <button
          onClick={analyze}
          disabled={!text.trim()}
          className="mt-4 w-full px-5 py-4 rounded-2xl font-extrabold text-white bg-gradient-to-r from-rose-600 to-pink-600 hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
        >
          <Sparkles className="w-5 h-5" />
          Analyze
        </button>
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

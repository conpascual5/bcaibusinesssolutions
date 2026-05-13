import { useMemo, useState } from "react";
import { useAuth } from "@/providers/auth";
import { SALES_FRAMEWORKS, type SalesFrameworkId } from "@/lib/salesFrameworks";
import { useUsageLimit } from "@/hooks/useUsageLimit";
import UpgradePrompt from "@/components/UpgradePrompt";
import SocialPostEditor from "@/components/SocialPostEditor";
import {
  Wand2,
  Sparkles,
  Loader2,
  LayoutTemplate,
  Hash,
  FileText,
  Facebook,
  Globe,
  MessageSquare,
} from "lucide-react";

const LANGUAGES = [
  { id: "taglish", label: "Taglish", description: "Tagalog + English mix" },
  { id: "filipino", label: "Filipino", description: "Pure Tagalog" },
  { id: "english", label: "English", description: "Pure English" },
];

function FrameworkCard({
  id,
  title,
  subtitle,
  emoji,
  description,
  active,
  onSelect,
}: {
  id: SalesFrameworkId;
  title: string;
  subtitle: string;
  emoji: string;
  description: string;
  active: boolean;
  onSelect: (id: SalesFrameworkId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`text-left rounded-3xl border p-4 transition-all ${
        active
          ? "border-indigo-300 bg-indigo-50 shadow-sm"
          : "border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">{subtitle}</p>
          <h3 className="mt-1 text-sm font-extrabold text-slate-900 leading-snug">{title}</h3>
        </div>
        <div className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center ${active ? "bg-white" : "bg-slate-50"}`}>
          <span className="text-lg" aria-hidden>
            {emoji}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{description}</p>
    </button>
  );
}

export default function SalesWizard() {
  const { token } = useAuth();
  const [productName, setProductName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [message, setMessage] = useState("");
  const [frameworkId, setFrameworkId] = useState<SalesFrameworkId>("aida");
  const [language, setLanguage] = useState("taglish");

  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [showUpgrade, setShowUpgrade] = useState(false);
  const { usage, loading: usageLoading, increment } = useUsageLimit("sales-wizard");

  const canSubmit = useMemo(
    () => !!token && businessName.trim().length > 0 && productName.trim().length > 0,
    [token, businessName, productName]
  );

  const selectedFramework = useMemo(
    () => SALES_FRAMEWORKS.find((f) => f.id === frameworkId)!,
    [frameworkId]
  );

  // Map client framework IDs to API server framework IDs
  const frameworkToApiId: Record<string, string> = {
    "six-w": "6-ws",
    "story-solve-sell": "story-solve-sell",
    "solution-savings-social-proof": "solution-savings-social-proof",
    "pain-agitate-relief": "pain-agitate-relief",
    "friend-expert": "friend-expert",
    "past-present-future": "past-present-future",
    "positive-negative": "positive-negative",
    "exclusive-inclusive": "exclusive-inclusive",
    "expectation-surprise": "expectation-surprise",
    "urgency-patience": "urgency-patience",
    "personal-universal": "personal-universal",
    "emotion-logic": "emotion-logic",
    "strong-weak": "strong-weak",
    "consistent-contrasting": "consistent-contrasting",
    "five-basic-objections": "5-objections",
    "awareness-comprehension-conviction-action": "acca",
    "picture-promise-prove-push": "picture-promise-prove-push",
    "star-story-solution": "star-story-solution",
    "problem-agitate-solve": "problem-agitate-solve",
    "aida": "aida",
    "before-after-bridge": "before-after-bridge",
    "pastor": "pastor",
    "four-c": "four-c",
    "fab": "features-advantages-benefits",
  };

  const generate = async () => {
    setError(null);

    if (!canSubmit || !token) return;

    const incResult = await increment();
    if (!incResult.success) {
      if (incResult.limitReached) {
        setShowUpgrade(true);
        return;
      }
      setError(incResult.error || "Failed to check usage");
      return;
    }

    setLoading(true);
    setOutput("");

    try {
      const res = await fetch("/api/sales-wizard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productName,
          targetAudience: businessName,
          messageContext: message || "",
          contentType: "caption",
          framework: frameworkToApiId[frameworkId] || frameworkId,
          language,
        }),
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
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.content) {
              fullText += parsed.content;
              setOutput(fullText);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }

      if (!fullText) setOutput("No output");
    } catch (e: any) {
      setError(e?.message || "Generation failed");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
            <LayoutTemplate className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Sales Wizard</h1>
            <p className="text-sm text-slate-500">Generate captions + blog posts using proven frameworks.</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Product Name</label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Whitening Soap"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Business Name</label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g., Con's Online Store"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Anything you want to say (optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 w-full min-h-[120px] px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="e.g., May promo, COD available, free shipping, limited stocks, benefits, ingredients, etc."
          />
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-extrabold text-slate-900">Language</h2>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setLanguage(lang.id)}
                className={`text-left rounded-2xl border p-3 transition-all ${
                  language === lang.id
                    ? "border-indigo-300 bg-indigo-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-indigo-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Globe className={`w-4 h-4 ${language === lang.id ? "text-indigo-600" : "text-slate-400"}`} />
                  <span className="text-sm font-bold text-slate-900">{lang.label}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-500">{lang.description}</p>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-extrabold text-slate-900">Choose a framework</h2>
            </div>
            {!usageLoading && usage && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                {usage.remaining} left
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SALES_FRAMEWORKS.map((f) => (
              <FrameworkCard
                key={f.id}
                id={f.id}
                title={f.title}
                subtitle={f.subtitle}
                emoji={f.emoji}
                description={f.description}
                active={f.id === frameworkId}
                onSelect={setFrameworkId}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
        )}

        <button
          onClick={generate}
          disabled={!canSubmit || loading}
          className="mt-6 w-full px-5 py-4 rounded-2xl font-extrabold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
          {loading ? "Generating…" : "Generate"}
        </button>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <Facebook className="w-4 h-4 text-indigo-700" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">FB Caption</p>
              <p className="text-[11px] text-slate-500">Ready-to-post</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-purple-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-purple-700" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Blog Post</p>
              <p className="text-[11px] text-slate-500">Short + structured</p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <Hash className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900">Hashtags</p>
              <p className="text-[11px] text-slate-500">10–18 tags</p>
            </div>
          </div>
        </div>
      </div>

      {output && (
        <SocialPostEditor
          value={output}
          onChange={setOutput}
          title="Generated Facebook post"
          subtitle="Preview it like a real feed post — then edit + copy"
        />
      )}

      {showUpgrade && (
        <UpgradePrompt
          feature="sales-wizard"
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

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles,
  Search,
  Trash2,
  Clock,
  Loader2,
  FileText,
  Wand2,
  Copy,
  CheckCheck,
  LibraryBig,
  LayoutTemplate,
  Target,
  Eye,
  AlertCircle,
} from "lucide-react";

type ToolType = "sales-wizard" | "fb-ads-targeting" | "image-ad-analyzer" | "ad-analyzer";

interface Generation {
  id: string;
  tool: ToolType;
  input: Record<string, unknown> | null;
  output: string;
  created_at: string;
}

const TOOL_LABELS: Record<ToolType, string> = {
  "sales-wizard": "Sales Wizard",
  "fb-ads-targeting": "FB Ads Targeting",
  "image-ad-analyzer": "Image Ad Analyzer",
  "ad-analyzer": "Ad Analyzer",
};

const TOOL_ICONS: Record<ToolType, React.ReactNode> = {
  "sales-wizard": <LayoutTemplate className="w-4 h-4" />,
  "fb-ads-targeting": <Target className="w-4 h-4" />,
  "image-ad-analyzer": <Eye className="w-4 h-4" />,
  "ad-analyzer": <Search className="w-4 h-4" />,
};

const TOOL_COLORS: Record<ToolType, string> = {
  "sales-wizard": "from-indigo-500 to-purple-600",
  "fb-ads-targeting": "from-indigo-500 to-purple-600",
  "image-ad-analyzer": "from-violet-600 to-indigo-600",
  "ad-analyzer": "from-rose-500 to-pink-600",
};

const ALL_TOOLS: ToolType[] = ["sales-wizard", "fb-ads-targeting", "image-ad-analyzer", "ad-analyzer"];

export default function Library() {
  const navigate = useNavigate();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTool, setActiveTool] = useState<ToolType | "all">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadGenerations();
  }, []);

  const loadGenerations = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setGenerations((data as Generation[]) || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await supabase.from("generations").delete().eq("id", id);
    setGenerations((prev) => prev.filter((g) => g.id !== id));
    setDeletingId(null);
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filtered = activeTool === "all" ? generations : generations.filter((g) => g.tool === activeTool);

  const getToolSummary = (gen: Generation): string => {
    const input = gen.input;
    if (gen.tool === "sales-wizard" && input) {
      return `${(input as any).productName || ""} — ${(input as any).businessName || ""}`;
    }
    if (gen.tool === "fb-ads-targeting" && input) {
      return `${(input as any).product || ""} — ${(input as any).businessName || ""}`;
    }
    if (gen.tool === "image-ad-analyzer" && input) {
      return (input as any).imageDescription || "Image analysis";
    }
    if (gen.tool === "ad-analyzer" && input) {
      const txt = (input as any).text || "";
      return txt.length > 60 ? txt.slice(0, 60) + "..." : txt;
    }
    return gen.output.slice(0, 80) + (gen.output.length > 80 ? "..." : "");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                <LibraryBig className="w-5 h-5 text-white" />
              </span>
              My Library
            </h1>
            <p className="text-gray-600">All your generated outputs in one place.</p>
          </div>
          <button
            onClick={() => navigate("/app")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Back to App
          </button>
        </div>

        {/* Tool filter tabs */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow-sm border border-gray-200 w-fit mb-6 flex-wrap">
          <TabButton
            active={activeTool === "all"}
            onClick={() => setActiveTool("all")}
            icon={LibraryBig}
            label="All"
          />
          {ALL_TOOLS.map((tool) => (
            <TabButton
              key={tool}
              active={activeTool === tool}
              onClick={() => setActiveTool(tool)}
              icon={() => TOOL_ICONS[tool]}
              label={TOOL_LABELS[tool]}
            />
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
              <Wand2 className="w-6 h-6 text-slate-600" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">No generations yet</h2>
            <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">
              {activeTool === "all"
                ? "Your outputs from Sales Wizard, FB Ads Targeting, Image Ad Analyzer, and Ad Analyzer will appear here."
                : `Your ${TOOL_LABELS[activeTool]} outputs will appear here.`}
            </p>
            <button
              onClick={() => navigate("/app")}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700"
            >
              <Sparkles className="w-4 h-4" />
              Go generate
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((gen) => (
              <div
                key={gen.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${TOOL_COLORS[gen.tool]} flex items-center justify-center shadow-sm flex-shrink-0`}>
                        {TOOL_ICONS[gen.tool]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-gray-900">{TOOL_LABELS[gen.tool]}</p>
                        <p className="text-xs text-gray-500 truncate">{getToolSummary(gen)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleCopy(gen.output, gen.id)}
                        className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                        title="Copy output"
                      >
                        {copiedId === gen.id ? (
                          <CheckCheck className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(gen.id)}
                        disabled={deletingId === gen.id}
                        className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        {deletingId === gen.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Output preview */}
                  <div className="bg-gray-50 rounded-2xl p-4">
                    <pre className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                      {gen.output.length > 500 ? gen.output.slice(0, 500) + "..." : gen.output}
                    </pre>
                  </div>

                  {/* Timestamp */}
                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(gen.created_at).toLocaleDateString("en-PH", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
        active ? "bg-indigo-600 text-white shadow-sm" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

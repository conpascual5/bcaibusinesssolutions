import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/providers/auth";
import {
  Sparkles,
  ImageIcon,
  Search,
  Trash2,
  Clock,
  AlertTriangle,
  Download,
  FileText,
  Wand2,
  Copy,
  CheckCheck,
  LibraryBig,
} from "lucide-react";

type LibraryTab = "images" | "searches" | "saved-copy";

export default function Library() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<LibraryTab>("images");

  // Library was previously backed by Vercel /api + tRPC (images, searches, saved-copy).
  // Those endpoints are removed/migrated, so this page is now a clean placeholder.
  const emptyState = useMemo(() => {
    if (activeTab === "images") return { title: "No images yet", desc: "Your generated images will appear here." };
    if (activeTab === "searches") return { title: "No searches yet", desc: "Your saved searches will appear here." };
    return { title: "No saved copy yet", desc: "Your saved Sales Wizard outputs will appear here." };
  }, [activeTab]);

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
            <p className="text-gray-600">All your saved outputs in one place.</p>
          </div>
          <button
            onClick={() => navigate("/app")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Back to App
          </button>
        </div>

        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Storage Policy</p>
            <p className="text-sm text-amber-700 mt-1">
              This section is being upgraded for serverless hosting (Supabase-first). Some items may be temporarily unavailable.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl shadow-sm border border-gray-200 w-fit mb-6 flex-wrap">
          <TabButton active={activeTab === "images"} onClick={() => setActiveTab("images")} icon={ImageIcon} label="Images" />
          <TabButton active={activeTab === "searches"} onClick={() => setActiveTab("searches")} icon={Search} label="Searches" />
          <TabButton active={activeTab === "saved-copy"} onClick={() => setActiveTab("saved-copy")} icon={FileText} label="Saved Copy" />
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <p className="text-sm font-bold text-gray-900">{activeTab === "images" ? "Images" : activeTab === "searches" ? "Searches" : "Saved Copy"}</p>
            </div>
          </div>

          <div className="p-10 text-center">
            <div className="mx-auto w-14 h-14 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-4">
              {activeTab === "images" ? (
                <ImageIcon className="w-6 h-6 text-slate-600" />
              ) : activeTab === "searches" ? (
                <Search className="w-6 h-6 text-slate-600" />
              ) : (
                <Wand2 className="w-6 h-6 text-slate-600" />
              )}
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">{emptyState.title}</h2>
            <p className="text-sm text-gray-600 mt-1 max-w-md mx-auto">{emptyState.desc}</p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                onClick={() => navigate("/app")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700"
              >
                <Sparkles className="w-4 h-4" />
                Go generate
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(user?.email ?? "")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50"
              >
                <Copy className="w-4 h-4" />
                Copy my email
              </button>
            </div>
          </div>
        </div>

        {/* keep these icons referenced so the page stays consistent with the app's style system */}
        <div className="hidden">
          <Trash2 />
          <Download />
          <CheckCheck />
        </div>
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

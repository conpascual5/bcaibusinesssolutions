import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/providers/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Package,
  Download,
  ImageIcon,
  Film,
  FileType,
  Calendar,
  HardDrive,
  ExternalLink,
  Crown,
  Star,
  Sparkles,
  Loader2,
  AlertCircle,
  FileDown,
} from "lucide-react";

interface UserAsset {
  id: string;
  file_name: string;
  file_url: string;
  file_type: "image" | "video";
  file_size: number;
  mime_type: string;
  package_type: "pro" | "pro_plus";
  created_at: string;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function MyAssets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [assets, setAssets] = useState<UserAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const loadAssets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("user_assets")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAssets(data || []);
    } catch (err) {
      console.error("Error loading assets:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) loadAssets();
    else setLoading(false);
  }, [user?.id, loadAssets]);

  const handleDownload = async (asset: UserAsset) => {
    setDownloading(asset.id);
    try {
      const response = await fetch(asset.file_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = asset.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
    } finally {
      setDownloading(null);
    }
  };

  const proAssets = assets.filter((a) => a.package_type === "pro");
  const proPlusAssets = assets.filter((a) => a.package_type === "pro_plus");

  const hasProAccess = user?.plan === "pro" || user?.plan === "pro_plus";
  const hasProPlusAccess = user?.plan === "pro_plus";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
                  <Package className="w-5 h-5 text-white" />
                </span>
                My Assets
              </h1>
              <p className="text-gray-600">
                View and download your purchased images and videos.
              </p>
            </div>
            <button
              onClick={() => navigate("/app")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              Back to App
            </button>
          </div>
        </div>

        {/* Plan Info Banner */}
        {!hasProAccess && !hasProPlusAccess && (
          <div className="mb-8 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900">Upgrade to access assets</h3>
              <p className="text-sm text-amber-700 mt-1">
                Upgrade to a paid plan to access your purchased assets.
              </p>
              <button
                onClick={() => navigate("/app/my-plan")}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors shadow-sm"
              >
                <Crown className="w-4 h-4" />
                View Plans
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">No assets yet</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
              {hasProAccess || hasProPlusAccess
                ? "Your purchased images and videos will appear here once they've been added by our team."
                : "Upgrade to a paid plan to get access to your assets."}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Pro Assets (30 Images) */}
            {proAssets.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
                    <Crown className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Pro Package — Product Images
                    </h2>
                    <p className="text-xs text-gray-500">
                      {proAssets.length} of 30 images delivered
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {proAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onDownload={handleDownload}
                      downloading={downloading}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Pro Plus Assets (1 UGC/Cinematic) */}
            {proPlusAssets.length > 0 && (
              <section>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
                    <Film className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Pro Plus — UGC / Cinematic Ad
                    </h2>
                    <p className="text-xs text-gray-500">
                      {proPlusAssets.length} of 1 video delivered
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {proPlusAssets.map((asset) => (
                    <AssetCard
                      key={asset.id}
                      asset={asset}
                      onDownload={handleDownload}
                      downloading={downloading}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AssetCard({
  asset,
  onDownload,
  downloading,
}: {
  asset: UserAsset;
  onDownload: (asset: UserAsset) => void;
  downloading: string | null;
}) {
  const isVideo = asset.file_type === "video";
  const isDownloading = downloading === asset.id;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all overflow-hidden">
      {/* Preview */}
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {isVideo ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            <video
              src={asset.file_url}
              className="absolute inset-0 w-full h-full object-cover"
              controls
              preload="metadata"
            />
          </div>
        ) : (
          <img
            src={asset.file_url}
            alt={asset.file_name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}

        {/* Type badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur rounded-lg text-[10px] font-bold text-white">
            {isVideo ? (
              <Film className="w-3 h-3" />
            ) : (
              <ImageIcon className="w-3 h-3" />
            )}
            {isVideo ? "Video" : "Image"}
          </span>
        </div>

        {/* Package badge */}
        <div className="absolute top-2 right-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-white backdrop-blur ${
              asset.package_type === "pro_plus"
                ? "bg-rose-500/80"
                : "bg-amber-500/80"
            }`}
          >
            {asset.package_type === "pro_plus" ? (
              <Film className="w-3 h-3" />
            ) : (
              <Crown className="w-3 h-3" />
            )}
            {asset.package_type === "pro_plus" ? "Pro Plus" : "Pro"}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <p className="text-xs font-medium text-gray-900 truncate" title={asset.file_name}>
          {asset.file_name}
        </p>
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(asset.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {formatFileSize(asset.file_size)}
          </span>
        </div>
        <button
          onClick={() => onDownload(asset)}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 border border-gray-200 hover:border-indigo-200 text-xs font-bold transition-all disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Download className="w-3.5 h-3.5" />
          )}
          {isDownloading ? "Downloading..." : "Download"}
        </button>
      </div>
    </div>
  );
}

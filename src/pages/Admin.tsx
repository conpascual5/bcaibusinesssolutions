import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/providers/auth";
import AdminSupportInbox from "@/components/AdminSupportInbox";
import {
  Users,
  Settings,
  Shield,
  CheckCircle,
  XCircle,
  Star,
  Crown,
  Sparkles,
  X,
  Clock,
  History,
  Key,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  Package,
  Upload,
  ImageIcon,
  Film,
  Trash2,
  Loader2,
  Download,
  ExternalLink,
} from "lucide-react";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  plan: "free" | "pro" | "vip";
  is_active: boolean;
  activated_at: string | null;
  created_at: string;
};

type PlanHistoryRow = {
  id: number;
  user_id: string;
  plan: string;
  previous_plan: string | null;
  set_by: string | null;
  notes: string | null;
  created_at: string;
};

function ApiKeySettings() {
  const [aiKey, setAiKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [deepseekKey, setDeepseekKey] = useState("");
  const [showAiKey, setShowAiKey] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [showDeepseek, setShowDeepseek] = useState(false);
  const [aiSaved, setAiSaved] = useState(false);
  const [openaiSaved, setOpenaiSaved] = useState(false);
  const [deepseekSaved, setDeepseekSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [ai, open, ds] = await Promise.all([
        supabase.from("settings").select("value").eq("key", "ai_api_key").maybeSingle(),
        supabase.from("settings").select("value").eq("key", "openai_api_key").maybeSingle(),
        supabase.from("settings").select("value").eq("key", "deepseek_api_key").maybeSingle(),
      ]);
      if (cancelled) return;
      setAiKey((ai.data as any)?.value ?? "");
      setOpenaiKey((open.data as any)?.value ?? "");
      setDeepseekKey((ds.data as any)?.value ?? "");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const upsertKey = async (key: string, value: string) => {
    await supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() } as any, { onConflict: "key" });
  };

  const handleSaveAiKey = async () => {
    if (!aiKey.trim()) return;
    await upsertKey("ai_api_key", aiKey.trim());
    setAiSaved(true);
    setTimeout(() => setAiSaved(false), 1500);
  };

  const handleSaveOpenai = async () => {
    if (!openaiKey.trim()) return;
    await upsertKey("openai_api_key", openaiKey.trim());
    setOpenaiSaved(true);
    setTimeout(() => setOpenaiSaved(false), 1500);
  };

  const handleSaveDeepseek = async () => {
    if (!deepseekKey.trim()) return;
    await upsertKey("deepseek_api_key", deepseekKey.trim());
    setDeepseekSaved(true);
    setTimeout(() => setDeepseekSaved(false), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5 mb-1">
          <Key className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
          API Keys
        </h2>
        <p className="text-sm text-muted-foreground mb-6">Configure API keys.</p>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading keys...</div>
        ) : (
          <>
            <div className="mb-6 p-4 rounded-xl border border-border bg-accent/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <h3 className="text-sm font-semibold text-foreground">AI API Key</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Primary</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showAiKey ? "text" : "password"}
                    value={aiKey}
                    onChange={(e) => setAiKey(e.target.value)}
                    placeholder="Enter key"
                    className="w-full px-3 py-2 pr-10 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAiKey(!showAiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleSaveAiKey}
                  disabled={!aiKey.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {aiSaved ? <Check className="w-4 h-4" /> : null}
                  {aiSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 rounded-xl border border-border bg-accent/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">OpenAI API Key</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Image Analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showOpenai ? "text" : "password"}
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="Enter key"
                    className="w-full px-3 py-2 pr-10 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowOpenai(!showOpenai)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showOpenai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleSaveOpenai}
                  disabled={!openaiKey.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {openaiSaved ? <Check className="w-4 h-4" /> : null}
                  {openaiSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-border bg-accent/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <h3 className="text-sm font-semibold text-foreground">Deepseek API Key</h3>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Sales Wizard</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showDeepseek ? "text" : "password"}
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    placeholder="Enter key"
                    className="w-full px-3 py-2 pr-10 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeepseek(!showDeepseek)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showDeepseek ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button
                  onClick={handleSaveDeepseek}
                  disabled={!deepseekKey.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {deepseekSaved ? <Check className="w-4 h-4" /> : null}
                  {deepseekSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            <div className="mt-6 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">Keys are stored in the database.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function AdminAssetManager() {
  const [users, setUsers] = useState<{ id: string; full_name: string | null; email: string | null }[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [packageType, setPackageType] = useState<"pro" | "pro_plus">("pro");
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name", { ascending: true });
      setUsers(data || []);
    })();
  }, []);

  const loadUserAssets = useCallback(async (userId: string) => {
    if (!userId) return;
    setLoadingAssets(true);
    const { data } = await supabase
      .from("user_assets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    setAssets(data || []);
    setLoadingAssets(false);
  }, []);

  useEffect(() => {
    if (selectedUserId) loadUserAssets(selectedUserId);
    else setAssets([]);
  }, [selectedUserId, loadUserAssets]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!selectedUserId || files.length === 0) return;
    setUploading(true);
    setErrors([]);
    setUploaded([]);

    const uploadedNames: string[] = [];
    const errorMessages: string[] = [];

    for (const file of files) {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${selectedUserId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const fileType = file.type.startsWith("video/") ? "video" : "image";

      // Upload to storage (private bucket, user's folder)
      const { error: uploadError } = await supabase.storage
        .from("user_assets")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        errorMessages.push(`${file.name}: ${uploadError.message}`);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("user_assets")
        .getPublicUrl(fileName);

      // Insert record in user_assets table
      const { error: dbError } = await supabase.from("user_assets").insert({
        user_id: selectedUserId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: fileType,
        file_size: file.size,
        mime_type: file.type,
        package_type: packageType,
      });

      if (dbError) {
        errorMessages.push(`${file.name}: ${dbError.message}`);
      } else {
        uploadedNames.push(file.name);
      }
    }

    setUploaded(uploadedNames);
    setErrors(errorMessages);
    setFiles([]);
    setUploading(false);
    if (selectedUserId) loadUserAssets(selectedUserId);
  };

  const handleDelete = async (assetId: string, fileName: string) => {
    setDeleting(assetId);
    // Delete from storage
    const storagePath = `${selectedUserId}/${fileName.split("/").pop()}`;
    await supabase.storage.from("user_assets").remove([storagePath]);
    // Delete from DB
    await supabase.from("user_assets").delete().eq("id", assetId);
    setDeleting(null);
    if (selectedUserId) loadUserAssets(selectedUserId);
  };

  return (
    <div className="space-y-6">
      {/* Select User */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5 mb-4">
          <Package className="w-5 h-5 text-emerald-500 stroke-[1.5]" />
          Upload Assets for a User
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Select User</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">— Choose a user —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name || u.email || u.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Package Type</label>
            <select
              value={packageType}
              onChange={(e) => setPackageType(e.target.value as "pro" | "pro_plus")}
              className="w-full px-3 py-2.5 border border-border rounded-xl text-sm bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="pro">Pro — 30 Product Images</option>
              <option value="pro_plus">Pro Plus — 1 UGC / Cinematic Ad</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!selectedUserId}
              className="w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Select Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="mb-4 p-4 bg-accent/30 rounded-xl border border-border">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-foreground">{files.length} file(s) selected</span>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="w-4 h-4" /> Upload to User</>
                )}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border border-border text-xs">
                  {file.type.startsWith("video/") ? <Film className="w-3.5 h-3.5 text-rose-500" /> : <ImageIcon className="w-3.5 h-3.5 text-amber-500" />}
                  <span className="text-foreground truncate max-w-[150px]">{file.name}</span>
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Results */}
        {uploaded.length > 0 && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-emerald-800">{uploaded.length} file(s) uploaded</p>
              <ul className="mt-0.5 text-[11px] text-emerald-700">{uploaded.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          </div>
        )}

        {errors.length > 0 && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-red-800">Errors</p>
              <ul className="mt-0.5 text-[11px] text-red-700">{errors.map((n, i) => <li key={i}>{n}</li>)}</ul>
            </div>
          </div>
        )}
      </div>

      {/* User's Assets */}
      {selectedUserId && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
              <Package className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
              User's Assets
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {assets.length} file(s)
              </span>
            </h2>
            <button
              onClick={() => loadUserAssets(selectedUserId)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
            >
              Refresh
            </button>
          </div>

          {loadingAssets ? (
            <div className="text-sm text-muted-foreground py-8 text-center">Loading assets...</div>
          ) : assets.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-xl">
              No assets for this user yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {assets.map((asset: any) => (
                <div key={asset.id} className="group relative aspect-[4/3] rounded-xl overflow-hidden bg-muted border border-border">
                  {asset.file_type === "video" ? (
                    <video src={asset.file_url} className="w-full h-full object-cover" preload="metadata" />
                  ) : (
                    <img src={asset.file_url} alt={asset.file_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  <div className="absolute top-1.5 left-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${asset.package_type === "pro_plus" ? "bg-rose-500" : "bg-amber-500"}`}>
                      {asset.package_type === "pro_plus" ? "Pro+" : "Pro"}
                    </span>
                  </div>
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={asset.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center text-gray-700 hover:bg-white"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDelete(asset.id, asset.file_url)}
                      disabled={deleting === asset.id}
                      className="w-7 h-7 bg-red-500/80 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                    >
                      {deleting === asset.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                    <p className="text-[9px] text-white truncate font-medium">{asset.file_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const PLAN_OPTIONS = [
  { value: "free", label: "Free", icon: Sparkles },
  { value: "pro", label: "Pro", icon: Crown },
  { value: "pro_plus", label: "Pro Plus", icon: Crown },
  { value: "vip", label: "VIP", icon: Star },
] as const;

export default function Admin() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [activeSection, setActiveSection] = useState<"users" | "assets" | "support" | "settings">("users");
  const [historyUserId, setHistoryUserId] = useState<string | null>(null);

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [users, setUsers] = useState<ProfileRow[]>([]);

  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadUsers = async (mode: "reset" | "more") => {
    setUsersError(null);
    setLoadingUsers(true);

    const limit = 50;
    const nextCursor = mode === "more" ? cursor : null;

    let q = supabase
      .from("profiles")
      .select("id,email,full_name,is_admin,plan,is_active,activated_at,created_at")
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (nextCursor) {
      q = q.lt("id", nextCursor);
    }

    const { data, error } = await q;

    if (error) {
      setUsersError(error.message);
      setLoadingUsers(false);
      return;
    }

    const rows = (data ?? []) as ProfileRow[];
    const more = rows.length > limit;
    const sliced = more ? rows.slice(0, limit) : rows;
    const newCursor = sliced.length ? sliced[sliced.length - 1].id : null;

    setHasMore(more);
    setCursor(newCursor);

    setUsers((prev) => (mode === "reset" ? sliced : [...prev, ...sliced]));
    setLoadingUsers(false);
  };

  const [planHistory, setPlanHistory] = useState<PlanHistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async (userId: string) => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from("plan_history")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error) setPlanHistory((data ?? []) as PlanHistoryRow[]);
    setLoadingHistory(false);
  };

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadUsers("reset");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.isAdmin]);

  useEffect(() => {
    if (historyUserId) loadHistory(historyUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyUserId]);

  const planBadge = useMemo(() => {
    return (plan: string) => {
      if (plan === "vip") return "bg-purple-50 text-purple-700 border-purple-200";
      if (plan === "pro") return "bg-amber-50 text-amber-700 border-amber-200";
      if (plan === "pro_plus") return "bg-rose-50 text-rose-700 border-rose-200";
      return "bg-slate-100 text-slate-700 border-slate-200";
    };
  }, []);

  const totalUsers = users.length;

  const setPlan = async (userId: string, plan: "free" | "pro" | "pro_plus" | "vip") => {
    const { data: current } = await supabase.from("profiles").select("plan").eq("id", userId).maybeSingle();
    await supabase
      .from("profiles")
      .update({ plan, activated_at: new Date().toISOString(), is_active: true })
      .eq("id", userId);

    await supabase.from("plan_history").insert({
      user_id: userId,
      plan,
      previous_plan: (current as any)?.plan ?? null,
      set_by: user?.email ?? "Admin",
      notes: "",
      created_at: new Date().toISOString(),
    } as any);

    await loadUsers("reset");
  };

  const toggleActive = async (userId: string, isActive: boolean) => {
    await supabase
      .from("profiles")
      .update({ is_active: isActive, activated_at: isActive ? new Date().toISOString() : null })
      .eq("id", userId);
    await loadUsers("reset");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">Admin access required.</p>
          <button onClick={() => navigate("/app")} className="px-6 py-2.5 bg-muted text-muted-foreground rounded-xl text-sm font-semibold">
            Back to App
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage users and plans.</p>
        </div>

        <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl border border-border w-fit mb-8">
          <button
            onClick={() => setActiveSection("users")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === "users" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Users className="w-4 h-4 stroke-[1.5]" />
            Users
          </button>
          <button
            onClick={() => setActiveSection("assets")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === "assets" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Package className="w-4 h-4 stroke-[1.5]" />
            Assets
          </button>
          <button
            onClick={() => setActiveSection("support")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === "support" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <MessageSquare className="w-4 h-4 stroke-[1.5]" />
            Support
          </button>
          <button
            onClick={() => setActiveSection("settings")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeSection === "settings" ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Settings className="w-4 h-4 stroke-[1.5]" />
            Settings
          </button>
        </div>

        {activeSection === "users" && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2.5">
                <Users className="w-5 h-5 text-indigo-500 stroke-[1.5]" />
                Registered Users
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground font-medium">{totalUsers} loaded</span>
                <button
                  onClick={() => loadUsers("reset")}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100"
                >
                  Refresh
                </button>
              </div>
            </div>

            {usersError && <div className="p-4 border-b border-border bg-red-50 text-red-700 text-sm">{usersError}</div>}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-accent/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{u.full_name || "—"}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{u.email ?? ""}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            u.is_admin ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.is_admin ? <Shield className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                          {u.is_admin ? "Admin" : "User"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative">
                          <select
                            value={u.plan || "free"}
                            onChange={(e) => setPlan(u.id, e.target.value as any)}
                            className={`appearance-none px-3 py-1.5 pr-8 rounded-lg text-xs font-semibold border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-ring ${planBadge(u.plan)}`}
                          >
                            {PLAN_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                            <svg className="w-3 h-3 text-current opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            u.is_active
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {u.is_active ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActive(u.id, !u.is_active)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                              u.is_active
                                ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:hover:bg-emerald-900/30"
                            }`}
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() => setHistoryUserId(u.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 flex items-center gap-1.5"
                          >
                            <History className="w-3 h-3" />
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {loadingUsers && (
                    <tr>
                      <td colSpan={6} className="px-6 py-6 text-sm text-muted-foreground">
                        Loading users...
                      </td>
                    </tr>
                  )}

                  {!loadingUsers && users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted-foreground">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-xs text-muted-foreground">Showing {users.length} users</div>
              <button
                disabled={!hasMore || loadingUsers}
                onClick={() => loadUsers("more")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-accent hover:bg-accent/80 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Load more
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {historyUserId && (
              <div className="fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/30" onClick={() => setHistoryUserId(null)} />
                <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl border-l border-slate-200">
                  <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-semibold text-slate-900">Plan History</h3>
                    </div>
                    <button className="p-2 rounded-xl hover:bg-slate-100" onClick={() => setHistoryUserId(null)} aria-label="Close">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    {loadingHistory ? (
                      <div className="text-sm text-slate-500">Loading history…</div>
                    ) : (
                      (planHistory ?? []).map((h) => (
                        <div key={h.id} className="rounded-2xl border border-slate-200 p-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-slate-900">{h.plan}</div>
                            <div className="text-xs text-slate-500">{new Date(h.created_at).toLocaleString()}</div>
                          </div>
                          <div className="text-xs text-slate-600 mt-1">Previous: {h.previous_plan || "—"}</div>
                          <div className="text-xs text-slate-600">Set by: {h.set_by || "—"}</div>
                        </div>
                      ))
                    )}
                    {!loadingHistory && (planHistory?.length ?? 0) === 0 && <div className="text-sm text-slate-500">No plan changes yet.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === "assets" && <AdminAssetManager />}

        {activeSection === "support" && <AdminSupportInbox />}

        {activeSection === "settings" && <ApiKeySettings />}
      </div>
    </div>
  );
}

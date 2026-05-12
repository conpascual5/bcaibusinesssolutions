export function getSupabaseAccessToken(): string | null {
  // Supabase stores the session as JSON in a per-project localStorage key.
  // We read it directly to avoid async calls in tight UI flows.
  const raw = localStorage.getItem("sb-dkatgjtvhitknghvaxxn-auth-token");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.access_token ?? null;
  } catch {
    return null;
  }
}

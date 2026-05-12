export const EDGE_BASE = "https://dkatgjtvhitknghvaxxn.supabase.co/functions/v1";

export const EDGE_FUNCTIONS = {
  chat: `${EDGE_BASE}/deepseek-chat`,
  imageAdAnalyzer: `${EDGE_BASE}/image-ad-analyzer`,
} as const;

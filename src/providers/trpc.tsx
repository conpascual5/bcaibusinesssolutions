import type { ReactNode } from "react";

// The app previously used a Vercel-hosted tRPC API.
// We are moving AI + data access to Supabase (client + Edge Functions),
// so this provider is now a no-op wrapper to avoid touching the rest of the tree at once.
export function TRPCProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

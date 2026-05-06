// Auth utilities — kept for backward compatibility
// All auth is now handled by Supabase Auth

export async function hashPassword(password: string): Promise<string> {
  // No longer used — Supabase Auth handles password hashing
  return password;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // No longer used — Supabase Auth handles password verification
  return false;
}

// Legacy JWT functions — kept for backward compatibility
export function signJWT(payload: { userId: number; email: string; isAdmin: boolean }): string {
  return "";
}

export function verifyJWT(token: string): { userId: number; email: string; isAdmin: boolean } | null {
  return null;
}

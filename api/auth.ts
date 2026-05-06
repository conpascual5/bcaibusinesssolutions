import { z } from "zod";
import { createRouter, publicQuery } from "./middleware.js";
import { getSupabaseClient } from "./queries/supabase-client.js";
import { hashPassword, verifyPassword, signJWT } from "./auth-utils.js";

// Timeout for DB connection — must be under Vercel's 10s limit
const DB_TIMEOUT_MS = 8000;

async function queryWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Database connection timed out. The server may still be starting up — please try again.")), DB_TIMEOUT_MS)
    ),
  ]);
}

// Type for user rows from Supabase
interface UserRow {
  id: number;
  email: string;
  name: string;
  password_hash: string;
  is_active: number;
  is_admin: number;
}

export const authRouter = createRouter({
  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const supabase = getSupabaseClient();
        const { data: users, error } = await queryWithTimeout(async () => {
          const res = await supabase
            .from("users")
            .select("*")
            .eq("email", input.email)
            .limit(1);
          return res as any;
        });
        if (error) {
          console.error("[auth.login] query error:", error.message);
          throw new Error("Database error. Please try again.");
        }
        const user = (users as UserRow[])?.[0];
        if (!user) throw new Error("Invalid credentials");
        if (!user.is_active) throw new Error("Account deactivated");
        const valid = await verifyPassword(input.password, user.password_hash);
        if (!valid) throw new Error("Invalid credentials");
        
        const token = signJWT({ userId: user.id, email: user.email, isAdmin: !!user.is_admin });
        return { token, user: { id: user.id, email: user.email, name: user.name, isAdmin: !!user.is_admin } };
      } catch (err: any) {
        console.error("[auth.login] error:", err?.message ?? err);
        throw err;
      }
    }),

  register: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        isExistingCustomer: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const supabase = getSupabaseClient();

        // Check if email already exists
        const { data: existing } = await queryWithTimeout(async () => {
          const res = await supabase
            .from("users")
            .select("id")
            .eq("email", input.email)
            .limit(1);
          return res as any;
        });
        if ((existing as any[])?.length) throw new Error("Email already registered");
        
        const passwordHash = await hashPassword(input.password);

        // Check if this is the first user — make them admin
        const { count } = await queryWithTimeout(async () => {
          const res = await supabase
            .from("users")
            .select("*", { count: "exact", head: true });
          return res as any;
        });
        const isAdmin = count === 0 ? 1 : 0;

        // Insert the user
        const { data: newUsers, error: insertError } = await queryWithTimeout(async () => {
          const res = await supabase
            .from("users")
            .insert({
              email: input.email,
              password_hash: passwordHash,
              name: input.name,
              is_active: 1,
              is_admin: isAdmin,
            } as any)
            .select();
          return res as any;
        });
        if (insertError) {
          console.error("[auth.register] insert error:", insertError.message);
          throw new Error("Failed to create account. Please try again.");
        }
        const user = (newUsers as UserRow[])?.[0];
        if (!user) throw new Error("Failed to create account.");

        // If existing customer, auto-create VIP subscription
        if (input.isExistingCustomer) {
          try {
            await (supabase.from("subscriptions") as any).insert({
              user_id: user.id,
              plan: "vip",
              status: "active",
            });
            console.log(`[auth.register] VIP subscription created for user ${user.id} (${input.email})`);
          } catch (subErr: any) {
            console.error("[auth.register] Failed to create VIP subscription:", subErr?.message ?? subErr);
          }
        }
        
        const token = signJWT({ userId: user.id, email: user.email, isAdmin: !!user.is_admin });
        return { token, user: { id: user.id, email: user.email, name: user.name, isAdmin: !!user.is_admin } };
      } catch (err: any) {
        console.error("[auth.register] error:", err?.message ?? err);
        throw err;
      }
    }),

  forgotPassword: publicQuery
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const supabase = getSupabaseClient();
        const { data: users } = await queryWithTimeout(async () => {
          const res = await supabase
            .from("users")
            .select("id, email")
            .eq("email", input.email)
            .limit(1);
          return res as any;
        });
        const user = (users as { id: number; email: string }[])?.[0];
        if (!user) {
          return { success: true, message: "If that email is registered, a password reset link has been sent." };
        }
        const resetToken = btoa(`${user.id}:${user.email}:${Date.now()}`);
        console.log(`[forgot-password] Reset token for ${input.email}: ${resetToken}`);
        return { success: true, message: "If that email is registered, a password reset link has been sent." };
      } catch (err: any) {
        console.error("[auth.forgotPassword] error:", err?.message ?? err);
        throw err;
      }
    }),

  me: publicQuery.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    try {
      const supabase = getSupabaseClient();
      const { data: users } = await queryWithTimeout(async () => {
        const res = await supabase
          .from("users")
          .select("id, email, name, is_admin, is_active")
          .eq("id", ctx.user!.userId)
          .limit(1);
        return res as any;
      });
      const user = (users as UserRow[])?.[0];
      if (!user || !user.is_active) return null;
      return { id: user.id, email: user.email, name: user.name, isAdmin: !!user.is_admin };
    } catch (err: any) {
      console.error("[auth.me] error:", err?.message ?? err);
      return null;
    }
  }),
});

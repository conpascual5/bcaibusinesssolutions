import { z } from "zod";
import { createRouter, publicQuery } from "./middleware.js";
import { getDbReady } from "./queries/connection.js";
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
        const db = await queryWithTimeout(async () => {
          return getDbReady();
        }) as any;

        const user = db.prepare(
          "SELECT id, email, name, password_hash, is_active, is_admin FROM users WHERE email = ?"
        ).get(input.email);

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
        const db = await queryWithTimeout(async () => {
          return getDbReady();
        }) as any;

        // Check if email already exists
        const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(input.email);
        if (existing) throw new Error("Email already registered");
        
        const passwordHash = await hashPassword(input.password);

        // Check if this is the first user — make them admin
        const countResult = db.prepare("SELECT COUNT(*) as cnt FROM users").get();
        const isAdmin = (countResult?.cnt || 0) === 0 ? 1 : 0;

        // Insert the user
        const stmt = db.prepare(
          "INSERT INTO users (email, password_hash, name, is_active, is_admin) VALUES (?, ?, ?, 1, ?)"
        );
        const result = stmt.run(input.email, passwordHash, input.name, isAdmin);
        const { saveDb } = await import("./queries/connection.js");
        await saveDb();

        const userId = Number(result.lastInsertRowid);

        // If existing customer, auto-create VIP subscription
        if (input.isExistingCustomer) {
          try {
            db.prepare(
              "INSERT INTO subscriptions (user_id, plan, status) VALUES (?, 'vip', 'active')"
            ).run(userId);
            await saveDb();
            console.log(`[auth.register] VIP subscription created for user ${userId} (${input.email})`);
          } catch (subErr: any) {
            console.error("[auth.register] Failed to create VIP subscription:", subErr?.message ?? subErr);
          }
        }
        
        const token = signJWT({ userId: userId, email: input.email, isAdmin: !!isAdmin });
        return { token, user: { id: userId, email: input.email, name: input.name, isAdmin: !!isAdmin } };
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
        const db = await queryWithTimeout(async () => {
          return getDbReady();
        }) as any;

        const user = db.prepare("SELECT id, email FROM users WHERE email = ?").get(input.email);
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
      const db = await getDbReady() as any;
      const user = db.prepare(
        "SELECT id, email, name, is_admin, is_active FROM users WHERE id = ?"
      ).get(ctx.user!.userId);
      if (!user || !user.is_active) return null;
      return { id: user.id, email: user.email, name: user.name, isAdmin: !!user.is_admin };
    } catch (err: any) {
      console.error("[auth.me] error:", err?.message ?? err);
      return null;
    }
  }),
});

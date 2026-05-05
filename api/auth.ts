import { z } from "zod";
import { createRouter, publicQuery } from "./middleware.js";
import { getDbReady } from "./queries/connection.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signJWT } from "./auth-utils.js";

// Timeout for DB connection — must be under Vercel's 10s limit
const DB_TIMEOUT_MS = 8000;

async function getDbWithTimeout(): Promise<ReturnType<typeof getDbReady>> {
  return Promise.race([
    getDbReady(),
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
      let db;
      try {
        db = await getDbWithTimeout();
      } catch (err: any) {
        console.error("[auth.login] getDbReady failed:", err?.message ?? err);
        throw new Error("Database connection failed. Please try again later.");
      }
      try {
        const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (!user) throw new Error("Invalid credentials");
        if (!user.isActive) throw new Error("Account deactivated");
        const valid = await verifyPassword(input.password, user.passwordHash);
        if (!valid) throw new Error("Invalid credentials");
        
        const token = signJWT({ userId: user.id, email: user.email, isAdmin: user.isAdmin });
        return { token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } };
      } catch (err: any) {
        console.error("[auth.login] query/verify error:", err?.message ?? err);
        throw err;
      }
    }),

  register: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      let db;
      try {
        db = await getDbWithTimeout();
      } catch (err: any) {
        console.error("[auth.register] getDbReady failed:", err?.message ?? err);
        throw new Error("Database connection failed. Please try again later.");
      }
      try {
        // Check if email already exists
        const [existing] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing) throw new Error("Email already registered");
        
        const passwordHash = await hashPassword(input.password);
        const [user] = await db.insert(users).values({
          email: input.email,
          passwordHash,
          name: input.name,
          isActive: true,
          isAdmin: false,
        }).returning();
        
        const token = signJWT({ userId: user.id, email: user.email, isAdmin: user.isAdmin });
        return { token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } };
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
      let db;
      try {
        db = await getDbWithTimeout();
      } catch (err: any) {
        console.error("[auth.forgotPassword] getDbReady failed:", err?.message ?? err);
        throw new Error("Database connection failed. Please try again later.");
      }
      try {
        const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (!user) {
          // Don't reveal whether email exists — return success either way
          return { success: true, message: "If that email is registered, a password reset link has been sent." };
        }
        // Generate a simple reset token (in production, store this in DB with expiry)
        const resetToken = btoa(`${user.id}:${user.email}:${Date.now()}`);
        // In a real app, you'd email this. For now, we log it and return it.
        console.log(`[forgot-password] Reset token for ${input.email}: ${resetToken}`);
        return { success: true, message: "If that email is registered, a password reset link has been sent." };
      } catch (err: any) {
        console.error("[auth.forgotPassword] query error:", err?.message ?? err);
        throw err;
      }
    }),

  me: publicQuery.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    let db;
    try {
      db = await getDbWithTimeout();
    } catch (err: any) {
      console.error("[auth.me] getDbReady failed:", err?.message ?? err);
      return null;
    }
    try {
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.userId)).limit(1);
      if (!user || !user.isActive) return null;
      return { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin };
    } catch (err: any) {
      console.error("[auth.me] query error:", err?.message ?? err);
      return null;
    }
  }),
});

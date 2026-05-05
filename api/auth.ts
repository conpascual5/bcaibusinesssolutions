import { z } from "zod";
import { createRouter, publicQuery } from "./middleware.js";
import { getDbReady } from "./queries/connection.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, signJWT } from "./auth-utils.js";

export const authRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        email: z.string().email().max(255),
        password: z.string().min(6).max(100),
        name: z.string().min(1).max(100),
      })
    )
    .mutation(async ({ input }) => {
      let db;
      try {
        db = await Promise.race([
          getDbReady(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Database connection timed out")), 15000)
          ),
        ]);
      } catch (err: any) {
        console.error("[auth.register] getDbReady failed:", err?.message ?? err);
        console.error("[auth.register] stack:", err?.stack ?? "(no stack)");
        throw new Error("Database connection failed. Please try again later.");
      }
      try {
        const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing.length > 0) {
          throw new Error("Email already registered");
        }
        const passwordHash = await hashPassword(input.password);
        const result = await db.insert(users).values({
          email: input.email,
          passwordHash,
          name: input.name,
          isActive: true,
          isAdmin: false,
        }).returning({ id: users.id });
        const userId = result[0].id;
        
        const token = signJWT({ userId, email: input.email, isAdmin: false });
        return { token, user: { id: userId, email: input.email, name: input.name, isAdmin: false } };
      } catch (err: any) {
        console.error("[auth.register] query error:", err?.message ?? err);
        console.error("[auth.register] stack:", err?.stack ?? "(no stack)");
        throw err;
      }
    }),

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
        // Add a timeout to getDbReady so we don't hang forever
        db = await Promise.race([
          getDbReady(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Database connection timed out")), 15000)
          ),
        ]);
      } catch (err: any) {
        console.error("[auth.login] getDbReady failed:", err?.message ?? err);
        console.error("[auth.login] stack:", err?.stack ?? "(no stack)");
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
        console.error("[auth.login] stack:", err?.stack ?? "(no stack)");
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
        db = await Promise.race([
          getDbReady(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Database connection timed out")), 15000)
          ),
        ]);
      } catch (err: any) {
        console.error("[auth.forgotPassword] getDbReady failed:", err?.message ?? err);
        console.error("[auth.forgotPassword] stack:", err?.stack ?? "(no stack)");
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
        console.error("[auth.forgotPassword] stack:", err?.stack ?? "(no stack)");
        throw err;
      }
    }),

  me: publicQuery.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    let db;
    try {
      db = await Promise.race([
        getDbReady(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Database connection timed out")), 15000)
        ),
      ]);
    } catch (err: any) {
      console.error("[auth.me] getDbReady failed:", err?.message ?? err);
      console.error("[auth.me] stack:", err?.stack ?? "(no stack)");
      return null;
    }
    try {
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user.userId)).limit(1);
      if (!user || !user.isActive) return null;
      return { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin };
    } catch (err: any) {
      console.error("[auth.me] query error:", err?.message ?? err);
      console.error("[auth.me] stack:", err?.stack ?? "(no stack)");
      return null;
    }
  }),
});

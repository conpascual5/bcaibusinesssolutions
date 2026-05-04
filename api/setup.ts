import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware.js";
import { getDbReady } from "./queries/connection.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth-utils.js";

export const setupRouter = createRouter({
  createAdmin: publicQuery
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
        db = await getDbReady();
      } catch (err: any) {
        console.error("[setup.createAdmin] getDbReady failed:", err?.message ?? err);
        console.error("[setup.createAdmin] stack:", err?.stack ?? "(no stack)");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed. Please try again later." });
      }
      try {
        const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (existing.length > 0) {
          throw new TRPCError({ code: "CONFLICT", message: "User already exists" });
        }
        const passwordHash = await hashPassword(input.password);
        const result = await db.insert(users).values({
          email: input.email,
          passwordHash,
          name: input.name,
          isActive: true,
          isAdmin: true,
        }).returning({ id: users.id });
        const user = result[0];
        return { id: user.id, email: input.email, name: input.name, isAdmin: true };
      } catch (err: any) {
        console.error("[setup.createAdmin] query error:", err?.message ?? err);
        console.error("[setup.createAdmin] stack:", err?.stack ?? "(no stack)");
        throw err;
      }
    }),

  checkAdminExists: publicQuery.query(async () => {
    let db;
    try {
      db = await getDbReady();
    } catch (err: any) {
      console.error("[setup.checkAdminExists] getDbReady failed:", err?.message ?? err);
      console.error("[setup.checkAdminExists] stack:", err?.stack ?? "(no stack)");
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed. Please try again later." });
    }
    try {
      const [admin] = await db.select().from(users).where(eq(users.isAdmin, true)).limit(1);
      return { exists: !!admin };
    } catch (err: any) {
      console.error("[setup.checkAdminExists] query error:", err?.message ?? err);
      console.error("[setup.checkAdminExists] stack:", err?.stack ?? "(no stack)");
      throw err;
    }
  }),

  reactivateAdmin: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      let db;
      try {
        db = await getDbReady();
      } catch (err: any) {
        console.error("[setup.reactivateAdmin] getDbReady failed:", err?.message ?? err);
        console.error("[setup.reactivateAdmin] stack:", err?.stack ?? "(no stack)");
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed. Please try again later." });
      }
      try {
        const [admin] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
        if (!admin) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        await db.update(users).set({ isActive: true }).where(eq(users.email, input.email));
        return { success: true, message: "Admin account reactivated" };
      } catch (err: any) {
        console.error("[setup.reactivateAdmin] query error:", err?.message ?? err);
        console.error("[setup.reactivateAdmin] stack:", err?.stack ?? "(no stack)");
        throw err;
      }
    }),
});

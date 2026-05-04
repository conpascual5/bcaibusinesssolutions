import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
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
      const db = getDb();
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
    }),

  checkAdminExists: publicQuery.query(async () => {
    const db = getDb();
    const [admin] = await db.select().from(users).where(eq(users.isAdmin, true)).limit(1);
    return { exists: !!admin };
  }),

  reactivateAdmin: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [admin] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (!admin) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      await db.update(users).set({ isActive: true }).where(eq(users.email, input.email));
      return { success: true, message: "Admin account reactivated" };
    }),
});

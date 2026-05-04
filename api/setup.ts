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
      const [user] = await db.insert(users).values({
        email: input.email,
        passwordHash,
        name: input.name,
        isActive: true,
        isAdmin: true,
      }).$returningId();
      return { id: user.id, email: input.email, name: input.name, isAdmin: true };
    }),

  checkAdminExists: publicQuery.query(async () => {
    const db = getDb();
    const [admin] = await db.select().from(users).where(eq(users.isAdmin, true)).limit(1);
    return { exists: !!admin };
  }),
});

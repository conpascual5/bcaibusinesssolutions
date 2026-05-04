import { z } from "zod";
import { createRouter, publicQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
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
      const db = getDb();
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
    }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (!user) throw new Error("Invalid credentials");
      if (!user.isActive) throw new Error("Account deactivated");
      const valid = await verifyPassword(input.password, user.passwordHash);
      if (!valid) throw new Error("Invalid credentials");
      
      const token = signJWT({ userId: user.id, email: user.email, isAdmin: user.isAdmin });
      return { token, user: { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin } };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    if (!ctx.user) return null;
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.userId)).limit(1);
    if (!user || !user.isActive) return null;
    return { id: user.id, email: user.email, name: user.name, isAdmin: user.isAdmin };
  }),
});

import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "./auth-utils";

export const setupRouter = createRouter({
  status: publicQuery.query(async () => {
    try {
      const db = getDb();
      await db.select().from(users).limit(1);
      return { tablesExist: true };
    } catch {
      return { tablesExist: false };
    }
  }),

  seed: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
        isAdmin: z.boolean().default(true),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();

      // Check if tables exist first
      try {
        await db.select().from(users).limit(1);
      } catch {
        throw new Error("Tables don't exist yet. Run 'npm run db:push' first.");
      }

      // Check if user already exists
      const existing = await db.select().from(users).where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        return { message: "User already exists", user: existing[0] };
      }

      const passwordHash = await hashPassword(input.password);
      const [user] = await db.insert(users).values({
        email: input.email,
        passwordHash,
        name: input.name,
        isActive: true,
        isAdmin: input.isAdmin,
      }).$returningId();

      return {
        message: "User created successfully",
        user: { id: user.id, email: input.email, name: input.name, isAdmin: input.isAdmin },
      };
    }),
});

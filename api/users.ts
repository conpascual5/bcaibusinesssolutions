import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { desc, eq } from "drizzle-orm";

export const userRouter = createRouter({
  list: adminQuery.query(async () => {
    const db = getDb();
    return db.select().from(users).orderBy(desc(users.createdAt));
  }),

  toggleActive: adminQuery
    .input(z.object({ userId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(users).set({ isActive: input.isActive }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  profile: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.userId)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    return { id: user.id, email: user.email, name: user.name, isActive: user.isActive, isAdmin: user.isAdmin };
  }),
});

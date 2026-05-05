import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery, authedQuery } from "./middleware.js";
import { getDbReady } from "./queries/connection.js";
import { users } from "../db/schema.js";
import { desc, eq } from "drizzle-orm";

export const userRouter = createRouter({
  list: adminQuery.query(async () => {
    const db = await getDbReady() as any;
    const userList = await db.select().from(users).orderBy(desc(users.createdAt));
    return userList.map((u: any) => ({
      ...u,
      plan: u.plan || "free",
      subscriptionStatus: null,
    }));
  }),

  toggleActive: adminQuery
    .input(z.object({ userId: z.number(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDbReady() as any;
      await db.update(users).set({ isActive: input.isActive ? 1 : 0 }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  setPlan: adminQuery
    .input(z.object({ userId: z.number(), plan: z.enum(["free", "pro", "vip"]) }))
    .mutation(async ({ input }) => {
      const db = await getDbReady() as any;
      await db.update(users).set({ plan: input.plan }).where(eq(users.id, input.userId));
      return { success: true, plan: input.plan };
    }),

  profile: authedQuery.query(async ({ ctx }) => {
    const db = await getDbReady() as any;
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.userId)).limit(1);
    if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      isAdmin: user.isAdmin,
      plan: user.plan || "free",
    };
  }),
});

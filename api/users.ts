import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery, authedQuery } from "./middleware.js";
import { getDbReady, saveDb } from "./queries/connection.js";
import { users, planHistory } from "../db/schema.js";
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
      const now = new Date().toISOString();
      await db.update(users).set({
        isActive: input.isActive ? 1 : 0,
        activatedAt: input.isActive ? now : undefined,
      }).where(eq(users.id, input.userId));
      await saveDb();
      return { success: true };
    }),

  setPlan: adminQuery
    .input(z.object({ userId: z.number(), plan: z.enum(["free", "pro", "vip"]) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDbReady() as any;
      const now = new Date().toISOString();

      // Get current plan before updating
      const [currentUser] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      const previousPlan = currentUser?.plan || "free";

      // Update user plan
      await db.update(users).set({
        plan: input.plan,
        activatedAt: now,
        isActive: 1,
      }).where(eq(users.id, input.userId));

      // Log plan change to history
      await db.insert(planHistory).values({
        userId: input.userId,
        plan: input.plan,
        previousPlan: previousPlan,
        setBy: ctx.user?.email || "Admin",
        notes: "",
        createdAt: now,
      });

      await saveDb();
      return { success: true, plan: input.plan };
    }),

  planHistory: adminQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDbReady() as any;
      const history = await db.select()
        .from(planHistory)
        .where(eq(planHistory.userId, input.userId))
        .orderBy(desc(planHistory.createdAt));
      return history;
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

import { z } from "zod";
import { createRouter, authedQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { searches } from "../db/schema.js";
import { desc } from "drizzle-orm";

export const searchRouter = createRouter({
  save: authedQuery
    .input(
      z.object({
        productQuery: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const forwarded = ctx.req.headers.get("x-forwarded-for");
      const realIp = ctx.req.headers.get("x-real-ip");
      const ipAddress = forwarded?.split(",")[0]?.trim() || realIp || "unknown";
      const userAgent = ctx.req.headers.get("user-agent") ?? undefined;
      
      await db.insert(searches).values({
        userId: ctx.user.userId,
        productQuery: input.productQuery,
        ipAddress: ipAddress.length > 100 ? ipAddress.slice(0, 100) : ipAddress,
        userAgent: userAgent ?? null,
      });
      return { success: true };
    }),

  list: authedQuery.query(async () => {
    const db = getDb();
    const results = await db
      .select()
      .from(searches)
      .orderBy(desc(searches.createdAt))
      .limit(200);
    return results;
  }),
});

import { z } from "zod";
import { createRouter, authedQuery } from "./middleware.ts";
import { getSupabaseClient } from "./queries/supabase-client.ts";

export const searchRouter = createRouter({
  save: authedQuery
    .input(
      z.object({
        productQuery: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      const forwarded = ctx.req.headers.get("x-forwarded-for");
      const realIp = ctx.req.headers.get("x-real-ip");
      const ipAddress = forwarded?.split(",")[0]?.trim() || realIp || "unknown";
      const userAgent = ctx.req.headers.get("user-agent") ?? undefined;

      const { error } = await (supabase as any).from("searches").insert({
        user_id: ctx.user.userId,
        product_query: input.productQuery,
        ip_address: ipAddress.length > 100 ? ipAddress.slice(0, 100) : ipAddress,
        user_agent: userAgent ?? null,
      });

      if (error) {
        console.error("[search.save] error:", error.message);
        throw new Error("Failed to save search");
      }

      return { success: true };
    }),

  list: authedQuery.query(async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await (supabase as any)
      .from("searches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("[search.list] error:", error.message);
      throw new Error("Failed to fetch searches");
    }

    return (data ?? []).map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      productQuery: s.product_query,
      ipAddress: s.ip_address,
      userAgent: s.user_agent,
      createdAt: s.created_at,
    }));
  }),
});

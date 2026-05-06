import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware.js";
import { getSupabaseClient } from "./queries/supabase-client.js";

export const authRouter = createRouter({
  me: publicQuery.query(async ({ ctx }) => {
    if (!ctx.user) return null;

    const supabase = getSupabaseClient();
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id, email, full_name, is_admin, plan, is_active")
      .eq("id", ctx.user.userId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      email: data.email ?? "",
      name: data.full_name ?? "",
      isAdmin: !!data.is_admin,
      plan: data.plan ?? "free",
      isActive: data.is_active ?? true,
    };
  }),
});

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, adminQuery, authedQuery } from "./middleware.js";
import { getSupabaseClient } from "./queries/supabase-client.js";

export const userRouter = createRouter({
  list: adminQuery.query(async () => {
    const supabase = getSupabaseClient();
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id, email, full_name, is_admin, plan, is_active, activated_at, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[user.list] error:", error.message);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch users" });
    }

    return (data ?? []).map((u: any) => ({
      id: String(u.id),
      email: u.email ?? "",
      fullName: u.full_name ?? "",
      isAdmin: !!u.is_admin,
      plan: u.plan ?? "free",
      isActive: u.is_active ?? true,
      activatedAt: u.activated_at,
      createdAt: u.created_at,
    }));
  }),

  toggleActive: adminQuery
    .input(z.object({ userId: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const supabase = getSupabaseClient();
      const { error } = await (supabase as any)
        .from("profiles")
        .update({
          is_active: input.isActive,
          activated_at: input.isActive ? new Date().toISOString() : null,
        })
        .eq("id", input.userId);

      if (error) {
        console.error("[user.toggleActive] error:", error.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update user" });
      }
      return { success: true };
    }),

  setPlan: adminQuery
    .input(z.object({ userId: z.string(), plan: z.enum(["free", "pro", "vip"]) }))
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();

      // Get current plan before updating
      const { data: current, error: fetchError } = await (supabase as any)
        .from("profiles")
        .select("plan")
        .eq("id", input.userId)
        .single();

      if (fetchError) {
        console.error("[user.setPlan] fetch error:", fetchError.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch current plan" });
      }

      const previousPlan = current?.plan ?? "free";

      // Update user plan
      const { error: updateError } = await (supabase as any)
        .from("profiles")
        .update({
          plan: input.plan,
          activated_at: new Date().toISOString(),
          is_active: true,
        })
        .eq("id", input.userId);

      if (updateError) {
        console.error("[user.setPlan] update error:", updateError.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update plan" });
      }

      // Log plan change to history
      const { error: insertError } = await (supabase as any)
        .from("plan_history")
        .insert({
          user_id: input.userId,
          plan: input.plan,
          previous_plan: previousPlan,
          set_by: ctx.user?.email ?? "Admin",
          notes: "",
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("[user.setPlan] history insert error:", insertError.message);
      }

      return { success: true, plan: input.plan };
    }),

  planHistory: adminQuery
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await (supabase as any)
        .from("plan_history")
        .select("*")
        .eq("user_id", input.userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[user.planHistory] error:", error.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch plan history" });
      }

      return (data ?? []).map((h: any) => ({
        id: h.id,
        userId: h.user_id,
        plan: h.plan,
        previousPlan: h.previous_plan,
        setBy: h.set_by,
        notes: h.notes,
        createdAt: h.created_at,
      }));
    }),

  profile: authedQuery.query(async ({ ctx }) => {
    const supabase = getSupabaseClient();
    const { data, error } = await (supabase as any)
      .from("profiles")
      .select("id, email, full_name, is_admin, plan, is_active")
      .eq("id", ctx.user.userId)
      .single();

    if (error || !data) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return {
      id: String(data.id),
      email: data.email ?? "",
      name: data.full_name ?? "",
      isActive: data.is_active ?? true,
      isAdmin: !!data.is_admin,
      plan: data.plan ?? "free",
    };
  }),
});

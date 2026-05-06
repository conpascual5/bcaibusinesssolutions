import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware.ts";
import { getSupabaseClient } from "./queries/supabase-client.ts";

export const salesWizardSaveRouter = createRouter({
  save: authedQuery
    .input(
      z.object({
        title: z.string().min(1).max(200),
        productName: z.string().min(1).max(200),
        targetAudience: z.string().min(1),
        messageContext: z.string().optional(),
        contentType: z.string().min(1).max(50),
        framework: z.string().min(1).max(100),
        frameworkName: z.string().min(1).max(200),
        output: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await (supabase as any)
        .from("sales_wizard_saves")
        .insert({
          user_id: ctx.user.userId,
          title: input.title,
          product_name: input.productName,
          target_audience: input.targetAudience,
          message_context: input.messageContext || null,
          content_type: input.contentType,
          framework: input.framework,
          framework_name: input.frameworkName,
          output: input.output,
        })
        .select("id")
        .single();

      if (error) {
        console.error("[sales-wizard-saves.save] error:", error.message);
        throw new Error("Failed to save");
      }

      return { id: data.id };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const supabase = getSupabaseClient();
    const { data, error } = await (supabase as any)
      .from("sales_wizard_saves")
      .select("*")
      .eq("user_id", ctx.user.userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[sales-wizard-saves.list] error:", error.message);
      throw new Error("Failed to fetch saves");
    }

    return (data ?? []).map((s: any) => ({
      id: s.id,
      userId: s.user_id,
      title: s.title,
      productName: s.product_name,
      targetAudience: s.target_audience,
      messageContext: s.message_context,
      contentType: s.content_type,
      framework: s.framework,
      frameworkName: s.framework_name,
      output: s.output,
      createdAt: s.created_at,
    }));
  }),

  get: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      const { data, error } = await (supabase as any)
        .from("sales_wizard_saves")
        .select("*")
        .eq("id", input.id)
        .single();

      if (error || !data) throw new TRPCError({ code: "NOT_FOUND", message: "Save not found" });
      if (data.user_id !== ctx.user.userId && !ctx.user.isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your save" });
      }

      return {
        id: data.id,
        userId: data.user_id,
        title: data.title,
        productName: data.product_name,
        targetAudience: data.target_audience,
        messageContext: data.message_context,
        contentType: data.content_type,
        framework: data.framework,
        frameworkName: data.framework_name,
        output: data.output,
        createdAt: data.created_at,
      };
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      const { data: row, error: fetchError } = await (supabase as any)
        .from("sales_wizard_saves")
        .select("id, user_id")
        .eq("id", input.id)
        .single();

      if (fetchError || !row) throw new TRPCError({ code: "NOT_FOUND", message: "Save not found" });
      if (row.user_id !== ctx.user.userId && !ctx.user.isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your save" });
      }

      const { error } = await (supabase as any).from("sales_wizard_saves").delete().eq("id", input.id);
      if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to delete" });

      return { success: true };
    }),
});

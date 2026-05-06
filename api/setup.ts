import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware.js";
import { getSupabaseClient } from "./queries/supabase-client.js";
import { hashPassword } from "./auth-utils.js";

export const setupRouter = createRouter({
  createAdmin: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().min(1),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const supabase = getSupabaseClient();
        const { data: existing } = await (supabase
          .from("users")
          .select("id")
          .eq("email", input.email)
          .limit(1) as any);
        if ((existing as any[])?.length) {
          throw new TRPCError({ code: "CONFLICT", message: "User already exists" });
        }
        const passwordHash = await hashPassword(input.password);
        const { data: newUsers, error } = await (supabase
          .from("users")
          .insert({
            email: input.email,
            password_hash: passwordHash,
            name: input.name,
            is_active: 1,
            is_admin: 1,
          } as any)
          .select("id") as any);
        if (error) {
          console.error("[setup.createAdmin] insert error:", error.message);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create admin." });
        }
        const user = (newUsers as any[])?.[0];
        return { id: user.id, email: input.email, name: input.name, isAdmin: true };
      } catch (err: any) {
        console.error("[setup.createAdmin] error:", err?.message ?? err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message || "Unknown error" });
      }
    }),

  checkAdminExists: publicQuery.query(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: admins, error } = await (supabase
        .from("users")
        .select("id")
        .eq("is_admin", 1)
        .limit(1) as any);
      if (error) {
        console.error("[setup.checkAdminExists] query error:", error.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database error." });
      }
      return { exists: !!((admins as any[])?.length) };
    } catch (err: any) {
      console.error("[setup.checkAdminExists] error:", err?.message ?? err);
      if (err instanceof TRPCError) throw err;
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message || "Unknown error" });
    }
  }),

  makeAdmin: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      try {
        const supabase = getSupabaseClient();
        const { data: users } = await (supabase
          .from("users")
          .select("id")
          .eq("email", input.email)
          .limit(1) as any);
        if (!((users as any[])?.length)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        const { error } = await ((supabase as any)
          .from("users")
          .update({ is_admin: 1 })
          .eq("email", input.email));
        if (error) {
          console.error("[setup.makeAdmin] update error:", error.message);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to make admin." });
        }
        return { success: true, message: `User ${input.email} is now an admin` };
      } catch (err: any) {
        console.error("[setup.makeAdmin] error:", err?.message ?? err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message || "Unknown error" });
      }
    }),

  reactivateAdmin: publicQuery
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      try {
        const supabase = getSupabaseClient();
        const { data: users } = await (supabase
          .from("users")
          .select("id")
          .eq("email", input.email)
          .limit(1) as any);
        if (!((users as any[])?.length)) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }
        const { error } = await ((supabase as any)
          .from("users")
          .update({ is_active: 1 })
          .eq("email", input.email));
        if (error) {
          console.error("[setup.reactivateAdmin] update error:", error.message);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to reactivate." });
        }
        return { success: true, message: "Admin account reactivated" };
      } catch (err: any) {
        console.error("[setup.reactivateAdmin] error:", err?.message ?? err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message || "Unknown error" });
      }
    }),
});

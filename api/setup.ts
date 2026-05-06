import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware.js";
import { getSupabaseClient } from "./queries/supabase-client.js";

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

        // Check if any admin already exists
        const { data: existingAdmins } = await (supabase as any)
          .from("profiles")
          .select("id")
          .eq("is_admin", true)
          .limit(1);

        if (existingAdmins && existingAdmins.length > 0) {
          throw new TRPCError({ code: "FORBIDDEN", message: "An admin already exists. Use the admin panel to manage users." });
        }

        // Sign up with Supabase Auth
        const { data, error } = await supabase.auth.signUp({
          email: input.email,
          password: input.password,
          options: {
            data: {
              full_name: input.name,
            },
          },
        });

        if (error) {
          console.error("[setup.createAdmin] auth error:", error.message);
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
        }

        if (!data.user) {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create user" });
        }

        // Promote to admin in profiles
        const { error: profileError } = await (supabase as any)
          .from("profiles")
          .update({
            is_admin: true,
            is_active: true,
            plan: "vip",
          })
          .eq("id", data.user.id);

        if (profileError) {
          console.error("[setup.createAdmin] profile update error:", profileError.message);
        }

        return {
          id: data.user.id,
          email: input.email,
          name: input.name,
          isAdmin: true,
        };
      } catch (err: any) {
        console.error("[setup.createAdmin] error:", err?.message ?? err);
        if (err instanceof TRPCError) throw err;
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: err?.message || "Unknown error" });
      }
    }),

  checkAdminExists: publicQuery.query(async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: admins, error } = await (supabase as any)
        .from("profiles")
        .select("id")
        .eq("is_admin", true)
        .limit(1);

      if (error) {
        console.error("[setup.checkAdminExists] error:", error.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database error." });
      }
      return { exists: !!(admins?.length) };
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
        const { data: users, error: findError } = await (supabase as any)
          .from("profiles")
          .select("id")
          .eq("email", input.email)
          .limit(1);

        if (findError || !users?.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const { error } = await (supabase as any)
          .from("profiles")
          .update({ is_admin: true })
          .eq("email", input.email);

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
        const { data: users, error: findError } = await (supabase as any)
          .from("profiles")
          .select("id")
          .eq("email", input.email)
          .limit(1);

        if (findError || !users?.length) {
          throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        }

        const { error } = await (supabase as any)
          .from("profiles")
          .update({ is_active: true })
          .eq("email", input.email);

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

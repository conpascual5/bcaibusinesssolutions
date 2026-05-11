import { initTRPC, TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context.js";
import { getSupabaseClient } from "./queries/supabase-client.js";
import superjson from "superjson";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    console.error("[tRPC error]", error.code, error.message);
    return shape;
  },
});

export const createRouter = t.router;
export const createProcedure = t.procedure;

// Public queries - no auth needed
export const publicQuery = t.procedure;

// Authenticated queries - verify JWT and check user in DB
export const authedQuery = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated. Please login." });
    }

    try {
      const supabase = getSupabaseClient(ctx.token);
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin, is_active")
        .eq("id", ctx.user.userId)
        .single();

      if (error || !data) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found in database" });
      }

      const profile = data as unknown as { is_admin: boolean; is_active: boolean };

      if (!profile.is_active) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Account deactivated" });
      }

      return next({
        ctx: {
          ...ctx,
          user: {
            ...ctx.user,
            isAdmin: !!profile.is_admin,
          },
        },
      });
    } catch (err: any) {
      if (err instanceof TRPCError) throw err;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Database error: ${err?.message ?? "Unknown error"}`,
      });
    }
  })
);

// Admin queries - must be authenticated AND admin
export const adminQuery = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    console.log("[middleware] adminQuery check for user:", ctx.user?.userId, ctx.user?.email);
    if (!ctx.user) {
      console.log("[middleware] adminQuery: no user in context");
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    try {
      const supabase = getSupabaseClient(ctx.token);
      console.log("[middleware] adminQuery: querying profile", ctx.user.userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin, is_active")
        .eq("id", ctx.user.userId)
        .single();

      if (error) {
        console.error("[middleware] adminQuery query error:", error.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database error. Please try again." });
      }

      const profile = data as unknown as { is_admin: boolean; is_active: boolean } | null;

      if (!profile || !profile.is_admin) {
        console.log("[middleware] adminQuery: user is not admin");
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      if (!profile.is_active) {
        console.log("[middleware] adminQuery: user is inactive");
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Account deactivated" });
      }

      console.log("[middleware] adminQuery: admin verified, proceeding");
      return next({
        ctx: {
          ...ctx,
          user: {
            ...ctx.user,
            isAdmin: true,
          },
        },
      });
    } catch (err: any) {
      console.log("[middleware] adminQuery error:", err?.message);
      if (err instanceof TRPCError) throw err;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Database error: ${err?.message ?? "Unknown error"}`,
      });
    }
  })
);

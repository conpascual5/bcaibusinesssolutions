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
      const supabase = getSupabaseClient();
      const { data: rows, error } = await (supabase
        .from("users")
        .select("id, is_active, is_admin")
        .eq("id", ctx.user.userId)
        .limit(1) as any);

      if (error) {
        console.error("[middleware] query error:", error.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database error. Please try again." });
      }

      const user = (rows as any[])?.[0];
      if (!user) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found in database" });
      }

      if (!user.is_active) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Account deactivated" });
      }

      return next({
        ctx: {
          ...ctx,
          user: {
            ...ctx.user,
            isAdmin: !!user.is_admin,
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
      const supabase = getSupabaseClient();
      console.log("[middleware] adminQuery: querying user", ctx.user.userId);
      const { data: rows, error } = await (supabase
        .from("users")
        .select("id, is_active, is_admin")
        .eq("id", ctx.user.userId)
        .limit(1) as any);

      if (error) {
        console.error("[middleware] adminQuery query error:", error.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database error. Please try again." });
      }

      console.log("[middleware] adminQuery: user rows:", rows?.length);
      const user = (rows as any[])?.[0];
      if (!user?.is_admin) {
        console.log("[middleware] adminQuery: user is not admin");
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      if (!user.is_active) {
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

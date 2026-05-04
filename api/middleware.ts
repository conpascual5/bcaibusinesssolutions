import { initTRPC, TRPCError } from "@trpc/server";
import type { TrpcContext } from "./context";
import { getDb } from "./queries/connection";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
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

    // Check DB connection with timeout protection
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.userId))
        .limit(1);

      if (!rows[0]) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found in database" });
      }

      if (!rows[0].isActive) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Account deactivated" });
      }

      return next({
        ctx: {
          ...ctx,
          user: {
            ...ctx.user,
            isAdmin: rows[0].isAdmin,
          },
        },
      });
    } catch (err: any) {
      // If it's already a TRPCError, rethrow it
      if (err instanceof TRPCError) throw err;

      // Check if it's a connection timeout
      if (err?.message?.includes("timeout") || err?.code === "ETIMEDOUT" || err?.code === "ECONNREFUSED") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database connection failed. Please try again later.",
        });
      }

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
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.userId))
        .limit(1);

      if (!rows[0]?.isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      if (!rows[0].isActive) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Account deactivated" });
      }

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
      if (err instanceof TRPCError) throw err;
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Database error: ${err?.message ?? "Unknown error"}`,
      });
    }
  })
);

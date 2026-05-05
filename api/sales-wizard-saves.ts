import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware.js";
import { getDbReady } from "./queries/connection.js";
import { salesWizardSaves } from "../db/schema.js";
import { eq, desc } from "drizzle-orm";

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
      const db = await getDbReady() as any;
      const result = await db.insert(salesWizardSaves).values({
        userId: ctx.user.userId,
        title: input.title,
        productName: input.productName,
        targetAudience: input.targetAudience,
        messageContext: input.messageContext || null,
        contentType: input.contentType,
        framework: input.framework,
        frameworkName: input.frameworkName,
        output: input.output,
      }).returning({ id: salesWizardSaves.id });
      return { id: result[0].id };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const db = await getDbReady() as any;
    return db
      .select()
      .from(salesWizardSaves)
      .where(eq(salesWizardSaves.userId, ctx.user.userId))
      .orderBy(desc(salesWizardSaves.createdAt));
  }),

  get: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDbReady() as any;
      const [row] = await db
        .select()
        .from(salesWizardSaves)
        .where(eq(salesWizardSaves.id, input.id))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Save not found" });
      if (row.userId !== ctx.user.userId && !ctx.user.isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your save" });
      }
      return row;
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDbReady() as any;
      const [row] = await db
        .select()
        .from(salesWizardSaves)
        .where(eq(salesWizardSaves.id, input.id))
        .limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Save not found" });
      if (row.userId !== ctx.user.userId && !ctx.user.isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your save" });
      }
      await db.delete(salesWizardSaves).where(eq(salesWizardSaves.id, input.id));
      return { success: true };
    }),
});

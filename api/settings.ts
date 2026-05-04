import { z } from "zod";
import { createRouter, adminQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { settings } from "../db/schema.js";
import { eq } from "drizzle-orm";

const FAL_KEY = "fal_api_key";
const DEEPSEEK_KEY = "deepseek_api_key";

export const settingsRouter = createRouter({
  getApiKey: adminQuery.query(async () => {
    const db = getDb();
    const [row] = await db.select().from(settings).where(eq(settings.key, FAL_KEY)).limit(1);
    return { apiKey: row?.value ?? "" };
  }),

  setApiKey: adminQuery
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [existing] = await db.select().from(settings).where(eq(settings.key, FAL_KEY)).limit(1);
      if (existing) {
        await db.update(settings).set({ value: input.apiKey }).where(eq(settings.key, FAL_KEY));
      } else {
        await db.insert(settings).values({ key: FAL_KEY, value: input.apiKey });
      }
      return { success: true };
    }),

  hasApiKey: adminQuery.query(async () => {
    const db = getDb();
    const [row] = await db.select().from(settings).where(eq(settings.key, FAL_KEY)).limit(1);
    return { hasKey: !!row?.value && row.value.length > 0 };
  }),

  getDeepseekKey: adminQuery.query(async () => {
    const db = getDb();
    const [row] = await db.select().from(settings).where(eq(settings.key, DEEPSEEK_KEY)).limit(1);
    return { apiKey: row?.value ?? "" };
  }),

  setDeepseekKey: adminQuery
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [existing] = await db.select().from(settings).where(eq(settings.key, DEEPSEEK_KEY)).limit(1);
      if (existing) {
        await db.update(settings).set({ value: input.apiKey }).where(eq(settings.key, DEEPSEEK_KEY));
      } else {
        await db.insert(settings).values({ key: DEEPSEEK_KEY, value: input.apiKey });
      }
      return { success: true };
    }),

  hasDeepseekKey: adminQuery.query(async () => {
    const db = getDb();
    const [row] = await db.select().from(settings).where(eq(settings.key, DEEPSEEK_KEY)).limit(1);
    return { hasKey: !!row?.value && row.value.length > 0 };
  }),
});

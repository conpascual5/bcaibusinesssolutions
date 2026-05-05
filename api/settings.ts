import { z } from "zod";
import { createRouter, adminQuery } from "./middleware.js";
import { getDbReady } from "./queries/connection.js";
import { settings } from "../db/schema.js";
import { eq } from "drizzle-orm";

const FAL_KEY = "fal_api_key";
const DEEPSEEK_KEY = "deepseek_api_key";

export const settingsRouter = createRouter({
  getApiKey: adminQuery.query(async () => {
    const db = await getDbReady() as any;
    const [row] = await db.select().from(settings).where(eq(settings.key, FAL_KEY)).limit(1);
    return { apiKey: row?.value ?? "" };
  }),

  setApiKey: adminQuery
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDbReady() as any;
      const [existing] = await db.select().from(settings).where(eq(settings.key, FAL_KEY)).limit(1);
      if (existing) {
        await db.update(settings).set({ value: input.apiKey }).where(eq(settings.key, FAL_KEY));
      } else {
        await db.insert(settings).values({ key: FAL_KEY, value: input.apiKey });
      }
      return { success: true };
    }),

  hasApiKey: adminQuery.query(async () => {
    const db = await getDbReady() as any;
    const [row] = await db.select().from(settings).where(eq(settings.key, FAL_KEY)).limit(1);
    return { hasKey: !!row?.value && row.value.length > 0 };
  }),

  getDeepseekKey: adminQuery.query(async () => {
    console.log("[settings] getDeepseekKey called");
    const db = await getDbReady() as any;
    const [row] = await db.select().from(settings).where(eq(settings.key, DEEPSEEK_KEY)).limit(1);
    console.log("[settings] getDeepseekKey result:", row ? `found (value length: ${row.value?.length})` : "not found");
    return { apiKey: row?.value ?? "" };
  }),

  setDeepseekKey: adminQuery
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      console.log("[settings] setDeepseekKey called with key length:", input.apiKey.length);
      const db = await getDbReady() as any;
      console.log("[settings] db ready, querying existing...");
      const [existing] = await db.select().from(settings).where(eq(settings.key, DEEPSEEK_KEY)).limit(1);
      console.log("[settings] existing row:", existing ? JSON.stringify({ key: existing.key, valueLength: existing.value?.length }) : "none");
      if (existing) {
        await db.update(settings).set({ value: input.apiKey }).where(eq(settings.key, DEEPSEEK_KEY));
        console.log("[settings] updated existing row");
      } else {
        await db.insert(settings).values({ key: DEEPSEEK_KEY, value: input.apiKey });
        console.log("[settings] inserted new row");
      }
      return { success: true };
    }),

  hasDeepseekKey: adminQuery.query(async () => {
    const db = await getDbReady() as any;
    const [row] = await db.select().from(settings).where(eq(settings.key, DEEPSEEK_KEY)).limit(1);
    return { hasKey: !!row?.value && row.value.length > 0 };
  }),
});

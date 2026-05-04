import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { settings } from "../db/schema";
import { eq } from "drizzle-orm";

const FAL_KEY = "fal_api_key";

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
});

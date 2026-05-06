import { z } from "zod";
import { createRouter, adminQuery } from "./middleware.js";
import { getSupabaseClient } from "./queries/supabase-client.js";

const FAL_KEY = "fal_api_key";
const DEEPSEEK_KEY = "deepseek_api_key";
const OPENAI_KEY = "openai_api_key";

async function getSetting(key: string): Promise<string> {
  const supabase = getSupabaseClient();
  const { data } = await (supabase as any)
    .from("settings")
    .select("value")
    .eq("key", key)
    .limit(1);
  const rows = (data as any[]) ?? [];
  return rows[0]?.value ?? "";
}

async function upsertSetting(key: string, value: string): Promise<void> {
  const supabase = getSupabaseClient();
  
  // Try update first
  const { data: existing, error: selectError } = await (supabase as any)
    .from("settings")
    .select("id")
    .eq("key", key)
    .limit(1);

  if (selectError) {
    console.error("[settings] upsertSetting select error:", selectError.message);
  }

  const existingRow = (existing as any[])?.[0];

  if (existingRow) {
    const { error: updateError } = await (supabase as any)
      .from("settings")
      .update({ value, updated_at: new Date().toISOString() })
      .eq("key", key);
    
    if (updateError) {
      console.error("[settings] upsertSetting update error:", updateError.message);
      throw new Error(`Failed to update setting: ${updateError.message}`);
    }
    console.log("[settings] upsertSetting updated key:", key);
  } else {
    const { error: insertError } = await (supabase as any)
      .from("settings")
      .insert({ key, value, updated_at: new Date().toISOString() });
    
    if (insertError) {
      console.error("[settings] upsertSetting insert error:", insertError.message);
      throw new Error(`Failed to insert setting: ${insertError.message}`);
    }
    console.log("[settings] upsertSetting inserted key:", key);
  }
}

export const settingsRouter = createRouter({
  getApiKey: adminQuery.query(async () => {
    const apiKey = await getSetting(FAL_KEY);
    return { apiKey };
  }),

  setApiKey: adminQuery
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      await upsertSetting(FAL_KEY, input.apiKey);
      return { success: true };
    }),

  hasApiKey: adminQuery.query(async () => {
    const apiKey = await getSetting(FAL_KEY);
    return { hasKey: apiKey.length > 0 };
  }),

  getDeepseekKey: adminQuery.query(async () => {
    console.log("[settings] getDeepseekKey called");
    const apiKey = await getSetting(DEEPSEEK_KEY);
    console.log("[settings] getDeepseekKey result:", apiKey ? `found (value length: ${apiKey.length})` : "not found");
    return { apiKey };
  }),

  setDeepseekKey: adminQuery
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      console.log("[settings] setDeepseekKey called with key length:", input.apiKey.length);
      await upsertSetting(DEEPSEEK_KEY, input.apiKey);
      return { success: true };
    }),

  hasDeepseekKey: adminQuery.query(async () => {
    const apiKey = await getSetting(DEEPSEEK_KEY);
    return { hasKey: apiKey.length > 0 };
  }),

  getOpenaiKey: adminQuery.query(async () => {
    console.log("[settings] getOpenaiKey called");
    const apiKey = await getSetting(OPENAI_KEY);
    console.log("[settings] getOpenaiKey result:", apiKey ? `found (value length: ${apiKey.length})` : "not found");
    return { apiKey };
  }),

  setOpenaiKey: adminQuery
    .input(z.object({ apiKey: z.string().min(1) }))
    .mutation(async ({ input }) => {
      console.log("[settings] setOpenaiKey called with key length:", input.apiKey.length);
      await upsertSetting(OPENAI_KEY, input.apiKey);
      return { success: true };
    }),

  hasOpenaiKey: adminQuery.query(async () => {
    const apiKey = await getSetting(OPENAI_KEY);
    return { hasKey: apiKey.length > 0 };
  }),
});

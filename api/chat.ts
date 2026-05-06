import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware.ts";
import { getSupabaseClient } from "./queries/supabase-client.ts";
import { env } from "./lib/env.ts";

async function getFalKey(): Promise<string> {
  const supabase = getSupabaseClient();
  const { data: rows } = await (supabase
    .from("settings")
    .select("value")
    .eq("key", "fal_api_key")
    .limit(1) as any);
  const row = (rows as any[])?.[0];
  return row?.value ?? env.falApiKey ?? "";
}

export const chatRouter = createRouter({
  create: authedQuery
    .input(z.object({ title: z.string().min(1).max(200).default("New Chat") }))
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      const { data: newChats, error } = await (supabase
        .from("chats")
        .insert({
          user_id: ctx.user.userId,
          title: input.title,
        } as any)
        .select("id") as any);
      if (error) {
        console.error("[chat.create] error:", error.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create chat" });
      }
      const chat = (newChats as any[])?.[0];
      return { id: chat.id, title: input.title };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const supabase = getSupabaseClient();
    const { data: chats, error } = await (supabase
      .from("chats")
      .select("*")
      .eq("user_id", ctx.user.userId)
      .order("updated_at", { ascending: false }) as any);
    if (error) {
      console.error("[chat.list] error:", error.message);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to list chats" });
    }
    return chats as any[];
  }),

  getMessages: authedQuery
    .input(z.object({ chatId: z.number() }))
    .query(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      const { data: chatRows } = await (supabase
        .from("chats")
        .select("*")
        .eq("id", input.chatId)
        .limit(1) as any);
      const chat = (chatRows as any[])?.[0];
      if (!chat) throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      if (chat.user_id !== ctx.user.userId && !ctx.user.isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your chat" });
      }
      const { data: msgs, error } = await (supabase
        .from("messages")
        .select("*")
        .eq("chat_id", input.chatId)
        .order("created_at", { ascending: true }) as any);
      if (error) {
        console.error("[chat.getMessages] error:", error.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to get messages" });
      }
      return msgs as any[];
    }),

  sendMessage: authedQuery
    .input(z.object({
      chatId: z.number(),
      content: z.string().min(1).max(10000),
    }))
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      const { data: chatRows } = await (supabase
        .from("chats")
        .select("*")
        .eq("id", input.chatId)
        .limit(1) as any);
      const chat = (chatRows as any[])?.[0];
      if (!chat) throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      if (chat.user_id !== ctx.user.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your chat" });
      }

      // Save user message
      await (supabase
        .from("messages")
        .insert({
          chat_id: input.chatId,
          role: "user",
          content: input.content,
        } as any) as any);

      // Get conversation history
      const { data: history } = await (supabase
        .from("messages")
        .select("*")
        .eq("chat_id", input.chatId)
        .order("created_at", { ascending: true }) as any);

      // Build prompt for fal.ai
      const conversation = (history as any[] || []).map((m: any) => `${m.role}: ${m.content}`).join("\n");
      const systemPrompt = `You are a helpful AI assistant for a business. You help with marketing, ad copy, content creation, and business strategy. Keep responses concise and actionable.`;

      const apiKey = await getFalKey();
      if (!apiKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "FAL_API_KEY not configured" });
      }

      const response = await fetch("https://fal.run/fal-ai/llm/chat", {
        method: "POST",
        headers: {
          "Authorization": `Key ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...(history as any[] || []).map((m: any) => ({ role: m.role, content: m.content })),
            { role: "user", content: input.content },
          ],
          max_tokens: 1024,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        console.error("fal.ai chat error:", response.status, errBody);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Chat failed" });
      }

      const data: any = await response.json();
      const reply = data.choices?.[0]?.message?.content ?? "No response";

      // Save assistant message
      const { data: msgResult } = await (supabase
        .from("messages")
        .insert({
          chat_id: input.chatId,
          role: "assistant",
          content: reply,
        } as any)
        .select("id") as any);
      const savedMsg = (msgResult as any[])?.[0];

      // Update chat timestamp
      await ((supabase as any)
        .from("chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", input.chatId));

      return { id: savedMsg?.id, role: "assistant", content: reply };
    }),

  delete: authedQuery
    .input(z.object({ chatId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseClient();
      const { data: chatRows } = await (supabase
        .from("chats")
        .select("*")
        .eq("id", input.chatId)
        .limit(1) as any);
      const chat = (chatRows as any[])?.[0];
      if (!chat) throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      if (chat.user_id !== ctx.user.userId && !ctx.user.isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your chat" });
      }
      await (supabase.from("messages").delete().eq("chat_id", input.chatId) as any);
      await (supabase.from("chats").delete().eq("id", input.chatId) as any);
      return { success: true };
    }),
});

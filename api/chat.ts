import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware.js";
import { getSupabaseClient } from "./queries/supabase-client.js";
import { env } from "./lib/env.js";

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

async function callDeepseek(messages: { role: string; content: string }[], apiKey: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[chat] Deepseek error:", response.status, errBody);
      return null;
    }

    const data: any = await response.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[chat] Deepseek exception:", err);
    return null;
  }
}

async function callOpenai(messages: { role: string; content: string }[], apiKey: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[chat] OpenAI error:", response.status, errBody);
      return null;
    }

    const data: any = await response.json();
    return data.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.error("[chat] OpenAI exception:", err);
    return null;
  }
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

      const systemPrompt = `You are a helpful AI assistant for a business. You help with marketing, ad copy, content creation, and business strategy. Keep responses concise and actionable.`;

      const messages = [
        { role: "system", content: systemPrompt },
        ...(history as any[] || []).map((m: any) => ({ role: m.role, content: m.content })),
        { role: "user", content: input.content },
      ];

      // Try Deepseek first, then fall back to OpenAI
      const deepseekKey = await getSetting(DEEPSEEK_KEY) || env.deepseekApiKey;
      const openaiKey = await getSetting(OPENAI_KEY) || env.openaiApiKey;

      let reply: string | null = null;
      let provider = "";

      if (deepseekKey) {
        reply = await callDeepseek(messages, deepseekKey);
        if (reply) provider = "deepseek";
      }

      if (!reply && openaiKey) {
        reply = await callOpenai(messages, openaiKey);
        if (reply) provider = "openai";
      }

      if (!reply) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "No AI provider configured. Please set up a Deepseek or OpenAI API key in the admin settings.",
        });
      }

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

      return { id: savedMsg?.id, role: "assistant", content: reply, provider };
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

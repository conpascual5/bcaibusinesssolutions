import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "./middleware.js";
import { getSupabaseClient } from "./queries/supabase-client.js";
import { env } from "./lib/env.js";

const DEEPSEEK_KEY = "deepseek_api_key";

async function getSetting(key: string, token?: string | null): Promise<string> {
  const supabase = getSupabaseClient(token);
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
        Authorization: `Bearer ${apiKey}`,
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

export const chatRouter = createRouter({
  create: authedQuery
    .input(z.object({ title: z.string().min(1).max(200).default("New Chat") }))
    .mutation(async ({ input, ctx }) => {
      const supabase = getSupabaseClient(ctx.token);
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
    const supabase = getSupabaseClient(ctx.token);
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

  adminList: adminQuery.query(async ({ ctx }) => {
    const supabase = getSupabaseClient(ctx.token);
    const { data: chats, error } = await (supabase
      .from("chats")
      .select("*")
      .order("updated_at", { ascending: false }) as any);
    if (error) {
      console.error("[chat.adminList] error:", error.message);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to list chats" });
    }
    return chats as any[];
  }),

  getMessages: authedQuery
    .input(z.object({ chatId: z.number() }))
    .query(async ({ input, ctx }) => {
      const supabase = getSupabaseClient(ctx.token);
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
    .input(
      z.object({
        chatId: z.number(),
        content: z.string().min(1).max(10000),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log("[chat.sendMessage] called", { chatId: input.chatId, userId: ctx.user.userId, isAdmin: ctx.user.isAdmin, contentLength: input.content.length });

      const supabase = getSupabaseClient(ctx.token);
      const { data: chatRows } = await (supabase
        .from("chats")
        .select("*")
        .eq("id", input.chatId)
        .limit(1) as any);
      const chat = (chatRows as any[])?.[0];
      if (!chat) {
        console.log("[chat.sendMessage] chat not found", { chatId: input.chatId });
        throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      }
      if (chat.user_id !== ctx.user.userId && !ctx.user.isAdmin) {
        console.log("[chat.sendMessage] forbidden", { chatUserId: chat.user_id, requestUserId: ctx.user.userId });
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your chat" });
      }

      // Determine the role: if admin, store as assistant; otherwise store as user
      const role = ctx.user.isAdmin ? "assistant" : "user";

      console.log("[chat.sendMessage] inserting message", { chatId: input.chatId, role });
      const { error: insertError } = await (supabase
        .from("messages")
        .insert({
          chat_id: input.chatId,
          role,
          content: input.content,
        } as any) as any);

      if (insertError) {
        console.error("[chat.sendMessage] insert error:", insertError.message);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Failed to save message: ${insertError.message}` });
      }

      console.log("[chat.sendMessage] message inserted successfully");

      // Update chat timestamp
      await ((supabase as any)
        .from("chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", input.chatId));

      // If the sender is an admin, we're done — no AI reply needed
      if (ctx.user.isAdmin) {
        console.log("[chat.sendMessage] admin message, returning without AI reply");
        return { saved: true, role, content: input.content };
      }

      // For regular users: try to generate an AI reply, but don't fail if it doesn't work
      const { data: history } = await (supabase
        .from("messages")
        .select("*")
        .eq("chat_id", input.chatId)
        .order("created_at", { ascending: true }) as any);

      const systemPrompt =
        "You are a helpful AI assistant for a business. You help with marketing, ad copy, content creation, and business strategy. Keep responses concise and actionable.";

      const messages = [
        { role: "system", content: systemPrompt },
        ...(history as any[] | undefined)?.map((m: any) => ({ role: m.role, content: m.content })) ?? [],
      ];

      const deepseekKey = (await getSetting(DEEPSEEK_KEY, ctx.token)) || env.deepseekApiKey;

      if (!deepseekKey) {
        console.log("[chat.sendMessage] no deepseek key, returning without AI reply");
        return { saved: true, role: "user", content: input.content, aiReply: null };
      }

      console.log("[chat.sendMessage] calling deepseek");
      const reply = await callDeepseek(messages, deepseekKey);
      if (!reply) {
        console.log("[chat.sendMessage] deepseek returned no reply, returning without AI reply");
        return { saved: true, role: "user", content: input.content, aiReply: null };
      }

      // Save the AI reply
      const { data: msgResult } = await (supabase
        .from("messages")
        .insert({
          chat_id: input.chatId,
          role: "assistant",
          content: reply,
        } as any)
        .select("id") as any);
      const savedMsg = (msgResult as any[])?.[0];

      console.log("[chat.sendMessage] AI reply saved", { replyId: savedMsg?.id });

      return {
        saved: true,
        role: "user",
        content: input.content,
        aiReply: { id: savedMsg?.id, role: "assistant", content: reply, provider: "deepseek" },
      };
    }),
});

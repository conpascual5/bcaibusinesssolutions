import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware.js";
import { getDb } from "./queries/connection.js";
import { chats, messages, settings } from "../db/schema.js";
import { eq, desc, asc } from "drizzle-orm";
import { env } from "./lib/env.js";

async function getFalKey(): Promise<string> {
  const db = getDb();
  const [row] = await db.select().from(settings).where(eq(settings.key, "fal_api_key")).limit(1);
  return row?.value ?? env.falApiKey ?? "";
}

export const chatRouter = createRouter({
  create: authedQuery
    .input(z.object({ title: z.string().min(1).max(200).default("New Chat") }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const result = await db.insert(chats).values({
        userId: ctx.user.userId,
        title: input.title,
      }).returning({ id: chats.id });
      const chat = result[0];
      return { id: chat.id, title: input.title };
    }),

  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(chats)
      .where(eq(chats.userId, ctx.user.userId))
      .orderBy(desc(chats.updatedAt));
  }),

  getMessages: authedQuery
    .input(z.object({ chatId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const [chat] = await db.select().from(chats).where(eq(chats.id, input.chatId)).limit(1);
      if (!chat) throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      if (chat.userId !== ctx.user.userId && !ctx.user.isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your chat" });
      }
      return db
        .select()
        .from(messages)
        .where(eq(messages.chatId, input.chatId))
        .orderBy(asc(messages.createdAt));
    }),

  sendMessage: authedQuery
    .input(z.object({
      chatId: z.number(),
      content: z.string().min(1).max(10000),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [chat] = await db.select().from(chats).where(eq(chats.id, input.chatId)).limit(1);
      if (!chat) throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      if (chat.userId !== ctx.user.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your chat" });
      }

      // Save user message
      await db.insert(messages).values({
        chatId: input.chatId,
        role: "user",
        content: input.content,
      });

      // Get conversation history
      const history = await db
        .select()
        .from(messages)
        .where(eq(messages.chatId, input.chatId))
        .orderBy(asc(messages.createdAt));

      // Build prompt for fal.ai
      const conversation = history.map(m => `${m.role}: ${m.content}`).join("\n");
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
            ...history.map(m => ({ role: m.role, content: m.content })),
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
      const msgResult = await db.insert(messages).values({
        chatId: input.chatId,
        role: "assistant",
        content: reply,
      }).returning({ id: messages.id });
      const savedMsg = msgResult[0];

      // Update chat timestamp
      await db.update(chats).set({ updatedAt: new Date().toISOString() }).where(eq(chats.id, input.chatId));

      return { id: savedMsg.id, role: "assistant", content: reply };
    }),

  delete: authedQuery
    .input(z.object({ chatId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [chat] = await db.select().from(chats).where(eq(chats.id, input.chatId)).limit(1);
      if (!chat) throw new TRPCError({ code: "NOT_FOUND", message: "Chat not found" });
      if (chat.userId !== ctx.user.userId && !ctx.user.isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your chat" });
      }
      await db.delete(messages).where(eq(messages.chatId, input.chatId));
      await db.delete(chats).where(eq(chats.id, input.chatId));
      return { success: true };
    }),
});


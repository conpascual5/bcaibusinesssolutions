import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { chatMessages, users } from "@db/schema";
import { eq, desc, and } from "drizzle-orm";

export const chatRouter = createRouter({
  // User sends a message
  send: authedQuery
    .input(z.object({ message: z.string().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      // Look up user name from DB
      const [userRow] = await db.select().from(users).where(eq(users.id, ctx.user.userId)).limit(1);
      const userName = userRow?.name ?? 'User';
      await db.insert(chatMessages).values({
        userId: ctx.user.userId,
        userName,
        userEmail: ctx.user.email,
        message: input.message,
        isAdmin: false,
        isRead: false,
      });
      return { success: true };
    }),

  // User gets their own chat history
  myMessages: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, ctx.user.userId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(200);
  }),

  // Admin: Get all unique chat conversations (latest message per user)
  adminConversations: adminQuery.query(async () => {
    const db = getDb();
    const allMessages = await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.createdAt))
      .limit(1000);

    // Group by userId, get latest message per user
    const conversations = new Map();
    for (const msg of allMessages) {
      if (!conversations.has(msg.userId)) {
        conversations.set(msg.userId, {
          userId: msg.userId,
          userName: msg.userName,
          userEmail: msg.userEmail,
          latestMessage: msg.message,
          latestAt: msg.createdAt,
          unreadCount: 0,
        });
      }
      if (!msg.isRead && !msg.isAdmin) {
        const conv = conversations.get(msg.userId);
        conv.unreadCount++;
      }
    }
    return Array.from(conversations.values());
  }),

  // Admin: Get all messages for a specific user
  adminUserMessages: adminQuery
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.userId, input.userId))
        .orderBy(chatMessages.createdAt)
        .limit(200);
    }),

  // Admin: Reply to a user
  adminReply: adminQuery
    .input(z.object({ userId: z.number(), message: z.string().min(1).max(2000) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(chatMessages).values({
        userId: input.userId,
        userName: "Admin",
        userEmail: ctx.user.email,
        message: input.message,
        isAdmin: true,
        isRead: true,
      });
      return { success: true };
    }),

  // Admin: Mark messages as read
  markRead: adminQuery
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(chatMessages)
        .set({ isRead: true })
        .where(and(eq(chatMessages.userId, input.userId), eq(chatMessages.isRead, false)));
      return { success: true };
    }),

  // Admin: Get unread count
  unreadCount: adminQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.isRead, false), eq(chatMessages.isAdmin, false)));
    return { count: result.length };
  }),
});

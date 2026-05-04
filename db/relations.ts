import { relations } from "drizzle-orm";
import { users, searches, images, chats, messages, settings } from "./schema.js";

export const usersRelations = relations(users, ({ many }) => ({
  searches: many(searches),
  images: many(images),
  chats: many(chats),
}));

export const searchesRelations = relations(searches, ({ one }) => ({
  user: one(users, { fields: [searches.userId], references: [users.id] }),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  user: one(users, { fields: [images.userId], references: [users.id] }),
}));

export const chatsRelations = relations(chats, ({ one, many }) => ({
  user: one(users, { fields: [chats.userId], references: [users.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
}));

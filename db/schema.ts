import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email", { length: 255 }).notNull().unique(),
  phone: text("phone", { length: 20 }),
  passwordHash: text("password_hash", { length: 255 }).notNull(),
  name: text("name", { length: 100 }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const searches = sqliteTable("searches", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  productQuery: text("product_query", { length: 500 }).notNull(),
  ipAddress: text("ip_address", { length: 100 }),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const settings = sqliteTable("settings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  key: text("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

export const images = sqliteTable("images", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  url: text("url").notNull(),
  prompt: text("prompt").notNull(),
  width: integer("width").notNull().default(0),
  height: integer("height").notNull().default(0),
  contentType: text("content_type", { length: 50 }).notNull().default("image/jpeg"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const chats = sqliteTable("chats", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  title: text("title", { length: 200 }).notNull().default("New Chat"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

export const messages = sqliteTable("messages", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  chatId: integer("chat_id").notNull(),
  role: text("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const generatedImages = sqliteTable("generated_images", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  productImageUrl: text("product_image_url").notNull(),
  themeTitle: text("theme_title", { length: 200 }).notNull(),
  prompt: text("prompt").notNull(),
  resultImageUrl: text("result_image_url"),
  overlayText: text("overlay_text", { length: 500 }),
  overlaySettings: text("overlay_settings"),
  finalImageUrl: text("final_image_url"),
  status: text("status", { length: 50 }).notNull().default("pending"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  userName: text("user_name", { length: 100 }).notNull(),
  userEmail: text("user_email", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

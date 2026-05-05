import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  isActive: integer("is_active").notNull().default(1),
  isAdmin: integer("is_admin").notNull().default(0),
  plan: text("plan").notNull().default("free"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const searches = sqliteTable("searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  productQuery: text("product_query").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

export const images = sqliteTable("images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  url: text("url").notNull(),
  prompt: text("prompt").notNull(),
  width: integer("width").notNull().default(0),
  height: integer("height").notNull().default(0),
  contentType: text("content_type").notNull().default("image/jpeg"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const chats = sqliteTable("chats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  title: text("title").notNull().default("New Chat"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

export const messages = sqliteTable("messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatId: integer("chat_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const generatedImages = sqliteTable("generated_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  productImageUrl: text("product_image_url").notNull(),
  themeTitle: text("theme_title").notNull(),
  prompt: text("prompt").notNull(),
  resultImageUrl: text("result_image_url"),
  overlayText: text("overlay_text"),
  overlaySettings: text("overlay_settings"),
  finalImageUrl: text("final_image_url"),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const salesWizardSaves = sqliteTable("sales_wizard_saves", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  productName: text("product_name").notNull(),
  targetAudience: text("target_audience").notNull(),
  messageContext: text("message_context"),
  contentType: text("content_type").notNull(),
  framework: text("framework").notNull(),
  frameworkName: text("framework_name").notNull(),
  output: text("output").notNull(),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const userUsage = sqliteTable("user_usage", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  feature: text("feature").notNull(),
  month: text("month").notNull(),
  count: integer("count").notNull().default(0),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  userName: text("user_name").notNull(),
  userEmail: text("user_email").notNull(),
  message: text("message").notNull(),
  isAdmin: integer("is_admin").notNull().default(0),
  isRead: integer("is_read").notNull().default(0),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

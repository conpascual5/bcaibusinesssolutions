import {
  mysqlTable,
  bigint,
  varchar,
  text,
  timestamp,
  int,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const searches = mysqlTable("searches", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: int("user_id"),
  productQuery: varchar("product_query", { length: 500 }).notNull(),
  ipAddress: varchar("ip_address", { length: 100 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const settings = mysqlTable("settings", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const generatedImages = mysqlTable("generated_images", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  productImageUrl: text("product_image_url").notNull(),
  themeTitle: varchar("theme_title", { length: 200 }).notNull(),
  prompt: text("prompt").notNull(),
  resultImageUrl: text("result_image_url"),
  overlayText: varchar("overlay_text", { length: 500 }),
  overlaySettings: json("overlay_settings"),
  finalImageUrl: text("final_image_url"),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessages = mysqlTable("chat_messages", {
  id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  userName: varchar("user_name", { length: 100 }).notNull(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

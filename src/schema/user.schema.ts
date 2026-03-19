import { integer, pgTable, serial, text } from "drizzle-orm/pg-core";

// 注意：这里表名与现有 SQL 中的 "User" 保持一致（大小写敏感时很重要）
export const users = pgTable("User", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod";

// 注意：这里表名与现有 SQL 中的 "User" 保持一致（大小写敏感时很重要）
export const users = pgTable("User", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
});

/** 创建用户：Zod（由 drizzle-zod 从表结构生成并细化规则） */
export const userCreateSchema = createInsertSchema(users, {
  email: z.email(),
  name: z.string().min(1).nullable().optional(),
}).omit({ id: true });

/** 更新用户：Zod（由 drizzle-zod 从表结构生成并细化规则） */
export const userUpdateSchema = userCreateSchema.partial();

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
// export type UserCreateInput = z.infer<typeof userCreateSchema>;
// export type UserUpdateInput = z.infer<typeof userUpdateSchema>;

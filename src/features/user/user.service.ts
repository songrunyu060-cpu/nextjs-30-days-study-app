/**
 * 用户服务
 */

import { db } from "@/db";
import { NewUser, User, users } from "@/schema";
import { eq, desc } from "drizzle-orm";

// 获取所有用户
export async function getAllUsers(): Promise<User[]> {
  return await db.select().from(users).orderBy(desc(users.id));
}

// 获取单个用户
export async function getUserById(id: number) {
  return await db.select().from(users).where(eq(users.id, id));
}

// 这是一个高度复用的“原子操作”，它不管缓存，不管校验，只管数据库
export async function saveUserService(data: any, id?: string) {
  if (id) {
    return await db
      .update(users)
      .set(data)
      .where(eq(users.id, Number(id)))
      .returning();
  }
  return await db.insert(users).values(data).returning();
}

// 删除用户
export async function deleteUser(id: number): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

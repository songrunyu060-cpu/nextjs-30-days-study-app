/**
 * 用户服务
 */

import { db } from "@/db";
import { User, userTable } from "@/schema";
import { eq, desc } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";

// 获取所有用户
export const getAllUsers = cache(async (): Promise<User[]> => {
  "use cache";
  cacheTag("users");
  cacheLife("fastCache");
  return await db.select().from(userTable).orderBy(desc(userTable.id));
});

// 获取单个用户
export async function getUserById(id: number) {
  return await db.select().from(userTable).where(eq(userTable.id, id));
}

// 这是一个高度复用的“原子操作”，它不管缓存，不管校验，只管数据库
export async function saveUserService(data: any, id?: string) {
  if (id) {
    return await db
      .update(userTable)
      .set(data)
      .where(eq(userTable.id, Number(id)))
      .returning();
  }
  return await db.insert(userTable).values(data).returning();
}

// 删除用户
export async function deleteUser(id: number): Promise<void> {
  await db.delete(userTable).where(eq(userTable.id, id));
}

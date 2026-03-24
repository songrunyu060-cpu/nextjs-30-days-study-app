/**
 * 用户服务
 */

import { db } from "@/db";
import { NewUser, User, users } from "@/schema";
import { eq } from "drizzle-orm";

// 获取所有用户
export async function getAllUsers(): Promise<User[]> {
  return await db.select().from(users);
}

// 获取单个用户
export async function getUserById(id: number) {
  return await db.select().from(users).where(eq(users.id, id));
}

// 创建用户
export async function createUser(user: NewUser) {
  return await db.insert(users).values(user);
}

// 更新用户
export async function updateUser(id: number, user: NewUser) {
  return await db.update(users).set(user).where(eq(users.id, id));
}

// 删除用户
export async function deleteUser(id: number): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

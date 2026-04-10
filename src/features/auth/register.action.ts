"use server";

import argon2 from "argon2";
import { db } from "@/db";
import { registerSchema } from "@/schema/register.schema";
import { userTable } from "@/schema/user.schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function registerAction(_: any, formData: FormData) {
  // Object.fromEntries 将 FormData 转换为对象
  const raw = Object.fromEntries(formData);
  // 使用 Zod 验证输入
  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "请检查输入格式",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const input = parsed.data;

  // 查询用户是否存在
  const exists = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, input.email))
    .limit(1);

  if (exists.length) return { error: "该邮箱已注册" };

  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  await db.insert(userTable).values({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  // 注册成功后一般跳去登录（或自动 signIn）
  redirect("/login");
}

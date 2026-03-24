"use server";

import { revalidatePath } from "next/cache";

import type { NewUser, User } from "@/schema";
import {
  createUser,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "@/features/user/user.service";

import { userCreateSchema, userUpdateSchema } from "@/schema";

export async function listUsersAction(): Promise<User[]> {
  return await getAllUsers();
}

export async function getUserByIdAction(id: number) {
  return await getUserById(id);
}

export async function createUserAction(input: unknown) {
  const data = userCreateSchema.parse(input);
  await createUser(data as NewUser);
  revalidatePath("/users");
}

export async function updateUserAction(id: number, input: unknown) {
  const data = userUpdateSchema.parse(input);
  await updateUser(id, data as NewUser);
  revalidatePath("/users");
}

export async function deleteUserAction(id: number) {
  await deleteUser(id);
  revalidatePath("/users");
}

/** 表单 / useActionState 用的统一状态 */
export type UserMutationState =
  | { ok: true; message?: string }
  | { ok: false; message: string };

/**
 * 创建用户（FormData + 安全校验 + 可读错误信息）
 * 闭环：校验 → service → revalidate → 返回状态给 useActionState
 */
export async function createUserFormAction(
  _prev: UserMutationState | null,
  formData: FormData,
): Promise<UserMutationState> {
  const nameRaw = formData.get("name");
  const input = {
    email: String(formData.get("email") ?? "").trim(),
    name:
      typeof nameRaw === "string" && nameRaw.trim()
        ? nameRaw.trim()
        : null,
  };

  const parsed = userCreateSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("；");
    return { ok: false, message: msg || "校验失败" };
  }

  try {
    await createUser(parsed.data as NewUser);
    revalidatePath("/users");
    return { ok: true, message: "已创建" };
  } catch {
    return { ok: false, message: "写入失败（例如邮箱已存在）" };
  }
}

/** 渐进增强：纯 <form action> 即可删除，无需客户端 JS */
export async function deleteUserFormAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await deleteUser(id);
  revalidatePath("/users");
}

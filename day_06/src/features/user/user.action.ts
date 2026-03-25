"use server";

import { revalidatePath } from "next/cache";

function revalidateUserViews() {
  revalidatePath("/users");
  revalidatePath("/users");
}
import type { NewUser } from "@/schema";
import { deleteUser, saveUserService } from "@/features/user/user.service";
import { userCreateSchema, userUpdateSchema } from "@/schema";
import { saveUserUseCase } from "./use-cases";

// 统一的返回格式
export type ActionResponse = {
  success?: boolean;
  error?: any;
  message?: string;
  isUpdate?: boolean;
};

/**
 * 保存用户
 */
export async function saveUserAction(prevState: any, formData: FormData) {
  try {
    const data = Object.fromEntries(formData);
    const isUpdate = Boolean(
      data.id !== undefined &&
      data.id !== null &&
      String(data.id).trim() !== "",
    );
    await saveUserUseCase(data); // 复用逻辑
    revalidateUserViews();
    return { success: true, isUpdate };
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "VALIDATION_FAILED") {
      return { error: "请检查姓名与邮箱格式" };
    }
    return { error: "保存失败" };
  }
}

export async function deleteUserAction(id: number) {
  await deleteUser(id);
  revalidateUserViews();
}

/**
 * 创建用户（FormData + 安全校验 + 可读错误信息）
 * 闭环：校验 → service → revalidate → 返回状态给 useActionState
 */
export async function createUserFormAction(
  _prev: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const nameRaw = formData.get("name");
  const input = {
    email: String(formData.get("email") ?? "").trim(),
    name: typeof nameRaw === "string" && nameRaw.trim() ? nameRaw.trim() : null,
  };

  const parsed = userCreateSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("；");
    return { error: true, message: msg || "校验失败" };
  }

  try {
    await saveUserService(parsed.data as NewUser);
    revalidateUserViews();
    return { success: true, message: "已创建" };
  } catch {
    return { error: true, message: "写入失败（例如邮箱已存在）" };
  }
}

/** 渐进增强：纯 <form action> 即可删除，无需客户端 JS */
export async function deleteUserFormAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await deleteUser(id);
  revalidateUserViews();
}

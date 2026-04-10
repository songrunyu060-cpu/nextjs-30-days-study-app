"use server";

import { refresh, revalidateTag } from "next/cache";
import { deleteUser } from "@/features/user/user.service";
import { saveUserUseCase } from "./use-cases";
import { withAuth } from "@/lib/auth";

// 统一的返回格式
export type ActionResponse = {
  success?: boolean;
  error?: any;
  message?: string;
  isUpdate?: boolean;
};

async function saveUserActionCore(
  prevState: any,
  formData: FormData,
): Promise<ActionResponse> {
  try {
    const data = Object.fromEntries(formData);
    const isUpdate = Boolean(
      data.id !== undefined &&
      data.id !== null &&
      String(data.id).trim() !== "",
    );
    await saveUserUseCase(data);
    revalidateTag("users", "fastCache");
    refresh();
    return { success: true, isUpdate };
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "VALIDATION_FAILED") {
      return { error: "请检查姓名与邮箱格式" };
    }
    return { error: "保存失败" };
  }
}

/** 保存用户 */
export const saveUserAction = withAuth(saveUserActionCore, {
  redirectTo: "/login?callbackUrl=%2Fusers",
});

async function deleteUserFormActionCore(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await deleteUser(id);
  revalidateTag("users", "fastCache");
  refresh();
}

/** 渐进增强：纯 <form action> 即可删除 */
export const deleteUserFormAction = withAuth(deleteUserFormActionCore, {
  redirectTo: "/login?callbackUrl=%2Fusers",
});

"use server";

import { refresh, revalidateTag, revalidatePath } from "next/cache";
import { deleteUser } from "@/features/user/user.service";
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
    // 刷新缓存
    /* 
      为什么只写 revalidateTag("users", "fastCache") 页面不更新
      因为它做的是 “让服务器端缓存失效”，不是 “让当前浏览器立刻重新请求并重新渲染”。
      refresh() 会 “让当前浏览器立刻重新请求并重新渲染”。
      让“当前这个用户”立刻看到最新数据：需要额外触发一次客户端重新取数，
      常用就是 refresh()（它只影响当前触发 action 的这个客户端，不影响其他用户）。
    */
    revalidateTag("users", "fastCache"); // 只是刷新了数据缓存 并没有刷新页面
    refresh();
    // refresh(); // 刷新页面
    return { success: true, isUpdate };
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "VALIDATION_FAILED") {
      return { error: "请检查姓名与邮箱格式" };
    }
    return { error: "保存失败" };
  }
}

/** 渐进增强：纯 <form action> 即可删除，无需客户端 JS */
export async function deleteUserFormAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await deleteUser(id);
  revalidateTag("users", "fastCache");
  refresh(); // 刷新页面
  // revalidatePath("/users"); // 刷新客户端缓存
}

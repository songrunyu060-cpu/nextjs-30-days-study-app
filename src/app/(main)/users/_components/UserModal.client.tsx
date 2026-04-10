"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { saveUserAction } from "@/features/user/user.action";
import type { User } from "@/schema";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Props = {
  editUser?: User | null;
  open: boolean;
  closeHref?: string;
};

export function UserModal({ editUser, open, closeHref }: Props) {
  const [state, formAction, isPending] = useActionState(saveUserAction, null);
  const router = useRouter();
  const lastToastKeyRef = useRef<string | null>(null);

  const isEdit = editUser != null;
  const href = closeHref ?? "/users";

  useEffect(() => {
    if (state?.success === true && open) {
      router.replace(href);
    }
  }, [state?.success, open]);

  useEffect(() => {
    const key = JSON.stringify({
      success: (state as any)?.success,
      isUpdate: (state as any)?.isUpdate,
      error: (state as any)?.error,
      message: (state as any)?.message,
    });
    if (lastToastKeyRef.current === key) return;
    lastToastKeyRef.current = key;

    if ((state as any)?.success === true) {
      toast.success((state as any)?.isUpdate ? "修改已保存" : "用户创建成功");
    } else if ((state as any)?.error) {
      toast.error(String((state as any).error));
    }

    if ((state as any)?.message) {
      toast(String((state as any).message));
    }
  }, [state]);

  useEffect(() => {
    const redirectTo = (state as any)?.redirectTo as string | undefined;
    const delayMs = (state as any)?.redirectDelayMs as number | undefined;
    if (!redirectTo) return;

    const t = setTimeout(
      () => {
        router.replace(redirectTo);
      },
      typeof delayMs === "number" ? delayMs : 0,
    );

    return () => clearTimeout(t);
  }, [state, router]);

  const form = (
    <form action={formAction} className="space-y-5">
      {editUser ? <input type="hidden" name="id" value={editUser.id} /> : null}

      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-gray-600">
          {editUser ? `正在编辑：ID ${editUser.id}` : "填写信息以创建新用户"}
        </p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">姓名</label>
        <input
          key={`name-${editUser?.id ?? "new"}`}
          name="name"
          defaultValue={editUser?.name ?? ""}
          placeholder="请输入姓名"
          className="w-full rounded-lg border px-4 py-2 outline-none transition-all focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">邮箱</label>
        <input
          key={`email-${editUser?.id ?? "new"}`}
          name="email"
          type="email"
          defaultValue={editUser?.email ?? ""}
          placeholder="请输入邮箱"
          className="w-full rounded-lg border px-4 py-2 outline-none transition-all focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-blue-600 py-2.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "保存中…" : isEdit ? "保存修改" : "立即创建"}
      </button>
    </form>
  );

  if (!open) return form;

  return (
    <>
      <Dialog open={open}>
        <DialogContent
          className="z-[99999] opacity-100 fixed top-[50%] left-[50%] !translate-x-[-50%] !translate-y-[-50%]"
          showCloseButton={false}
          aria-describedby={undefined}
        >
          {/* 右上角关闭按钮：关闭时回到 closeHref（清掉 query） */}
          <DialogClose asChild>
            <Link
              href={href}
              aria-label="关闭"
              className="absolute right-4 top-4 rounded-sm text-gray-500 hover:text-gray-900"
            >
              ×
            </Link>
          </DialogClose>
          <DialogTitle className="mb-2 text-xl font-bold">
            {isEdit ? "快速编辑用户" : "新增用户"}
          </DialogTitle>
          {form}
        </DialogContent>
      </Dialog>
    </>
  );
}

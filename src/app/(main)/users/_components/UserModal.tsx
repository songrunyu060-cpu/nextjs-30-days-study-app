"use client";

import Link from "next/link";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveUserAction } from "@/features/user/user.action";
import type { User } from "@/schema";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

type Props = {
  editUser?: User | null;
  open: boolean;
  closeHref?: string;
};

export function UserModal({ editUser, open, closeHref }: Props) {
  const [state, formAction, isPending] = useActionState(saveUserAction, null);
  const router = useRouter();

  const isEdit = editUser != null;
  const href = closeHref ?? "/users";

  useEffect(() => {
    if (state?.success === true && open) {
      router.replace(href);
    }
  }, [state?.success, open, href, router]);

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
          placeholder="例如：张三"
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
          placeholder="zhangsan@example.com"
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
      {state?.success === true && (
        <div className="rounded-lg bg-green-50 p-3 text-center text-sm text-green-700">
          {state.isUpdate ? "✅ 修改已保存" : "✅ 用户创建成功！"}
        </div>
      )}
      {state?.error && (
        <div className="rounded-lg bg-red-50 p-3 text-center text-sm text-red-700">
          ❌ {state.error.toString()}
        </div>
      )}
    </form>
  );

  if (!open) return form;

  return (
    <>
      <Dialog open={open}>
        <DialogContent
          className="z-[99999] opacity-100 fixed top-[50%] left-[50%] !translate-x-[-50%] !translate-y-[-50%]"
          showCloseButton={false}
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

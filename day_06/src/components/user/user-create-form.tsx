"use client";

import { useActionState } from "react";

import {
  createUserFormAction,
  type ActionResponse,
} from "@/features/user/user.action";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionResponse | null = null;

export function UserCreateForm() {
  const [state, formAction, pending] = useActionState(
    createUserFormAction,
    initial,
  );

  return (
    <form action={formAction} className="mb-8 flex max-w-md flex-col gap-3">
      <div className="font-medium">
        新建用户（Day 5：Action → Service 闭环）
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">邮箱</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          disabled={pending}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="name">姓名（可选）</Label>
        <Input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          disabled={pending}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "提交中…" : "创建"}
      </Button>
      {state?.error === true ? (
        <p className="text-destructive text-sm" role="alert">
          {state.message}
        </p>
      ) : null}
      {state?.success === true ? (
        <p className="text-muted-foreground text-sm">{state.message}</p>
      ) : null}
    </form>
  );
}

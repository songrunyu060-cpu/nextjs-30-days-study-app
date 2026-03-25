# Day 5：全栈行为架构 — Server Actions 闭环与 Service 下沉

## 学习目标

- 掌握 **`"use server"`** 的边界：哪些代码在服务端执行、如何被客户端触发。
- 理解 **分层**：**Action（入口）→ Use Case（用例）→ Service（原子数据操作）→ DB**。
- 能走通本项目 **用户创建 / 编辑 / 删除** 的完整链路，并说明 **`revalidatePath`** 在闭环中的位置。

---

## 与本项目真实文件对应

| 层级 | 路径 | 职责 |
|------|------|------|
| Server Actions | `src/features/user/user.action.ts` | 解析 `FormData`、调用用例或服务、**缓存失效** |
| Use Case | `src/features/user/use-cases.ts` | 校验（Zod）、区分创建/更新、调用 Service |
| Service | `src/features/user/user.service.ts` | Drizzle CRUD，**不**关心 HTTP/缓存 |
| 数据库 | `src/db/index.ts` | Neon `Pool` + `drizzle-orm/neon-serverless` |
| Schema | `src/schema/` + Zod（`userCreateSchema` 等） | 表结构与表单契约 |
| UI | `src/app/(main)/users/page.tsx`、`UserModal.tsx`、`UserList.tsx` | 展示与表单 |

---

## 1. Server Action 的执行模型

- 文件顶部 **`"use server"`** 表示该模块内导出函数可作为 **Server Action** 被引用。
- 从 **Client Component** 调用时（如 `useActionState(saveUserAction, null)`），Next 会发起 **RPC 风格**的请求，在**服务端**执行函数。
- **不要**在 Action 里使用仅浏览器可用的 API（`window`、`document`）。

---

## 2. 本项目的两条「写」路径

### 2.1 `useActionState` + `saveUserAction`

`UserModal.tsx`（Client）：

- `useActionState(saveUserAction, null)` 绑定表单；
- 提交后服务端执行 `saveUserAction`，内部调用 `saveUserUseCase`，再 `revalidatePath("/users")`。

适合：**需要即时 UI 状态**（`isPending`、成功/失败文案）。

### 2.2 渐进增强：纯 `<form action={...}>` 

`UserList.tsx` 中删除：

- `<form action={deleteUserFormAction}>` 无需客户端 JS 也能提交；
- 服务端 `deleteUserFormAction` 读 `FormData`、删库、`revalidatePath`。

适合：**可访问性**、弱网、或希望减少客户端依赖的场景。

---

## 案例代码 ①：`user.action.ts` —— 写后失效缓存

摘自 `src/features/user/user.action.ts`（节选）：

```ts
"use server";

import { revalidatePath } from "next/cache";
import { deleteUser } from "@/features/user/user.service";
import { saveUserUseCase } from "./use-cases";

function revalidateUserViews() {
  revalidatePath("/users");
}

export async function saveUserAction(prevState: any, formData: FormData) {
  try {
    const data = Object.fromEntries(formData);
    const isUpdate = Boolean(
      data.id !== undefined &&
        data.id !== null &&
        String(data.id).trim() !== "",
    );
    await saveUserUseCase(data);
    revalidateUserViews();
    return { success: true, isUpdate };
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "VALIDATION_FAILED") {
      return { error: "请检查姓名与邮箱格式" };
    }
    return { error: "保存失败" };
  }
}

export async function deleteUserFormAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await deleteUser(id);
  revalidateUserViews();
}
```

完整逻辑（含 `createUserFormAction` 等）见仓库源文件。

---

## 案例代码 ②：`use-cases.ts` —— Zod 与 Service 之间的唯一入口

摘自 `src/features/user/use-cases.ts`（与仓库一致）：

```ts
import { userCreateSchema, userUpdateSchema } from "@/schema";
import { saveUserService } from "@/features/user/user.service";

export async function saveUserUseCase(rawData: unknown) {
  if (!rawData || typeof rawData !== "object") {
    throw new Error("VALIDATION_FAILED");
  }

  const obj = { ...(rawData as Record<string, unknown>) };
  const idRaw = obj.id;
  const id =
    idRaw !== undefined && idRaw !== null && String(idRaw).trim() !== ""
      ? String(idRaw)
      : undefined;
  delete obj.id;

  if (id) {
    const payload = omitEmptyStrings(obj);
    const validated = userUpdateSchema.safeParse(payload);
    if (!validated.success) throw new Error("VALIDATION_FAILED");
    return await saveUserService(validated.data, id);
  }

  const validated = userCreateSchema.safeParse(obj);
  if (!validated.success) throw new Error("VALIDATION_FAILED");
  return await saveUserService(validated.data);
}

// omitEmptyStrings 辅助函数见同文件完整源码
```

---

## 案例代码 ③：`user.service.ts` —— 只管 Drizzle

```ts
import { db } from "@/db";
import { users } from "@/schema";
import { eq, desc } from "drizzle-orm";

export async function getAllUsers() {
  return await db.select().from(users).orderBy(desc(users.id));
}

export async function deleteUser(id: number): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}
```

---

## 案例代码 ④：UI —— `UserModal` + `UserList`

**弹窗表单 + `useActionState`**（`src/app/(main)/users/_components/UserModal.tsx`）：

```tsx
"use client";

import { useActionState } from "react";
import { saveUserAction } from "@/features/user/user.action";

export function UserModal(/* … */) {
  const [state, formAction, isPending] = useActionState(saveUserAction, null);
  return (
    <form action={formAction}>
      <input name="name" />
      <input name="email" type="email" />
      <button type="submit" disabled={isPending}>
        {isPending ? "保存中…" : "提交"}
      </button>
    </form>
  );
}
```

**渐进增强删除**（`UserList.tsx`）：

```tsx
<form action={deleteUserFormAction} className="inline">
  <input type="hidden" name="id" value={user.id} />
  <button type="submit">删除</button>
</form>
```

---

## 3. Use Case 层存在的意义

`use-cases.ts` 中：

- 统一 **`userCreateSchema` / `userUpdateSchema`** 校验；
- 处理「空字符串视为不更新」等**业务规则**；
- 调用 `saveUserService`，**不**直接写 SQL 字符串散落各处。

**好处**：同一套规则可被未来的 **Route Handler (`app/api`)** 或 **后台任务** 复用。

---

## 4. Service 层：只做「原子数据库操作」

`user.service.ts` 注释已点明：**高度复用的原子操作，不管缓存、不管校验**。

- **读**：`getAllUsers`、`getUserById`
- **写**：`saveUserService`、`deleteUser`

**缓存**（`unstable_cache`、`tags`）若引入，建议仍在 **读路径** 封装，写路径在 Action 里 **`revalidatePath` / `revalidateTag`**（见 Day 8-9 文档）。

---

## 5. Neon + Drizzle 注意点（与本项目一致）

- 运行时：`@neondatabase/serverless` + `drizzle-orm/neon-serverless`（`src/db/index.ts`）。
- 迁移：`drizzle.config.ts` 推荐使用 **`DATABASE_URL_MIGRATE`**（Direct）避免 pooler 与 CLI 的兼容问题；注释已说明。

---

## 6. 动手练习

- [ ] 从 `UserModal` 点击保存开始，**单步调试**（或打日志）跟踪：`saveUserAction` → `saveUserUseCase` → `saveUserService` → `revalidatePath`。
- [ ] 故意在 Action 里抛错，观察客户端 `state.error` 的展示路径。
- [ ] 尝试新增一个 **只读 API**（`app/api/users/route.ts`）调用同一 `getAllUsers`，体会 **Action vs Route Handler** 的分工。

---

## 7. 小结

- **Action**：入口与框架集成（表单、重验证、Cookie/Headers 如需）。
- **Use Case**：业务规则与校验的「唯一真相」之一。
- **Service**：持久化与查询的「唯一真相」。
- **本项目**已具备完整闭环；下一阶段（Day 6-7）将把 **URL 与 Modal** 推到路由高级模式。

下一篇：**Day 6-7 — 并行路由与拦截路由**，Modal + 可分享 URL 的架构。

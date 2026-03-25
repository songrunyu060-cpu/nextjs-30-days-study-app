# Day 11-12：Zustand 与局部状态 — 何时不必放进 URL

## 学习目标

- 区分 **服务器状态**（列表数据、权限）与 **客户端 UI 状态**（拖拽中、多选、面板展开）。
- 了解 **Zustand** 在 Client Component 中的用法，以及与 **Server Actions / URL** 的配合边界。
- 明确：**本仓库当前未安装 Zustand**，本章以「**安装 + 最小示例 + 与本项目结合点**」为主。

---

## 与本项目技术栈

| 依赖 | 状态 |
|------|------|
| React 19 + Next 16 App Router | 已使用 |
| Server Actions + Drizzle | 已使用（用户模块） |
| **Zustand** | **未在 `package.json` 中** — 学习日可 `pnpm add zustand` 做分支实验 |

**原则**：能在服务端算清的、需要分享链接的，继续用 **RSC + URL（Day 10）**；只有强交互、短生命周期、无 SEO 需求的，用 **Zustand**。

---

## 1. 什么时候用 Zustand（而不是 Redux / URL）

适合：

- **表格多选**、**拖拽排序**（Kanban）、**复杂向导步骤**中大量中间状态；
- **跨多个 Client 组件**共享，但**不需要**出现在地址栏。

不适合（优先其他方案）：

- **首屏数据**：用 Server Component + `await`；
- **需要分享的状态**：用 **searchParams**；
- **表单提交结果**：`useActionState` 或 Server Action 返回。

---

## 2. 最小 Zustand 示例（学习用）

```bash
pnpm add zustand
```

```tsx
"use client";
import { create } from "zustand";

type UiStore = {
  selectedIds: Set<number>;
  toggle: (id: number) => void;
};

export const useUiStore = create<UiStore>((set, get) => ({
  selectedIds: new Set(),
  toggle: (id) =>
    set(() => {
      const next = new Set(get().selectedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      return { selectedIds: next };
    }),
}));
```

**注意**：`Set` 不可序列化进 URL；若需持久化，可 `localStorage` + `persist` 中间件（按需）。

---

## 案例代码 ②：与 `UserList` 结合 —— 客户端表格 + 多选 + 仍用 Server Action

新建 `features/user/user-selection.store.ts`（安装 Zustand 后）：

```ts
"use client";

import { create } from "zustand";

type SelectionState = {
  selectedIds: number[];
  toggle: (id: number) => void;
  clear: () => void;
};

export const useUserSelection = create<SelectionState>((set, get) => ({
  selectedIds: [],
  toggle: (id) =>
    set(() => {
      const cur = get().selectedIds;
      return {
        selectedIds: cur.includes(id)
          ? cur.filter((x) => x !== id)
          : [...cur, id],
      };
    }),
  clear: () => set({ selectedIds: [] }),
}));
```

**`UserListClient.tsx`（示意）**：在每一行放 checkbox；批量删除可 **`useTransition` + 已导出的 Server Action**（你需在 `user.action.ts` 自行实现 `deleteManyUserAction(ids: number[])`，内部 `inArray` + `revalidatePath`）。

```tsx
"use client";

import { useTransition } from "react";
import { useUserSelection } from "@/features/user/user-selection.store";
import { deleteManyUserAction } from "@/features/user/user.action";

export function UserListClient(props: {
  users: { id: number; name: string | null; email: string }[];
}) {
  const { selectedIds, toggle, clear } = useUserSelection();
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <table>
        <tbody>
          {props.users.map((u) => (
            <tr key={u.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(u.id)}
                  onChange={() => toggle(u.id)}
                  aria-label={`选择用户 ${u.id}`}
                />
              </td>
              <td>{u.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        disabled={selectedIds.length === 0 || isPending}
        onClick={() => {
          startTransition(async () => {
            await deleteManyUserAction(selectedIds);
            clear();
          });
        }}
      >
        {isPending ? "删除中…" : "批量删除"}
      </button>
    </>
  );
}
```

**Server Action 侧（示意，放在 `user.action.ts`）**：

```ts
"use server";

import { inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { users } from "@/schema";

export async function deleteManyUserAction(ids: number[]) {
  if (ids.length === 0) return;
  await db.delete(users).where(inArray(users.id, ids));
  revalidatePath("/users");
}
```

Zustand 只握 **`selectedIds`**；**真相数据与事务**仍在服务端。

---

## 3. 与本项目 `UserList` 的结合思路（练习）

当前 `UserList.tsx` 为 Server Component 友好列表。若要做「多选删除」：

1. 将需要多选交互的部分抽成 **`"use client"`** 子组件（或整表 Client）。
2. Zustand 存 **`selectedIds`**。
3. 删除时：
   - **方案 A**：对每个 id 调现有 **`deleteUserFormAction`**（多次提交，简单但请求多）；
   - **方案 B**：新增 Server Action **`deleteManyAction(ids: number[])`**（一次事务，推荐）。

**数据仍以 Server Action + Drizzle 为真相**；Zustand 只握 UI 选择集。

---

## 4. 与 shadcn / Radix 的配合

- **Checkbox、DropdownMenu、Dialog** 等已在 `components/ui`；Zustand 只存「选中 id」，组件只管展示。
- **无障碍**：多选时记得 `aria-selected`、批量操作按钮禁用态。

---

## 5. 与 Theme 的关系

项目用 **`next-themes`**（`ThemeProvider`）管主题。主题也可放 Zustand，但 **重复造轮**；**继续用 next-themes** 即可。

---

## 6. 动手练习

- [ ] 新分支安装 Zustand，在 `/users` 做一版「多选 + 批量删除」POC。
- [ ] 写一条规则文档：**哪些状态进 URL、哪些进 Zustand**。
- [ ] 压力测试：快速全选时是否触发过多 re-render（必要时 `shallow` 比较或拆分 selector）。

---

## 7. 小结

- **Zustand** 适合 **客户端高密度交互**；**不要**用它替代服务端数据获取。
- **本项目**以 URL + Server Actions 为主流；Zustand 是 **增强项**。
- 与 Day 10 配合：**可分享的用 URL，纯交互的用 store**。

下一篇：**Day 13-14 — PPR（部分预渲染）**。

# Day 3：异步资源消费 — React 19 的 `use` 与 RSC 数据流

## 学习目标

- 理解 React 19 中 **`use(promise)`** 的语义：在 **Client Component** 中消费 **Promise**（含由服务端传入的 Promise）。
- 区分 **`async` Server Component** 直接 `await` 与 **把 Promise 交给客户端 `use`** 两种模式。
- 能结合本项目（Next 16 + React 19 + Drizzle）说明：**数据不会魔法般「自动穿越」**，而是 **序列化边界 + 约定**。

---

## 与本项目技术栈的对应关系

| 能力 | 当前仓库典型写法 |
|------|------------------|
| 服务端取数 | `async` 页面/布局里 `await getAllUsers()`（见 `src/app/(main)/users/page.tsx`） |
| 数据库 | Neon + Drizzle（`src/db/index.ts`、`src/features/user/user.service.ts`） |
| 客户端交互 | `"use client"` + `useActionState`（如 `UserModal.tsx`） |
| 路由与预加载 | `NavLinks.tsx` 中 `Link` + `prefetch` |

**说明**：`use()` 更多出现在「**服务端创建 Promise → 作为 prop 传入客户端组件**」或 **Suspense 边界** 等模式；你当前用户页以 **服务端直接 await** 为主，本节会讲清两者如何选、如何在本项目中做实验。

---

## 1. `use` 是什么

- **签名**：`use(resource)`，`resource` 可以是 **Thenable（含 Promise）** 或 **Context**（与 `useContext` 统一入口）。
- **规则**：在支持 `use` 的 React 版本中，读取 Promise 时组件会 **挂起（suspend）**，需要外层有 **`<Suspense>`** 展示 fallback（或由框架处理流式边界）。

**心智模型**：把「异步结果」变成「组件同步语法」，但**依赖 Suspense** 来接住未完成状态。

---

## 2. 「Promise 顺着网线」到底是什么意思（准确版）

更准确的说法是：

1. **服务端**执行 RSC，可以 `await` 数据库/API，结果进入 **RSC Payload**。
2. 若使用 **`use` + 传入 Promise** 的模式：Promise 必须来自 **可在服务端创建、且能安全跨边界传递** 的约定（具体取决于框架对 Thenable 的序列化支持）。  
3. **客户端**在 hydration 后执行 `use(promise)`，若尚未 resolve，会触发 **Suspense**，而不是让整个页面卡死。

**误区**：并不是「任意 Promise 随便从服务器扔给浏览器」都没有成本；要理解 **React / Next 的序列化与流式协议**。

**在本项目中**：你多数页面采用 **`async function Page()` + `await db...`**，数据在服务端就 resolve 完毕再下发，**简单、可预测**，对 CRUD 后台非常合适。

---

## 3. 三种取数方式对照（建议你按场景选型）

| 方式 | 适用场景 | 在本项目中的位置 |
|------|----------|------------------|
| **Server Component 里 `await`** | 列表页、SEO、首屏数据 | `users/page.tsx` → `getAllUsers()` |
| **`use(Promise)` + Suspense（Client）** | 需要在客户端组件树中挂起/分段展示 | 可作为练习：把某一数据块改为 Promise + `use` |
| **Server Actions + `useActionState` / `useTransition`** | 表单提交、变更后反馈 | `UserModal.tsx` + `saveUserAction` |

---

## 4. 迷你示例：与 Suspense 组合（学习用伪代码）

> 下列为**教学模式**，不要求你立刻改生产代码。

**服务端组件**（创建 Promise 并传入子组件）：

```tsx
import { Suspense } from "react";
import { ClientBlock } from "./ClientBlock";

export default function Page() {
  const usersPromise = getAllUsers(); // 不 await，保持为 Promise
  return (
    <Suspense fallback={<p>加载用户…</p>}>
      <ClientBlock usersPromise={usersPromise} />
    </Suspense>
  );
}
```

**客户端组件**：

```tsx
"use client";
import { use, Suspense } from "react";

export function ClientBlock(props: { usersPromise: Promise<unknown> }) {
  const users = use(props.usersPromise);
  return <pre>{JSON.stringify(users, null, 2)}</pre>;
}
```

**要点**：

- 外层 **`Suspense`** 包住会 `suspend` 的子树。
- **`use` 只能在函数组件内**调用，遵守 Hooks 规则。

---

## 案例代码 ①：本项目当前主路径（Server Component 里 `await`）

与 `src/app/(main)/users/page.tsx` 相同模式：数据在服务端取完再下发，**无需** `use`。

```tsx
import { getAllUsers } from "@/features/user/user.service";

export default async function UsersPage() {
  const allUsers = await getAllUsers();
  return (
    <main>
      {/* 使用 allUsers */}
    </main>
  );
}
```

对应读库实现见 `src/features/user/user.service.ts`：

```ts
export async function getAllUsers(): Promise<User[]> {
  return await db.select().from(users).orderBy(desc(users.id));
}
```

---

## 案例代码 ②：实验分支 —— `Promise` + 客户端 `use`（分段展示）

在**不删除**现有 `await` 的前提下，可新建 `UsersTableClient.tsx` 做对比实验：父组件传入 `usersPromise`，子组件用 `use` 解包（仍建议在服务端创建 Promise，避免把 `DATABASE_URL` 相关逻辑放到客户端）。

**`UsersTableClient.tsx`（`"use client"`）**

```tsx
"use client";

import { use } from "react";
import type { User } from "@/schema";

export function UsersTableClient(props: { usersPromise: Promise<User[]> }) {
  const users = use(props.usersPromise);
  return (
    <ul>
      {users.map((u) => (
        <li key={u.id}>{u.email}</li>
      ))}
    </ul>
  );
}
```

**`page.tsx` 中包一层 `Suspense`（示意）**

```tsx
import { Suspense } from "react";
import { getAllUsers } from "@/features/user/user.service";
import { UsersTableClient } from "./_components/UsersTableClient";

export default async function UsersPage() {
  const usersPromise = getAllUsers();
  return (
    <Suspense fallback={<p className="text-muted-foreground">加载用户列表…</p>}>
      <UsersTableClient usersPromise={usersPromise} />
    </Suspense>
  );
}
```

---

## 案例代码 ③：写操作仍走 Server Action（与 `use` 无关）

客户端表单继续用 `useActionState` + `saveUserAction`（`UserModal.tsx`），**不要**在浏览器里直连 Neon。

```tsx
const [state, formAction, isPending] = useActionState(saveUserAction, null);
// <form action={formAction}> …
```

---

## 5. 与本项目 Neon + Drizzle 的结合点

- **读**：`getAllUsers` 在 `src/features/user/user.service.ts` 使用 `db.select()`；无论用 `await` 还是 `use`，**数据库仍在服务端执行**（除非你把查询错误地放到客户端，那会暴露连接串，绝不可行）。
- **写**：继续使用 **Server Actions**（`src/features/user/user.action.ts`），客户端只提交 `FormData`。

---

## 6. 动手练习

- [ ] 在 `users` 页面临时拆一个 **Client 子组件**，用 `use` 消费由父级 Server Component 传入的 `Promise`（注意 `Suspense`）。
- [ ] 对比：**整页 `await`** vs **`use` 分段**，在 Chrome Performance 里看 **TTFB、主线程、瀑布** 的差异（与 Day 4 衔接）。
- [ ] 阅读 React 官方文档中关于 `use` 与 **错误边界** 的说明（Promise reject 时的行为）。

---

## 7. 小结

- **`use`**：在客户端以同步写法消费 Promise，**必须**配合 **Suspense**（及错误处理策略）。
- **本项目主路径**：Server Component + `await` 已足够清晰；`use` 用于**进阶分段 UI** 或学习 React 19 新模型。
- **安全**：数据库连接与密钥永远只在服务端；客户端只接收**已脱敏、可序列化**的数据或 UI 指令。

下一篇：**Day 4 — Streaming、并行取数、骨架屏**，并关联 Tailwind + shadcn 的 loading 体验。

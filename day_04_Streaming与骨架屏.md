# Day 4：Streaming（流式渲染）实战 — 消灭瀑布、骨架屏与 Tailwind

## 学习目标

- 理解 **Streaming HTML / RSC 流式响应**：先送出壳与可缓存部分，再逐步填充慢数据。
- 会用 **`loading.tsx`**、**`<Suspense>`** 划分异步边界，避免「请求瀑布」拖垮首屏。
- 结合 **Tailwind CSS v4** 与 **shadcn/ui**，实现高表现力的 **Skeleton** 而非空白等待。

---

## 与本项目技术栈的对应关系

| 能力 | 在本仓库中的线索 |
|------|------------------|
| App Router 流式 | 默认能力；`async` 页面分段 + Suspense 时更明显 |
| 全局样式 | `src/app/globals.css`（`@import 'tailwindcss'`、`oklch` 变量） |
| UI 组件 | `src/components/ui/*`（shadcn + Radix） |
| 数据访问 | Neon + Drizzle（`user.service.ts` 等） |
| 客户端导航体验 | `next.config.ts` → `experimental.staleTimes` |

---

## 1. 什么是「请求瀑布」（Waterfall）

典型坏形态：

1. 页面先请求 A；
2. A 返回后才发 B；
3. B 返回后才发 C。

在 **串行** 数据依赖不可避免时（B 真的依赖 A 的 id），瀑布合理；但若 **A 与 C 无依赖** 却写成串行，就会浪费 RTT。

**优化方向**：

- **并行**：`Promise.all([fetchA(), fetchC()])` 或在 RSC 中多个独立 `await` 若在同一层级且无相互依赖，应改为并行启动。
- **分段展示**：用 Suspense 让**快的内容先出来**，慢的内容在 fallback 后填入。

---

## 2. App Router 中的三种「等待 UI」

| 机制 | 作用范围 | 特点 |
|------|----------|------|
| `loading.tsx` | 同目录路由段 | 自动 **Suspense 边界**，切页时即时展示 |
| 显式 `<Suspense fallback={...}>` | 任意子树 | 最灵活，可嵌套 |
| `async` Server Component | 组件内 `await` | 会阻塞**该子树**直到数据就绪（除非外包 Suspense） |

---

## 3. 骨架屏：用 Tailwind + shadcn 做出「像在加载」

设计要点：

1. **结构对齐**：骨架与真实卡片/表格行高一致，避免布局跳动（CLS）。
2. **动效克制**：`animate-pulse` 或 shadcn `Skeleton` 组件（若已安装）。
3. **语义**：对屏幕阅读器用 `aria-busy` / `aria-label` 提示加载中。

**与本项目设计令牌**：`globals.css` 里已有 `--muted`、`--border`、`--radius`，骨架背景优先用 `bg-muted` 或 `bg-accent`，与主题一致。

---

## 4. 结合 `users` 页的改进思路（学习向）

当前 `src/app/(main)/users/page.tsx` 在服务端 **`await getAllUsers()`** 后一次性渲染。若列表查询变慢，整页等待。

可练习的拆分方式（**不必立刻改生产**）：

1. **壳先出**：页面标题、搜索表单静态区立即渲染。
2. **表体 Suspense**：把「用户表格」拆到 `async` 子组件 `<UserTableSection />`，外包 `<Suspense fallback={<UserTableSkeleton />}>`。
3. **并行**：若将来有「统计卡片 + 列表」且互不依赖，`Promise.all` 或在两个 Suspense 子树中分别 `await`。

---

## 案例代码 ①：`loading.tsx`（路由段级骨架）

在 `src/app/(main)/users/loading.tsx` 新建（文件名固定为 `loading.tsx` 时，访问 `/users` 切换会优先看到该 UI）：

```tsx
export default function UsersLoading() {
  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="mb-10 h-10 w-64 animate-pulse rounded-lg bg-muted" />
      <div className="mb-6 h-10 w-full max-w-md animate-pulse rounded-lg bg-muted" />
      <div className="space-y-3 rounded-xl border border-border p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </main>
  );
}
```

说明：`bg-muted`、`-border` 与 `globals.css` 中 shadcn 令牌一致，暗色模式自动协调。

---

## 案例代码 ②：并行取数 —— `Promise.all`（无依赖时）

若某页需要「用户总数 + 图书总数」且查询互不依赖，避免串行 `await`：

```ts
import { db } from "@/db";
import { books } from "@/schema";
import { getAllUsers } from "@/features/user/user.service";

const [users, bookRows] = await Promise.all([
  getAllUsers(),
  db.select().from(books),
]);
```

---

## 案例代码 ③：`Suspense` 包裹慢子树（与当前 `users` 页组合）

新建异步子组件，专门 `await` 列表数据；页面壳（标题、表单）先渲染：

```tsx
// _components/UserListSection.tsx（Server Component）
import { getAllUsers } from "@/features/user/user.service";
import { UserList } from "./UserList";

export async function UserListSection(props: { q: string }) {
  const allUsers = await getAllUsers();
  const lower = props.q.toLowerCase();
  const filtered =
    props.q === ""
      ? allUsers
      : allUsers.filter(
          (u) =>
            u.email.toLowerCase().includes(lower) ||
            (u.name ?? "").toLowerCase().includes(lower),
        );
  return <UserList users={filtered} filterQuery={props.q} />;
}
```

```tsx
// page.tsx（示意）
import { Suspense } from "react";
import { UserListSection } from "./_components/UserListSection";

export default async function UsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  return (
    <main>
      <header>…标题与 GET 表单不变…</header>
      <Suspense
        fallback={
          <div className="rounded-xl border p-8 text-sm text-muted-foreground">
            加载列表中…
          </div>
        }
      >
        <UserListSection q={q} />
      </Suspense>
    </main>
  );
}
```

本地可把 `getAllUsers` 包一层 `await new Promise((r) => setTimeout(r, 1500))` 观察流式效果。

---

## 5. 与 `next.config.ts` 的 `staleTimes`

软导航时，客户端会复用一段时间的 RSC 结果（`dynamic` / `static` 秒数不同）。  
**Streaming + 合理 staleTimes** 一起决定用户感知：**首屏多块出来** + **来回切换是否够新**。与 Day 8-9 的 `revalidatePath` 搭配理解。

---

## 6. 动手练习

- [ ] 在某一 `(main)` 路由下新增 `loading.tsx`，用 Tailwind 做与页面布局一致的骨架。
- [ ] 给 `users` 列表拆一个带 `Suspense` 的子组件，人为 `await new Promise(r => setTimeout(r, 2000))` 观察流式效果（仅本地）。
- [ ] 用 Chrome DevTools **Performance** 与 **Network** 对比：串行 `await` vs `Promise.all`。
- [ ] 检查 `postcss.config.mjs` 的 `content` 是否包含 `./src/**/*.{ts,tsx}`；若骨架类未生效，修正路径（Tailwind 需扫描到文件）。

---

## 7. 小结

- **Streaming** 的目标：更早显示有意义像素，**降低可感知等待**。
- **`loading.tsx` / Suspense** 是 App Router 的核心分段工具。
- **Tailwind v4 + 设计令牌** 让骨架与正式 UI 视觉统一；避免骨架与真实内容高度不一致导致 **CLS**。

下一篇：**Day 5 — Server Actions 与 Service 层闭环**，直接对应你项目中的 `user.action.ts` 与 `user.service.ts`。

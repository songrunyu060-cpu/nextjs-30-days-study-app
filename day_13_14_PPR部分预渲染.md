# Day 13-14：PPR（Partial Prerendering）与「静态壳 + 动态洞」

## 学习目标

- 理解 **PPR / Partial Prerendering** 的目标：一次响应中合并 **静态 HTML** 与 **动态流式区域**，降低 TTFB 与首屏空白。
- 区分 **静态段、动态段、Suspense 洞** 与 **Data Cache**（Day 8-9）之间的关系。
- 知道在 **Next 16** 中相关能力常以 **实验/配置项** 演进，**以官方文档为准**。

---

## 与本项目的关系

- 当前 `next.config.ts` 仅配置了 **`experimental.staleTimes`**，**未**开启完整的 Cache Components / PPR 全家桶。
- 数据层：**Neon + Drizzle**；动态性来自 **数据库与 searchParams**（如 `/users`）。

**学习建议**：在单独分支开启官方文档要求的配置，对 **`/` → `/dashboard` 重定向**、**用户页** 做对比构建（`next build`）与线上体验对比。

---

## 案例代码：用 `Suspense` 模拟「壳与洞」（不依赖 PPR 开关也能练）

即使未开启 PPR，你也可以把 **`/users`** 拆成「静态壳」+「动态列表洞」，体验与 Day 4 一致：

```tsx
// page.tsx —— 壳先渲染，列表在子组件中 await
import { Suspense } from "react";

export default async function UsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  return (
    <main className="mx-auto max-w-6xl p-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold">用户管理系统</h1>
        <p className="text-gray-500">基于 Next.js 16 + Neon + Drizzle</p>
      </header>
      <Suspense fallback={<div className="animate-pulse h-40 rounded-xl bg-muted" />}>
        {/* UserListSection 内部 await getAllUsers() */}
      </Suspense>
    </main>
  );
}
```

**与本项目 `next.config.ts` 的配合**（已存在）：

```ts
const nextConfig = {
  experimental: {
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};
```

PPR 开启后，静态壳与动态洞的**切分策略**可能由框架进一步优化；上式仍是有效的**渐进增强**写法。

---

## 1. 「静态壳 + 动态洞」是什么

- **壳**：构建期或边缘可缓存的 HTML 结构（导航、布局、占位）。
- **洞**：运行时再填充的区域（个性化、实时数据、依赖 `cookies()` / `headers()` 的内容）。

实现上常与 **`Suspense` 边界**、**流式 RSC**、以及框架的 **预渲染策略** 协同。

---

## 2. 与 Streaming（Day 4）的关系

| 概念 | 侧重 |
|------|------|
| **Streaming** | 分段到达、先渲染先显示 |
| **PPR / 部分预渲染** | 哪些段**事先静态化**、哪些段**必定动态** 的划分策略 |

二者常一起出现，但**不等价**。

---

## 3. 与缓存（Day 8-9）的关系

- **Data Cache**（`fetch` / `unstable_cache`）管「数据是否复用」。
- **Full Route / 静态生成** 管「整路由是否预渲染」。
- **PPR** 管「**同一路由**里静态与动态如何拼接」。

修改数据后仍需 **`revalidatePath` / `revalidateTag`**，否则用户可能看到旧洞内容。

---

## 4. Next 16 配置提示（务必查最新文档）

Next 大版本里，以下名称可能迭代：

- **`cacheComponents`** / **`experimental.useCache`** 等  
- 官方博客与 `next.config` 文档会给出 **当前** 开关名。

**本文不写死具体布尔值**，避免与数月后的文档冲突。请你打开：

- [Next.js 官方文档 - Cache Components / PPR 相关章节](https://nextjs.org/docs)（站内搜索 *Partial Prerendering* 或 *use cache*）

并在实验分支中验证。

---

## 5. 与本项目 Neon 的注意点

- **动态洞**若每次打 DB，仍受 **连接延迟** 影响；PPR 不替代数据库优化。
- Serverless（Vercel）上注意 **冷启动** 与 **连接池**（Neon 对 serverless 友好，但仍建议合理缓存读路径）。

---

## 6. 动手练习

- [ ]  fork 配置分支，按官方文档开启 PPR/Cache Components（名称以文档为准）。
- [ ] 对 `users` 页做 **构建分析**：静态与动态边界是否符合预期。
- [ ] 与 Day 4 的 Skeleton 对比：PPR 下 **fallback** 出现频率是否变化。

---

## 7. 小结

- **PPR** 是路由级「静态 + 动态」混合策略，常与 **Suspense/流式** 一起用。
- **本项目**可作为实验场，但**生产开启前**需对照官方稳定说明与团队运维成本。
- **数据一致性**仍依赖 **revalidate** 体系，与 PPR 正交。

下一篇：**Day 15 — Feature-based 架构**（对照 `项目架构.md`）。

# Day 1-2：RSC 物理层与水合（Hydration）深度防御

## 学习目标

- 理解 **App Router** 下一次请求的完整路径：服务端生成 **RSC Payload** → 浏览器下载 → **Hydration** 让客户端 React「接管」已存在的 DOM。
- 能解释常见 **Hydration mismatch** 的根因：服务端 HTML 与客户端首帧渲染不一致。
- 结合本项目，掌握 **`suppressHydrationWarning`、主题脚本、`next-themes`、浏览器插件** 等场景的处理思路。

---

## 与本项目技术栈的对应关系

| 概念 | 在你仓库中的落点 |
|------|------------------|
| Root Layout（服务端组件） | `src/app/layout.tsx` |
| 全局样式与设计令牌 | `src/app/globals.css`（Tailwind v4 `@import 'tailwindcss'` + CSS 变量） |
| 暗色模式（客户端与 SSR 不一致的高发区） | `next-themes` 的 `ThemeProvider` + 根节点 `suppressHydrationWarning` |
| 客户端导航与预加载 | `src/components/custom/NavLinks.tsx`（`usePathname`、`Link`、`prefetch`） |
| 路由缓存可调参数 | `next.config.ts` 里 `experimental.staleTimes` |

---

## 1. RSC「物理层」：一次请求里发生了什么（简化）

1. **服务端**：React Server Components 在服务器上执行，产出 **RSC Flight Payload**（可理解为「组件树 + 数据」的序列化流）。
2. **浏览器**：接收 HTML + JS，先展示**静态 HTML**（可能含占位），再加载 JS。
3. **Hydration**：客户端 React 对比「服务端给出的 DOM」与「客户端第一次 render 应生成的虚拟 DOM」。若不一致，React 会警告 **Hydration failed**。

**关键点**：服务端和客户端**必须**对「首屏可见结构」达成一致；**唯一**可靠在客户端才存在的数据（`window`、`localStorage`、随机数、仅客户端时钟）若直接参与首屏渲染，极易 mismatch。

---

## 2. 本项目中的「水合防御」实战：主题与 `<html>`

### 2.1 为什么根节点需要 `suppressHydrationWarning`

在 `src/app/layout.tsx` 中：

- `<html lang="en" suppressHydrationWarning>`  
- `<head>` 内联脚本在 **hydration 之前**读取 `localStorage`，给 `<html>` 加上或移除 `dark` class。
- `next-themes` 在客户端 hydration 时也会根据存储的主题更新 class。

**结果**：服务端渲染时通常不知道用户本地主题（或默认为 `light`），客户端首帧可能已是 `dark`，**`<html class>` 在服务端与客户端可以合法不一致**。  
`suppressHydrationWarning` 的作用是：**仅对当前节点**，告诉 React「此处允许属性与 SSR 不完全一致」，从而避免无意义的 hydration 报错。

**注意**：这是**窄化修复**，只应加在**确实无法 SSR 对齐**的节点（常见是 `html`/`body` 与主题相关属性），不要滥用到业务组件上掩盖真实 bug。

### 2.2 内联脚本与「闪烁」

同一文件中的内联脚本在 **hydration 前**执行，用于尽快把主题 class 设对，减轻 **FOUC**（样式闪烁）。这与 `ThemeProvider`（`storageKey="app-theme"`）共同构成「先同步本地偏好，再交给 React」的模式。

### 2.3 `next-themes` 与 Tailwind 的 `dark`

- `globals.css` 使用 `@custom-variant dark (&:is(.dark *));` 与 `.dark { ... }` 变量，配合 **`class` 策略**（见 `postcss.config.mjs` 里 `darkMode: ["class"]`）。
- `ThemeProvider` 使用 `attribute="class"`，与 shadcn 体系一致。

---

## 3. 常见 Hydration 问题清单（排查顺序）

1. **直接使用 `window` / `document` / `localStorage`** 参与首屏 JSX（应放到 `useEffect` 或仅在客户端子树中读取）。
2. **日期/时间**：`new Date()`、`Date.now()` 在服务端与客户端不同。
3. **随机数**：`Math.random()`、`crypto.randomUUID()` 若用于 id 且参与首屏。
4. **浏览器插件**：翻译、广告拦截等会改写 DOM，导致与 React 预期不一致（难复现，可无痕窗口对比）。
5. **第三方脚本**：在 React 管理的节点上插入内容。

---

## 4. 与 `next.config.ts` 的关系：`staleTimes`

你项目配置了：

```ts
experimental: {
  staleTimes: { dynamic: 60, static: 300 },
},
```

这影响的是 **客户端 Router Cache**（软导航时 RSC 结果保留多久），**不是** hydration 的直接开关，但会影响「用户感觉页面是否立刻更新」。与 Day 8-9 的 Data Cache / `revalidatePath` 一起理解更完整。

---

## 案例代码 ①：本仓库根布局（主题 + `suppressHydrationWarning`）

下面与 `src/app/layout.tsx` 一致，是水合防御的**标准参考实现**：根节点声明 `suppressHydrationWarning`，内联脚本在 hydration 前读 `localStorage` 同步 `dark` class，再交给 `next-themes`。

```tsx
// src/app/layout.tsx（节选）
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function () {
              try {
                var key = 'app-theme';
                var theme = localStorage.getItem(key);
                var root = document.documentElement;
                if (theme === 'dark') root.classList.add('dark');
                else root.classList.remove('dark');
              } catch (e) {}
            })();`,
          }}
        />
      </head>
      <body className={/* Geist 变量 + Tailwind 令牌 */}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          storageKey="app-theme"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 案例代码 ②：错误 vs 正确 —— 在客户端读 `window`

**错误（易触发 Hydration mismatch）**：在组件函数体内直接读 `window` 并渲染。

```tsx
"use client";
export function Bad() {
  const w = typeof window !== "undefined" ? window.innerWidth : 0;
  return <p>{w}</p>; // SSR 与 CSR 首帧不一致
}
```

**正确**：首屏用占位，客户端挂载后再更新。

```tsx
"use client";
import { useEffect, useState } from "react";

export function Good() {
  const [w, setW] = useState<number | null>(null);
  useEffect(() => {
    setW(window.innerWidth);
  }, []);
  return <p>{w ?? "—"}</p>;
}
```

---

## 5. 动手练习（结合本仓库）

- [ ] 阅读 `src/app/layout.tsx` 全文件，标出：哪些代码只在服务端运行、哪些通过脚本/客户端组件影响浏览器。
- [ ] 临时去掉 `suppressHydrationWarning`，在已保存暗色主题的情况下硬刷新，观察控制台是否出现 hydration 警告。
- [ ] 在无痕窗口与安装翻译插件的窗口分别打开同一页，对比 DOM 是否被插件改写。
- [ ] 在任意 Client Component 中**错误地**在渲染阶段读 `window`，复现 mismatch，再改为 `useEffect` 修复。

---

## 6. 小结（背这几句）

- **RSC**：服务端先算树与数据；**Hydration**：客户端 React 对齐已有 DOM。
- **主题 / localStorage**：根节点用 `suppressHydrationWarning` + 尽早脚本是常见组合；业务组件仍应保持 SSR/CSR 一致。
- **Tailwind v4 + shadcn**：`class` 暗色模式与 CSS 变量一套打通，注意 `postcss` 中 `content` 是否覆盖 `src/**/*`（若类名未生成，检查路径是否包含 `src/app`）。

---

## 7. 延伸阅读（官方）

- Next.js：Server Components、Client Components 边界  
- React：Hydration 与 `suppressHydrationWarning` 适用场景  

下一篇：**Day 3 — `use` 与异步资源**，与 React 19 及本项目的 Server/Client 边界衔接。

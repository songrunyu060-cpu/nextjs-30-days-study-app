# Day 19-21：认证与授权 — Auth.js（NextAuth v5）与 Session

## 学习目标

- 了解 **Auth.js**（原 NextAuth）在 App Router 中的集成方式：**Edge Middleware + Route Handlers + Session**。
- 区分 **认证（你是谁）** 与 **授权（你能做什么）**。
- 规划与本项目 **Neon** 存储用户、与 **Server Actions** 校验 Session 的落点。

---

## 与本项目现状

| 项 | 状态 |
|----|------|
| Auth.js / NextAuth | **未在 `package.json` 中** |
| 用户表 `User` | 已有（`user.schema.ts`），但是否含密码/账号体系需按方案扩展 |
| Middleware | 未建立 |

**本文是实施路线图**，非已部署代码。安装时请查阅 [Auth.js Next.js 文档](https://authjs.dev/getting-started/installation?framework=Next.js) 的**当前**包名与 API（v5 演进较快）。

---

## 案例代码：Route Handler 占位 + 会话读取（示意）

安装 Auth.js 后，通常会有类似入口（**路径与导出以官方为准**）：

```ts
// app/api/auth/[...nextauth]/route.ts —— 名称随版本可能变化
export { GET, POST } from "@/auth"; // 或直接在文件中定义 handlers
```

在 **Server Action** 中读取会话（概念示例）：

```ts
"use server";

import { auth } from "@/auth"; // Auth.js 提供的 auth()

export async function deleteUserFormAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  const id = Number(formData.get("id"));
  // await deleteUser(id) …
}
```

在 **Middleware** 中保护路由（与 Day 16-17 衔接）：

```ts
import { auth } from "@/auth";

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith("/users")) {
    return Response.redirect(new URL("/login", req.url));
  }
});
```

具体 `auth` 工厂、Edge 兼容性以 **Auth.js 当前文档**为准。

---

## 1. 推荐集成形态（概念）

1. **Route Handler**：`/app/api/auth/[...nextauth]/route.ts`（或 v5 推荐路径，以文档为准）。
2. **Session Provider**：仅客户端需要的部分用 `"use client"` 包裹。
3. **Middleware**：匹配受保护路径，未登录重定向。
4. **Server Actions**：`auth()` 或 `getServerSession` 读取会话，**再**执行业务。

---

## 2. 与 Neon + Drizzle

常见方案：

- **Adapter**：使用官方或社区的 **Drizzle Adapter** 将 Account / Session / User 表纳入 PG（需迁移）。
- **JWT vs Database Session**：权衡服务端可撤销性与性能。

**注意**：不要把 **OAuth Client Secret**、**NEXTAUTH_SECRET** 提交到 Git；在 Vercel 环境变量中配置。

---

## 3. 授权与 Server Actions

对每个敏感 Action：

```ts
const session = await auth();
if (!session?.user) throw new Error("UNAUTHORIZED");
// 再查角色/资源所有权
```

**本项目**的 `deleteUserFormAction` 等应在接入 Auth 后加上述检查。

---

## 4. 社交登录与自定义 Session

- **社交登录**：配置 GitHub / Google 等 Provider（控制台回调 URL 填 Vercel 域名）。
- **Session 扩展字段**：在 Auth 配置中 `callbacks.jwt` / `callbacks.session` 增加 `role` 等（以文档为准）。

---

## 5. 与 Vercel 部署

- **环境变量**：`AUTH_SECRET`、`AUTH_URL`（或 `NEXTAUTH_URL`）、各 Provider 的 `ID`/`SECRET`。
- **预览环境**：OAuth 回调 URL 常需为 **每个预览域名** 配置，或使用固定 **Staging** 域名。

---

## 6. 动手练习

- [ ] 在独立分支按官方文档初始化 Auth.js。
- [ ] 实现 `/login` 与 **受保护** `/users`（Middleware + Action 双保险）。
- [ ] 记录 **Session 数据结构** 与 **Zod** 类型，避免 `any`。

---

## 7. 小结

- **Auth** 是横切关注点：与 **Middleware、Actions、Schema** 全链路联动。
- **本项目**预留了用户与图书数据模型；认证层接入后，全栈闭环才完整。

下一篇：**Day 22-23 — 图像与字体**（结合 `next/font` 与 `globals.css`）。

# 登录 / 注册 / 退出登录（NextAuth.js v5 / Auth.js，结合本项目）

> **文档版本：`next-auth@5.0.0-beta.30`**（npm 上的 `5.x` 预览线，底层为 `@auth/core`）。  
> 官方文档入口：[Auth.js · Next.js](https://nextjs.authjs.dev)；从 v4 升级：[Migrating to v5](https://authjs.dev/getting-started/migrating-to-v5)。

> 目标：使用 **NextAuth.js v5** 在你的 Next.js App Router 项目中完成 **注册 / 登录 / 退出 / 获取会话 / 路由保护**。  
> 本文提供学习内容与代码范式（**不强制修改你当前仓库**）；若你本地仍是 v4 写法（例如 `NextAuthOptions` + 单一 `authHandler`），请按本文对照迁移。

---

## 0. 你的项目现状（为什么适合 NextAuth）

你现在已有：

- 页面：`src/app/(auth)/login/page.tsx`、`src/app/(auth)/register/page.tsx`（UI 已经很完整）
- 数据层：`src/db/index.ts`（Neon + Drizzle）
- 用户表：`src/schema/user.schema.ts`（`id/email/name`，可能没有密码字段）
- Server Action 范式：`src/features/user/user.action.ts`（你已经会用 action 做“提交 → 刷新/跳转”）

所以最适合的学习路线是：**保留现有 UI**，把“simulate login/register”替换成 **NextAuth 的真实鉴权**。

---

## 1. 需要先明确的 3 个选择（NextAuth 常见分岔）

### 1.1 采用哪种登录方式？

- **OAuth（GitHub/Google）**：最快上手，但你要去开第三方应用配置回调地址
- **Credentials（邮箱+密码）**：你现在 UI 就是这个，最贴合

本文以 **Credentials** 为主，并说明如何扩展 OAuth。

### 1.2 Session 策略

- **JWT session**：不需要 `Session` 表，但 token 失效控制更依赖策略
- **Database session**：需要 NextAuth 的表（`Session/Account/VerificationToken` 等），可控性更强

结合你项目使用 Neon + Drizzle，推荐：

- 先用 **JWT session** 跑通（更少表）  
- 再进阶到 **Database session + Drizzle Adapter**

### 1.3 你是否“允许 next-auth 管用户表结构”？

Credentials 登录通常需要你自己维护 `User.passwordHash`。  
即使使用 Adapter，也通常仍要自己加 `passwordHash` 字段。

---

## 2. 安装依赖（学习步骤）

### 2.1 必装（锁定 v5 beta）

```bash
pnpm add next-auth@5.0.0-beta.30
```

或跟踪最新 beta：

```bash
pnpm add next-auth@beta
```

> v5 对 `next` 的 peer 范围包含 14 / 15 / 16，请保持 Next 版本在支持范围内。

### 2.2 Credentials 密码哈希（推荐 argon2）

```bash
pnpm add argon2
```

> 也可以 bcrypt，但 argon2 更推荐。

### 2.3 如果你想用 Drizzle Adapter（可选进阶）

```bash
pnpm add @auth/drizzle-adapter
```

> 版本需与当前 `next-auth@beta` 配套；安装冲突时以 npm 提示为准。

---

## 3. 环境变量（必须）

在 `.env` / `.env.local`：

```env
AUTH_SECRET="一个足够长的随机字符串"
AUTH_URL="http://localhost:3000"
```

v5 仍兼容旧名（与 `AUTH_*` 等价）：`NEXTAUTH_SECRET`、`NEXTAUTH_URL`。

如果后续加 GitHub OAuth，可用环境变量自动推断（大写蛇形 + 前缀 `AUTH_`）：

```env
AUTH_GITHUB_ID="xxx"
AUTH_GITHUB_SECRET="xxx"
```

本地或反向代理场景若出现 URL/信任主机相关报错，可额外设置（按官方说明按需开启）：

```env
AUTH_TRUST_HOST="true"
```

学习要点：

- 生产环境必须配置 **`AUTH_SECRET`**（或 `NEXTAUTH_SECRET`），否则不安全或抛错。

---

## 4. 数据库准备（Credentials 必需）

你当前 `src/schema/user.schema.ts` 若没有密码字段，Credentials 登录至少要加：

- `passwordHash`（text）

示意（SQL/迁移自行落地）：

```sql
ALTER TABLE "User" ADD COLUMN "passwordHash" text;
```

> 学习要点：真实项目要 `NOT NULL` + 迁移策略；学习期可先允许 null（用于 OAuth 用户）。

---

## 5. 核心文件结构（v5 在 App Router 的落地形态）

推荐新增（你落地时按这个放）：

- `src/auth.ts`：调用 `NextAuth({...})`，**解构导出** `auth`、`handlers`、`signIn`、`signOut`（以及可选的 `unstable_update` 等）
- `src/app/api/auth/[...nextauth]/route.ts`：把 `handlers` 里的 **GET / POST** 交给 App Router
- `src/middleware.ts`：路由保护（可选，但很常用）

与 v4 的差异（务必记住）：

- **不要再**把 `NextAuth(config)` 的返回值当成“一个 handler”直接赋给 `GET`/`POST`；v5 使用 **`handlers.GET` / `handlers.POST`**（或 `export const { GET, POST } = handlers`）。
- 在 **Server Action / Server Component** 里登录登出，优先使用从 **`@/auth` 导出的 `signIn` / `signOut`**；客户端仍可用 `next-auth/react`。

---

## 6. NextAuth 配置（Credentials 版，v5）

建议：`src/auth.ts`

```ts
import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";
import { z } from "zod";
import { db } from "@/db";
import { userTable } from "@/schema/user.schema";
import { eq } from "drizzle-orm";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (raw) => {
        const input = credentialsSchema.parse(raw);

        const users = await db
          .select()
          .from(userTable)
          .where(eq(userTable.email, input.email))
          .limit(1);

        const user = users[0];
        if (!user?.passwordHash) return null;

        const ok = await argon2.verify(user.passwordHash, input.password);
        if (!ok) return null;

        return { id: String(user.id), email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.sub = user.id;
      return token;
    },
    session: async ({ session, token }) => {
      if (token?.sub) session.user.id = token.sub;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
```

学习要点：

- `authorize` 返回 `null` 就是登录失败。
- **不要**在失败时告诉用户“邮箱存在但密码错”，统一失败即可。
- `trustHost: true` 常见于本地或非标准部署；是否保留请按你的托管环境调整（也可用环境变量 `AUTH_TRUST_HOST`）。
- 类型扩展更完整写法见 [Auth.js · TypeScript](https://authjs.dev/getting-started/typescript)。

---

## 7. Route Handler（必须，v5）

新增：`src/app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

> 若你从 v4 迁移：删除 `export const GET = authHandler` 这类写法，改为上面的解构导出。

---

## 8. 注册（Register）怎么做？

NextAuth 本身不提供“注册”接口（它负责认证流程），注册通常是你自己写：

- Server Action：`registerAction`
- 或 API Route：`POST /api/register`

结合你项目习惯 Server Action，建议注册也用 action。

示例：`src/features/auth/register.action.ts`

```ts
"use server";

import argon2 from "argon2";
import { z } from "zod";
import { db } from "@/db";
import { userTable } from "@/schema/user.schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function registerAction(_: any, formData: FormData) {
  const raw = Object.fromEntries(formData);
  const input = registerSchema.parse(raw);

  const exists = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, input.email))
    .limit(1);

  if (exists.length) return { error: "该邮箱已注册" };

  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

  await db.insert(userTable).values({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  redirect("/login");
}
```

> 若想“注册后自动登录”，可在 Server Action 里 `import { signIn } from "@/auth"` 调用 `signIn("credentials", { email, password, redirectTo: "/dashboard" })`（注意错误处理与 CSRF/重定向行为）；或在客户端成功后再 `signIn("credentials", …)`。

---

## 9. Login 页面如何接入 NextAuth（客户端 / 服务端）

你现在的 `src/app/(auth)/login/page.tsx` 若是客户端组件，推荐仍用 **`next-auth/react`** 的 `signIn`（仅客户端可用）。

### 方式 A：客户端 `signIn`（初学最直观）

v5 中跳转目标优先使用 **`redirectTo`**（`callbackUrl` 仍可用但已标记弃用）：

```ts
import { signIn } from "next-auth/react";

await signIn("credentials", {
  email,
  password,
  redirect: true,
  redirectTo: "/dashboard",
});
```

### 方式 B：Server Action 里 `signIn`（v5 推荐）

```ts
"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(formData: FormData) {
  try {
    await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/dashboard",
    });
  } catch (e) {
    if (e instanceof AuthError) {
      // 处理 CredentialsSignin 等
    }
    throw e;
  }
}
```

### 方式 C：`<form action="/api/auth/callback/credentials">`（更底层，不推荐初学）

初学建议走 A 或 B。

---

## 10. 退出登录（Logout）

### 客户端

```ts
import { signOut } from "next-auth/react";

await signOut({ redirect: true, redirectTo: "/login" });
```

### Server Action（v5）

```ts
"use server";

import { signOut } from "@/auth";

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
```

---

## 11. 获取会话（Server / Client）

App Router 下官方建议：**优先在服务端用 `auth()`**，客户端再用 `useSession`。

### 11.1 Server Component / Route Handler（推荐）

```ts
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return <div>hi {session.user.email}</div>;
}
```

### 11.2 Client Component

需在布局中用 `SessionProvider` 包裹（与 v4 相同，包名仍为 `next-auth/react`）：

```ts
import { useSession } from "next-auth/react";

const { data, status } = useSession();
```

---

## 12. 路由保护（middleware，可选但很实用）

### 12.1 最简：把 `auth` 当作 middleware 导出

`src/middleware.ts`（示意）：

```ts
export { auth as middleware } from "@/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/users/:path*", "/books/:path*"],
};
```

未登录访问受保护路径时，会与 `pages.signIn`（此处为 `/login`）配合重定向。

### 12.2 进阶：`auth` 包装自定义逻辑 + `callbacks.authorized`

v5 可在 `NextAuth({ callbacks: { authorized({ request, auth }) { ... } } })` 里返回 `boolean` 或 `NextResponse`，做更细粒度控制（注意避免重定向死循环）。详见类型提示与 [官方 Middleware 说明](https://nextjs.authjs.dev)。

---

## 13. 进阶：接入 Drizzle Adapter（Database Session）

当你需要：

- 多端登录管理
- 强制退出某设备
- 更严格的 session 失效控制

再考虑把 `session.strategy` 从 `jwt` 切到 **database**，并加：

- `adapter: DrizzleAdapter(db, …)`

同时要创建 NextAuth 标准表（Account/Session/VerificationToken 等）。  
建议你在 **JWT 跑通后**再做，否则一开始表结构会比较多。

---

## 14. 结合你项目的最小落地路线（建议照这个学）

1) 安装 `next-auth@5.0.0-beta.30`（或 `@beta`）+ 配置 `AUTH_SECRET` / `AUTH_URL`（按需 `AUTH_TRUST_HOST`）  
2) `src/auth.ts` 使用 **`export const { auth, handlers, signIn, signOut } = NextAuth({...})`**  
3) `src/app/api/auth/[...nextauth]/route.ts` 使用 **`export const { GET, POST } = handlers`**  
4) 给 `User` 表加 `passwordHash`，写 `registerAction`  
5) `login` 页：客户端用 `next-auth/react` 的 `signIn`，或 Server Action 用 `@/auth` 的 `signIn`  
6) 受保护页面用 `await auth()`；根布局挂 `SessionProvider` 供客户端 `useSession`  
7) 最后加 `middleware.ts` 做统一拦截  
8) 再考虑 OAuth / Drizzle Adapter  

---

## 15. v4 → v5 对照速查

| v4 常见写法 | v5（本文版本） |
|-------------|----------------|
| `NextAuthOptions` + `NextAuth(authOptions)` 当单个 handler | `NextAuth({...})` 解构出 `handlers`、`auth`、`signIn`、`signOut` |
| `route.ts` 里 `GET = POST = NextAuth(...)` | `export const { GET, POST } = handlers` |
| 仅客户端 `signIn` / `signOut` | Server Action 可从 `@/auth` 导入同名方法 |
| `callbackUrl` | 优先 `redirectTo` |

更多细节以 [Migrating to v5](https://authjs.dev/getting-started/migrating-to-v5) 为准。


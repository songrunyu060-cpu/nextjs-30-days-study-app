# Neon + Drizzle ORM + drizzle-kit + drizzle-zod 使用指南

本文面向你的项目技术栈（Neon PostgreSQL + Drizzle ORM + drizzle-kit + drizzle-zod），整理**如何同步数据库结构**、**如何连接 Neon**、**如何生成/执行迁移**、以及**如何用 drizzle-zod 做校验**。

---

## 1. 你需要知道的两条主流同步路径

在 Drizzle 里，同步数据库结构常用两条路线：

### 1.1 开发阶段：`push`（快）

当你在本地改了 `schema.ts`，想让远程 Neon 数据库立刻生效、不太在意迁移历史：

```bash
npx drizzle-kit push
```

- **作用**：对比“代码 schema”与“远程数据库结构”，把差异直接推到数据库
- **场景**：快速原型、个人开发、频繁试错
- **注意**：它不强调迁移文件的审计/回溯，团队协作与生产环境不建议依赖它作为唯一流程

### 1.2 生产阶段：`generate` + `migrate`（稳）

当你要可追溯、可审计、可回滚（至少可定位变更），推荐走迁移文件：

1) 生成迁移 SQL：

```bash
npx drizzle-kit generate
```

- **作用**：在 `drizzle/` 目录生成新的 `*.sql` 迁移文件  
- **建议**：迁移文件应提交到 Git（这是“变更记录”）

2) 执行迁移到 Neon：

```bash
npx drizzle-kit migrate
```

- **作用**：按顺序执行未运行过的迁移脚本

---

## 2. 项目里的命令脚本（你当前已配置）

你的 `package.json` 中已经有对应脚本（推荐直接用脚本跑）：

- `pnpm db:generate` → `drizzle-kit generate`
- `pnpm db:migrate` → `drizzle-kit migrate`
- `pnpm db:studio` → `drizzle-kit studio`

---

## 3. 环境变量：连接 Neon 的关键

确保 `.env` 或 `.env.local` 有：

```env
DATABASE_URL=postgres://user:password@xxx.neon.tech/db?sslmode=require
```

- **Neon 必须带 TLS**：通常你会看到 `sslmode=require`
- **不要提交真实 DATABASE_URL**：用 `.env.local` 或部署平台环境变量

---

## 4. drizzle.config.ts（drizzle-kit 的入口配置）

`drizzle-kit` 的所有命令都依赖配置文件（通常叫 `drizzle.config.ts`）。

示例（按你的项目结构自行调整 schema 路径）：

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

要点：

- **schema**：指向你 Drizzle 表定义文件（你项目里在 `src/schema/`）
- **out**：迁移 SQL 输出目录（你项目已有 `drizzle/`）
- **dbCredentials.url**：使用 `DATABASE_URL`

---

## 5. 代码中如何连接 Neon（PostgreSQL）

你项目当前是 Neon serverless + Drizzle（见 `src/db/index.ts`）：

```ts
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool, { schema });
```

说明：

- `@neondatabase/serverless` + `drizzle-orm/neon-serverless` 适合在 serverless/runtime 场景使用
- `drizzle(pool, { schema })` 建议把 schema 传进去，能获得更好的类型推导与体验

---

## 6. Drizzle Studio：可视化管理 Neon 数据

Drizzle Studio 类似 Prisma Studio，用浏览器可视化操作数据库：

```bash
npx drizzle-kit studio
```

特性：

- 会读取 `drizzle.config.ts` 里的 `dbCredentials`
- 直接连到 Neon 云端库，方便查看表结构、数据、调试

补充：你也可以用 Neon 控制台自带的 SQL Editor / Tables UI。

---

## 7. drizzle-zod：把表结构“同步成校验 Schema”

你项目已安装 `drizzle-zod`，并在 `src/schema/user.schema.ts` 用了 `createInsertSchema`：

```ts
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { userTable } from "./user.schema";

export const userCreateSchema = createInsertSchema(userTable, {
  email: z.email(),
  name: z.string().min(1).nullable().optional(),
}).omit({ id: true });

export const userUpdateSchema = userCreateSchema.partial();
```

推荐用法（实践建议）：

- **Insert 校验**：用 `createInsertSchema(table)` 做基础生成，再补更严格规则（如 `min/max/regex`）
- **Update 校验**：对 insert schema `.partial()`，并按业务要求做必填/可选拆分
- **Action/Use-case 层统一校验**：把 Zod 校验放在 server action 或 use-case 入口，保证所有写入都过同一套规则

---

## 8. 推荐工作流（给你一个“可坚持”的节奏）

### 日常开发（速度优先）

- 改 `src/schema/*`
- 本地快速同步到 Neon：`pnpm db:push`（如果你有该脚本）或 `npx drizzle-kit push`
- 用 `pnpm db:studio` 看数据

### 准备合并/上线（稳定优先）

- 改 `src/schema/*`
- `pnpm db:generate` 生成迁移 SQL（检查 SQL 是否符合预期）
- 提交 `drizzle/*.sql`
- 部署或发布阶段跑：`pnpm db:migrate`

---

## 9. 常见坑 & 排查

- **迁移生成了但没生效**：你可能只跑了 `generate`，没跑 `migrate`
- **push 报对比异常**：确认 `schema` 路径是否正确、`DATABASE_URL` 是否指向目标库
- **Neon 连接失败**：检查 `DATABASE_URL` 是否带 `sslmode=require`
- **类型推导很弱**：确认 `drizzle(pool, { schema })` 传了 schema

---

## 10. 你可以直接复制到 README 的最短版

```bash
# 生成迁移
pnpm db:generate

# 执行迁移到 Neon
pnpm db:migrate

# 打开 Drizzle Studio
pnpm db:studio
```


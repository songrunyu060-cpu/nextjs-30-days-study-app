# Day 15：垂直功能拆分（Feature-based Architecture）

## 学习目标

- 理解 **`app/` 只做路由映射**、**`features/` 承载业务** 的分工（与仓库内 `项目架构.md` 一致）。
- 能画出本项目中 **`users` 功能** 的文件依赖图。
- 知道何时把代码从 `components/` 下沉到 `features/<name>/`。

---

## 与本项目目录的对应

当前主线（示例）：

```
src/
├── app/(main)/users/           # 路由入口：page、layout、局部 _components
├── features/user/
│   ├── user.action.ts          # Server Actions
│   ├── user.service.ts         # Drizzle 原子操作
│   └── use-cases.ts            # 校验 + 业务规则
├── components/
│   ├── ui/                     # shadcn 通用组件
│   └── custom/                 # 如 NavLinks
├── schema/                     # Drizzle 表 + drizzle-zod
└── db/index.ts                 # Neon 连接
```

**要点**：`app/**/_components` 可以放**仅该路由使用**的 UI；跨页面复用的业务逻辑仍宜在 **`features/`**。

---

## 案例代码：用户模块依赖链（从路由到 DB）

```text
src/app/(main)/users/page.tsx
  ├─ import getAllUsers        ← src/features/user/user.service.ts
  ├─ import UserModal          ← ./_components/UserModal.tsx
  │     └─ saveUserAction      ← src/features/user/user.action.ts
  │           └─ saveUserUseCase ← src/features/user/use-cases.ts
  │                 └─ saveUserService ← user.service.ts
  │                       └─ db       ← src/db/index.ts (Neon Pool + drizzle)
  └─ import UserList           ← ./_components/UserList.tsx
        └─ deleteUserFormAction ← user.action.ts
```

**`src/db/index.ts`（连接 Neon，与仓库一致）**：

```ts
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "@/schema";

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return url;
}

const pool = new Pool({ connectionString: getDatabaseUrl() });
export const db = drizzle(pool, { schema });
```

---

## 1. 三层边界（复习）

| 层 | 放什么 | 本项目例子 |
|----|--------|------------|
| **app** | 路由、布局、组合页面 | `users/page.tsx` 组装 `UserList` + `UserModal` |
| **features** | 用例、Action、领域服务 | `user.action.ts`、`use-cases.ts`、`user.service.ts` |
| **components/ui** | 无业务含义的 UI 原语 | `Dialog`、`Button` |

---

## 2. 何时新建 `features/<feature>`

出现以下任一信号即可考虑：

- 多个路由共享同一套 **Action / Service**；
- 需要独立 **schema** 与 **测试**；
- 团队多人并行开发，需减少 `app` 目录冲突。

---

## 3. 与 shadcn 的关系

- **`components/ui`** 由 shadcn CLI 生成，**不要**把业务 SQL 写进 UI 组件。
- 业务组件可以放在 `features/user/components`（若未来抽出），当前项目在 `app/.../_components` 亦可行——**规模变大时再迁移**。

---

## 4. Neon / Drizzle 放在哪

- **连接单例**：`src/db/index.ts`（全局基础设施）。
- **表定义与 Zod**：`src/schema/`。
- **按实体分文件**：`user.schema.ts`、`book.schema.ts` 等，便于 Feature 对齐。

---

## 5. 动手练习

- [ ] 根据 `项目架构.md` 画一张 **users 模块依赖图**（从 `page.tsx` 到 `db`）。
- [ ] 假设新增「借阅」功能：列出会新增哪些 `features/loan/` 文件与哪些 `app` 路由。
- [ ] 讨论：`NavLinks` 属于 `components/custom` 还是 `features/shell`？（团队约定即可）

---

## 6. 小结

- **Feature-based** 的目标：**高内聚、可测试、可并行**。
- **本项目**已用 `features/user` 体现核心模式；后续按业务增量拆分即可。

下一篇：**Day 16-17 — 全栈安全**（Middleware、Action 鉴权、CSRF）。

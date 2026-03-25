# Day 18：Schema 驱动开发 — Zod、`drizzle-zod` 与全栈契约

## 学习目标

- 理解 **单一数据源**：Drizzle 表结构 → **插入/更新规则** → Server Action / Form。
- 掌握本项目中 **`createInsertSchema` + 细化规则** 的模式。
- 区分 **`userCreateSchema` / `userUpdateSchema`** 在创建与更新中的用法（见 `use-cases.ts`）。

---

## 与本项目真实代码

文件：`src/schema/user.schema.ts`（节选概念）：

- **`users` 表**：`pgTable("User", { ... })`，注意与数据库真实表名一致。
- **`userCreateSchema`**：`createInsertSchema(users, { email: z.email(), ... }).omit({ id: true })`
- **`userUpdateSchema`**：`userCreateSchema.partial()` — 更新允许部分字段。

依赖版本：**Zod 4.x**（`package.json`）、**drizzle-zod** 与 Drizzle ORM 配套。

---

## 案例代码 ①：`user.schema.ts` —— 表 + `createInsertSchema`

摘自 `src/schema/user.schema.ts`：

```ts
import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod";

export const users = pgTable("User", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
});

export const userCreateSchema = createInsertSchema(users, {
  email: z.email(),
  name: z.string().min(1).nullable().optional(),
}).omit({ id: true });

export const userUpdateSchema = userCreateSchema.partial();
```

---

## 案例代码 ②：`createUserFormAction` —— 校验失败直接返回可读文案

摘自 `src/features/user/user.action.ts`：

```ts
export async function createUserFormAction(
  _prev: ActionResponse | null,
  formData: FormData,
): Promise<ActionResponse> {
  const nameRaw = formData.get("name");
  const input = {
    email: String(formData.get("email") ?? "").trim(),
    name: typeof nameRaw === "string" && nameRaw.trim() ? nameRaw.trim() : null,
  };

  const parsed = userCreateSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("；");
    return { error: true, message: msg || "校验失败" };
  }

  try {
    await saveUserService(parsed.data as NewUser);
    revalidateUserViews();
    return { success: true, message: "已创建" };
  } catch {
    return { error: true, message: "写入失败（例如邮箱已存在）" };
  }
}
```

---

## 案例代码 ③：图书表 —— 扩展下一业务域

`src/schema/book.schema.ts`：

```ts
import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description"),
});
```

可同样用 `createInsertSchema(books, { ... })` 生成 `bookCreateSchema`，与 Day 28-30 综合项目衔接。

---

## 1. 为什么用 drizzle-zod

- **从表结构生成基础 schema**，减少「DB 与校验规则漂移」。
- 在 `email` 等字段上用 **`z.email()`** 等覆盖默认推断，贴近业务。

---

## 2. 数据流中的三处校验

| 阶段 | 文件 | 作用 |
|------|------|------|
| Use Case | `use-cases.ts` | `safeParse` 失败抛 `VALIDATION_FAILED` |
| 专用 Action | `createUserFormAction` | 直接 `safeParse`，返回可读 `message` |
| 表单展示 | `UserModal` | 展示 Action 返回的错误文案 |

**原则**：**不要相信**客户端 HTML5 `required`  alone；服务端必须再验。

---

## 3. 与 Server Actions 的两种风格

1. **`saveUserAction` + `useActionState`**：错误映射为 `state.error` 字符串（见 `user.action.ts`）。
2. **`createUserFormAction`**：返回 `{ error: true, message: string }`，更适合作国际化扩展。

学习时可以统一一种风格，避免团队混乱。

---

## 4. 与 Neon / PostgreSQL 的约束对齐

- DB 层：`email` **UNIQUE**（见 schema）。  
- Zod 层：格式合法。  
- 捕获插入时的唯一约束冲突，给用户 **「邮箱已存在」** 类提示（`createUserFormAction` 已用泛化文案）。

---

## 5. `book.schema.ts` 等扩展

仓库已有 `books` 表（`src/schema/book.schema.ts`），后续「图书」功能可复用同一模式：**表 → insertSchema → Action**。

---

## 6. 动手练习

- [ ] 给 `name` 增加 **最大长度** 与 **trim** 规则，观察校验错误在 UI 上的展示。
- [ ] 用 `z.infer<typeof userCreateSchema>` 导出类型，替换部分手写类型（若适用）。
- [ ] 读 `drizzle-zod` 文档：了解 **`createSelectSchema`** 等其它工厂。

---

## 7. 小结

- **Schema 驱动** = DB、校验、类型三者尽量同源。
- **本项目**已具备 `user` 的完整示例；复制到 `book` / `loan` 即可扩展业务。

下一篇：**Day 19-21 — Auth.js / NextAuth v5**（需新装依赖，本仓库尚未集成）。

# Day 28-30：综合大项目 — 全栈「纸迹书海」AI 图书馆（规划）

## 学习目标

- 把前 27 天的能力收敛成一个 **可演示的全栈应用**：图书管理、借阅闭环、（可选）AI 推荐。
- 严格复用本仓库已有栈：**Next 16、React 19、Neon、Drizzle、Tailwind v4、shadcn、Zod、Vercel**。

---

## 与本项目已有基础

| 模块 | 已有资产 |
|------|----------|
| 应用名 / 元数据 | `layout.tsx` 中 `metadata`（「纸迹书海」） |
| 图书表 | `src/schema/book.schema.ts`：`books`（`id, title, author, description`） |
| 用户表 | `user.schema.ts` |
| 导航 | `NavLinks` 含「图书列表」`/books` |
| 用户 CRUD | `features/user` + `/users` 全套可参考 |

**你需要做的**：实现 **`/books` 路由**、借阅相关 **schema 与 features**、（可选）调用 AI API 的 Route Handler 或 Server Action。

---

## 案例代码 ①：`features/book/book.service.ts`（列表查询示意）

```ts
import { db } from "@/db";
import { books } from "@/schema";
import { desc } from "drizzle-orm";

export async function getAllBooks() {
  return db.select().from(books).orderBy(desc(books.id));
}
```

---

## 案例代码 ②：`app/(main)/books/page.tsx`（与 `users` 同构）

```tsx
import Link from "next/link";
import { getAllBooks } from "@/features/book/book.service";

export default async function BooksPage() {
  const list = await getAllBooks();
  return (
    <main className="mx-auto max-w-6xl p-8">
      <h1 className="text-3xl font-bold">图书列表</h1>
      <ul className="mt-6 space-y-2">
        {list.map((b) => (
          <li key={b.id}>
            <Link href={`/books/${b.id}`} className="text-blue-600 hover:underline">
              {b.title}
            </Link>
            <span className="text-muted-foreground"> — {b.author}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

---

## 案例代码 ③：AI 推荐 —— Route Handler（密钥仅服务端）

`src/app/api/recommend/route.ts`：


```ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  const query = typeof body?.query === "string" ? body.query : "";
  if (!query) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // 此处调用 OpenAI / 其他模型；切勿把 apiKey 发给浏览器
  return NextResponse.json({ titles: ["示例图书 A", "示例图书 B"] });
}
```

部署时在 **Vercel 环境变量** 配置 `OPENAI_API_KEY`，**不要**使用 `NEXT_PUBLIC_` 前缀。

---

## 1. 功能切片（建议里程碑）

### Milestone A：图书 CRUD（无 AI）

- **页面**：`/books` 列表、`/books/[id]` 详情、`/books/new` 或 Modal + searchParams（延续 Day 10 风格）。
- **分层**：`features/book/book.service.ts`、`book.action.ts`、`schema` 已部分存在，可扩展字段（`isbn`、`coverUrl` 等）。
- **校验**：`drizzle-zod` 生成 `bookCreateSchema`。
- **缓存**：列表读 `unstable_cache` + `tags:['books']`，写后 `revalidateTag`（Day 8-9）。

### Milestone B：借阅 / 库存

- 新表：`loans`（`userId`, `bookId`, `borrowedAt`, `dueAt`, `returnedAt`）。
- **授权**：接入 Day 19-21 的 Auth 后，用户只能操作自己的借阅；管理员可看别人。

### Milestone C：AI 推荐（可选）

- **Route Handler** `app/api/recommend/route.ts`：服务端调 OpenAI / 其它模型，**API Key 仅服务端**。
- **输入**：用户最近借阅 genre 或手动选的标签；**输出**：结构化 JSON + 错误处理。
- **注意**：速率限制、成本控制、提示词注入防护。

---

## 2. UI / UX（shadcn + Tailwind）

- 列表：**Table + Skeleton**（Day 4）。
- 表单：**React Hook Form + Zod resolver**（项目已装 `@hookform/resolvers`）。
- 图片：封面用 **`next/image`**（Day 22-23），配置 `remotePatterns`。

---

## 3. 数据与部署

- **Neon**：生产/预览/开发 **分库或分 Schema**，迁移用 `DATABASE_URL_MIGRATE`。
- **Vercel**：环境变量放 AI Key、数据库 URL；**切勿** `NEXT_PUBLIC_` 暴露密钥。

---

## 4. 测试与质量（Day 24-25）

- Vitest：`loan` 规则单元测试（逾期罚金、续借次数）。
- Playwright：借书 → 列表状态变更 → 还书。

---

## 5. 验收清单（建议）

- [ ] `/books` 可筛选、可分享 URL（Day 10）。
- [ ] 创建/编辑/删除图书后列表立即一致（Day 8-9 + Actions）。
- [ ] Lighthouse：性能与无障碍无红色大块（图片与字体 Day 22-23）。
- [ ] 生产环境变量与迁移流程文档化（Day 26-27）。

---

## 6. 小结

- **本项目**已具备 **用户模块范本** 与 **图书表起点**；综合项目主要是 **复制模式、扩展领域**。
- **AI** 是增值模块，**先把 CRUD 与权限做稳** 再叠加。

---

恭喜完成 30 天路线图的「最后一站」规划；真正掌握取决于你是否**动手把 `/books` 做到可上线**。若你希望，我可以在后续对话里按里程碑帮你拆 **具体文件清单与顺序**（仍可通过文档与分支完成，而不动你主分支）。

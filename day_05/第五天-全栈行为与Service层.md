# Day 5：全栈行为架构（Server Actions × Service 层）

对应总计划：**掌握 Server Actions 的闭环设计，逻辑下沉到 services 层**。  
本仓库已有实现骨架，请对照阅读：

| 层级 | 职责 | 项目中的文件 |
|------|------|----------------|
| **Schema** | 表结构 + Zod 契约（与 DB / 表单对齐） | `src/schema/user.schema.ts` |
| **Service** | 纯业务与数据访问，无 `"use server"`，可被 RSC / Action / 未来 API 复用 | `src/features/user/user.service.ts` |
| **Server Action** | 入口：解析入参、校验、调用 service、`revalidatePath` / `revalidateTag` | `src/features/user/user.action.ts` |
| **Page / UI** | RSC 拉列表；Client 或 `<form action>` 触发变更 | `src/app/(main)/users/page.tsx`、`src/features/user/components/user-create-form.tsx` |

---

## 1. 为什么要拆成 Action 和 Service？

- **Action** 是「HTTP 边界」：面向表单或客户端调用，要做校验、鉴权（日后）、缓存失效、审计日志等。
- **Service** 是「领域逻辑 + 持久化」：同一套 `createUser` / `getAllUsers` 可以被：
  - Server Component 直接 `await getAllUsers()`（读路径，零客户端 JS）；
  - Server Action 在 mutation 里调用；
  - 将来 `route.ts` 或队列任务复用。

把 SQL/ORM 写在 Action 里会导致逻辑无法复用、难以单测，也与你在 `项目架构.md` 里定义的 **features 垂直切分** 一致。

---

## 2. Server Actions 闭环指什么？

一条完整的 mutation 路径建议固定为：

1. **输入**：`FormData` 或序列化对象（来自 Client 或 `<form>`）。
2. **校验**：`schema.safeParse`（推荐）或 `parse`（失败抛错由 Error Boundary / 全局处理）。
3. **执行**：只调用 service，不在 Action 里堆 SQL。
4. **缓存**：`revalidatePath("/users")` 或 `revalidateTag("users")`，让列表与详情立即一致。
5. **反馈**：向 UI 返回 `{ ok, message }`（配合 `useActionState`）或依赖 `redirect()`。

本日案例代码演示 **Form + `useActionState` + `createUserFormAction`** 的反馈闭环；删除使用 **渐进增强的 `<form action>`**（无 JS 也能提交）。

---

## 3. 与 Day 1–4 的关系

- Day 1–2：hydration / 客户端边界——**mutation 表单**通常放在 Client Component 或原生 form，避免把敏感逻辑塞进浏览器。
- Day 3：`use` 与异步数据——读仍可在 RSC 用 service；写走 Action。
- Day 4：Streaming——列表页可先流式出壳，再出列表；**revalidate** 后整页或局部会按缓存策略更新。

---

## 4. 自测清单

- [ ] 能说明：为什么 `user.service.ts` 不写 `"use server"`。
- [ ] 能指出：`createUserFormAction` 与 `createUserAction` 各自适合哪种调用方式。
- [ ] 修改 `revalidatePath` 为错误路径时，列表不更新——理解缓存失效范围。
- [ ]（进阶）把校验错误从 `message` 拆成 **字段级** `fieldErrors`（Zod `flatten()`）。

---

## 5. 案例代码位置（本仓库）

- 学习笔记：本文档 `day_05/第五天-全栈行为与Service层.md`
- Action 扩展：`src/features/user/user.action.ts`（`createUserFormAction`、`deleteUserFormAction`）
- 创建表单：`src/features/user/components/user-create-form.tsx`
- 列表与删除表单：`src/app/(main)/users/page.tsx`

# Day 10：Search Params 驱动 — URL 即状态

## 学习目标

- 将 **分页、筛选、弹窗开关** 等 UI 状态收敛到 **URL Search Params**，实现可分享、可刷新、可回溯。
- 掌握 App Router 中 **`searchParams` 为 Promise**（Next 15+）时的 **`await` 写法**。
- 结合本项目 **`/users`** 页面，理解 **GET 表单** 与 **`Link` 拼接** 两种更新 URL 的方式。

---

## 与本项目真实代码

核心文件：`src/app/(main)/users/page.tsx`。

当前已使用的参数：

| 参数 | 含义 |
|------|------|
| `q` | 按姓名或邮箱筛选 |
| `edit` | 编辑某用户 ID，打开弹窗并加载该用户 |
| `create` | 非空时打开「新建用户」弹窗 |

列表行与「新增」按钮通过 **`Link`** 或 **GET `form`** 维护这些参数，避免把筛选状态只放在 `useState` 里。

---

## 案例代码 ①：页面 —— `await searchParams` + 派生状态

摘自 `src/app/(main)/users/page.tsx`：

```tsx
type PageProps = {
  searchParams: Promise<{ q?: string; edit?: string; create?: string }>;
};

export default async function UsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const allUsers = await getAllUsers();

  const editRaw = sp.edit;
  const editId =
    editRaw !== undefined && String(editRaw).trim() !== ""
      ? Number(editRaw)
      : NaN;

  const editingUser = Number.isFinite(editId)
    ? allUsers.find((u) => u.id === editId)
    : undefined;

  const createOpen =
    sp.create !== undefined && String(sp.create).trim() !== "";

  const filtered =
    q === ""
      ? allUsers
      : allUsers.filter(
          (u) =>
            u.email.toLowerCase().includes(q.toLowerCase()) ||
            (u.name ?? "").toLowerCase().includes(q.toLowerCase()),
        );

  return (
    <main>
      {/* … */}
      <UserList users={filtered} filterQuery={q} />
      {editingUser && <UserModal editingUser={editingUser} open closeHref={/* … */} />}
      {createOpen && <UserModal open closeHref={/* … */} />}
    </main>
  );
}
```

---

## 案例代码 ②：GET 表单 —— 筛选不丢 `edit`

```tsx
<form action="/users" method="get" className="mb-6 flex …">
  {Number.isFinite(editId) ? (
    <input type="hidden" name="edit" value={String(editId)} />
  ) : null}
  <input type="search" name="q" defaultValue={q} placeholder="按姓名或邮箱筛选…" />
  <button type="submit">筛选</button>
</form>
```

---

## 案例代码 ③：`Link` —— 新增用户时保留 `q`

```tsx
<Link
  href={`/users?create=1${q !== "" ? `&q=${encodeURIComponent(q)}` : ""}`}
  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
>
  新增用户
</Link>
```

---

## 案例代码 ④：`UserList` —— 编辑链保留筛选词

```tsx
const qParam =
  filterQuery.trim() !== ""
    ? `&q=${encodeURIComponent(filterQuery.trim())}`
    : "";

<Link href={`/users?edit=${user.id}${qParam}`}>编辑</Link>
```

---

## 1. 为什么用 URL 管理状态

- **可分享**：把链接发给同事即复现同一筛选/弹窗。
- **可 SEO**：若需要，可对规范化 URL 做索引策略（查询参数需权衡重复内容）。
- **可调试**：刷新不丢状态；比纯客户端 state 更少「玄学」。
- **与浏览器协作**：前进/后退天然可用。

---

## 2. `searchParams` 的类型与 `await`

在 Next 15+ App Router 中，页面 props 常见形态为：

```ts
type PageProps = {
  searchParams: Promise<{ q?: string; edit?: string; create?: string }>;
};

export default async function UsersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  // ...
}
```

**本项目已采用 `await searchParams`**，这是学习模板。

---

## 3. 三种更新 Search Params 的方式

| 方式 | 适用 | 本项目中的例子 |
|------|------|----------------|
| **`<Link href="...">`** | 明确导航 | `新增用户`、`编辑`、清除筛选 |
| **`<form method="get" action="/users">`** | 搜索框提交 | 筛选表单 |
| **`router.push` / `useRouter`（Client）** | 编程式改 URL | 可在未来复杂交互中使用 |

**原则**：能用 **声明式 `Link`** 就不用 imperative，利于预取与可预测行为。

---

## 4. 与 Modal 的配合

- `edit` / `create` 与 **`UserModal`** 的 `open` 联动：服务端根据 `searchParams` 决定是否渲染 `<UserModal open />`。
- **关闭**：`DialogClose` 使用 **`Link` 回到 `closeHref`**（去掉 query），避免仅本地 `useState` 关闭导致 URL 仍带 `edit`。

这保证了 **URL 与 UI 同源**。

---

## 5. 分页（本仓库可扩展练习）

若增加分页，建议参数：`page`、`pageSize`（或 `cursor`）。

- **Server Component** 列表：在 `page.tsx` 读 `sp.page`，传给 `getAllUsers` 的封装（需在 Service 层加 `limit/offset`）。
- **不要用** 仅客户端 state 存页码，否则刷新即丢。

---

## 6. 与 SEO / Analytics

- 项目已装 **`@vercel/analytics`**：URL 规范化后，分析漏斗更清晰。
- 若公开列表页需索引，评估 `?q=` 是否用 `noindex` 或 canonical（视产品而定）。

---

## 7. 动手练习

- [ ] 在 `users` 上增加 `?sort=id_asc|id_desc` 并走 URL 驱动排序（练习 Service 层排序）。
- [ ] 用手机分享当前筛选链接给另一设备，验证状态一致。
- [ ] 列出：哪些状态**必须** URL、哪些可保留客户端（例如输入法组合键、临时 hover）。

---

## 8. 小结

- **URL 即单一数据源** 时，分享与刷新成本最低。
- **`await searchParams`** 是当前 Next 推荐的异步入口写法。
- **本项目**已具备典型实现；后续 Day 11-12 会在 **客户端复杂交互** 中与之分工。

下一篇：**Day 11-12 — Zustand 与局部状态**。

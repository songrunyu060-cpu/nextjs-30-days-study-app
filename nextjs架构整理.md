# Next.js 架构问题整理

### 1. 如何设计获取数据库数据的文件目录和文件名

实现一套逻辑，三处复用，我们必须坚持“逻辑下沉”到 services 层的原则

  - services 目录用于存放业务逻辑  直接操作数据库 Server Component可以直接调用
  - server actions 目录用于存放服务器端 action (服务器函数) 需要使用 use server 修饰 用于客户端组件中
  - app/api 目录用于存放 API 路由 用于外部调用

假设我们要实现一个 “获取热门商品列表 (Hot Products)” 的功能：
1. Server Component: 页面加载时直接渲染（SEO 友好）。
2. Client Component: 用户点击“刷新”按钮时，通过 Server Action 重新获取。
3. 外部调用: 移动端 App 通过 API 接口获取 JSON 数据。

```ts
// services/product.service.ts
import { db } from "@/lib/db";

// 统一的业务逻辑：获取热门商品
export async function getHotProducts(limit = 5) {
  return await db.product.findMany({
    where: { isHot: true },
    take: limit,
    orderBy: { sales: 'desc' }
  });
}
```

```ts
// 1 Server Component (直接导入)
export default async function Home() {
  const products = await getHotProducts();
  return <div>{products.map(p => p.name).join(', ')}</div>;
}
```
```ts
// 2 Client Component (通过 Server Action 调用)
// actions/product-actions.ts
'use client';
import { getHotProducts } from "@/services/product.service";
export async function fetchHotProductsAction() {
  // 这里可以做权限校验
  return await getHotProducts();
}
// app/RefreshButton.tsx
"use client";
import { fetchHotProductsAction } from "@/actions/product-actions";

export function RefreshButton() {
  const handleClick = async () => {
    const data = await fetchHotProductsAction();
    console.log("更新后的数据:", data);
  };
  return <button onClick={handleClick}>刷新列表</button>;
}
```

```ts
// 3 API 路由 (外部调用)
export async function GET(request: Request) {
  const products = await getHotProducts();
  return Response.json(products);
}
```

### 2. nextjs的四种数据流动方向

1. 服务器组件 (RSC) 自己获取数据 这是 Next.js 的“默认首选” (Default Mode)。
  - 场景：页面内容是静态的，或者是为了 SEO（如博客文章、商品详情、书籍列表）。
  - 写法：在 async 组件里直接 await。
  - 为什么：数据在服务器内部传输，快到起飞；不给浏览器发多余的 JS；代码最简单。
  - 缺点：不能使用客户端状态，不能使用客户端 API，不能使用客户端组件。

2. 客户端组件 (CC) 自己获取数据
  - 场景：高度交互的私有数据（如用户个人后台、搜索框边打字边出结果、实时聊天）。
  - 写法：使用 useEffect 或 SWR / React Query。
  - 优点：数据只属于当前用户，不需要 SEO，且需要频繁刷新。
  - 缺点：会有“白屏等待”；首屏加载慢；对搜索引擎不友好。

3. 服务器获取数据 ➡️ 给到客户端组件 (关键！)
  - 场景：你需要 SEO 和 首屏速度，同时又需要 强大的交互（如：书单需要 SEO，但点击书单要能立即弹出评论区）。
  - 写法：服务器发起 Promise $\rightarrow$ 传给 CC $\rightarrow$ CC 内部用 use(promise)。
  - 为什么：
  快：服务器在还没发 HTML 之前就帮浏览器把请求发出去了。
  活：数据到了客户端组件手里，你可以直接用 useState 去过滤、排序，不需要再回传服务器。
  省：客户端自己处理数据，服务器不用再发数据回来，节省流量。
  - 缺点：需要客户端组件支持 Suspense 和 use(promise), 心智负担较大。

4. 反向回传 浏览器组件 ➡️ 给到服务器组件 (不常用)
  - 场景：你需要服务器处理一些数据，但服务器处理不了（如：文件上传、支付回调，“借书”按钮、“写书评”表单。）。
  - 写法：客户端调用一个函数 $\rightarrow$ 触发服务器逻辑 $\rightarrow$ 服务器更新数据库 $\rightarrow$ 服务器告诉页面“重新刷新数据 (revalidate)”。 Server Actions
  - 为什么：服务器处理不了，需要浏览器组件处理。
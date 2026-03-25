- 'use cache' 缓存机制 需要config文件开启 配合Suspense使用
- cacheLife 缓存时间
- cacheTag 缓存标签
- refresh “同步当前视图” 覆盖不清除
- revalidateTag 刷新指定标签的数据缓存 并不刷新页面
- revalidatePath 刷新整个路由的缓存
你现在的交互是 Server Action + <form action=...> 提交。
这类提交在 App Router 里，框架往往会在 action 完成后重新获取当前路由的 RSC 来更新 UI（可以理解为一次“自动的局部刷新”）。
当你调用 revalidatePath("/users") 时，服务端这条路径相关缓存被标记失效，于是“这次自动重新获取”就拿到了新数据，所以你会觉得“页面也刷新了”。
- react的cache hook 用于获取缓存数据
其它的缓存机制 

- fetch 缓存
- unstable_cache 缓存
- Full Route Cache (静态导出缓存)
这是什么：这是 Build（构建）阶段生成的 HTML 和 RSC 负载。它决定了你的页面是 Static (SSG) 还是 Dynamic。
如何干预：在页面配置 export const dynamic = 'force-static' 或 export const dynamic = 'force-dynamic'
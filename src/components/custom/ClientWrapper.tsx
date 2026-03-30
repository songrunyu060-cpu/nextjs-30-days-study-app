"use client";

import { useState } from "react";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [count, setCount] = useState(0);

  return (
    <div className="p-8 border-2 border-orange-400 rounded-xl">
      <h2 className="font-bold">我是客户端组件（有交互）</h2>
      <button
        onClick={() => setCount(count + 1)}
        className="bg-orange-500 text-white px-4 py-2 my-4 rounded"
      >
        计数器：{count}
      </button>
      <div>当前秒数：{new Date().getSeconds()}</div>
      <p>为什么不能直接在 Client Component 里 import Server Component？</p>
      <p>
        因为客户端组件在浏览器运行，它无法执行服务器上的异步逻辑（如读数据库）。
      </p>
      <p>为什么通过 children 传参却可以？</p>
      <p>1 Next.js 在服务器上先渲染 HomePage。</p>
      <p>2 它发现 ServerData 是服务端组件，直接渲染出结果。</p>
      <p>
        3 它发现 ClientWrapper 是客户端组件，它把 ServerData 的渲染结果作为
        children 传给 ClientWrapper。
      </p>
      <p>4 最后浏览器拿到的 ClientWrapper 内部其实已经是“静态”的渲染结果了。</p>

      {/* 关键点：这里是我们要放服务端组件的地方 */}
      <div className="mt-4">{children}</div>
      {/* 报错 */}
      {/* <ServerData /> */}
    </div>
  );
}

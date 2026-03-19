// import ClientWrapper from "@/components/custom/ClientWrapper";
// import ServerData from "@/components/custom/ServerData";

import { getAllBooks, getHotBooks } from "@/lib/data";
import HotBooks from "@/components/custom/HotBooks";
import AllBooks from "@/components/custom/AllBooks";
import { BookListSkeleton } from "@/components/custom/SkeletonCard";
import { Suspense } from "react";

export default function DashboardPage() {
  // 核心：发起 Promise，但不等待！
  // 这两个请求会【同时】在服务器端发出
  const hotBooksPromise = getHotBooks();
  const allBooksPromise = getAllBooks();

  // 直接渲染：服务器端发出了两个请求，但不会等待它们
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">数字图书馆</h1>

      {/* 模块 A：1秒后亮起 */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-orange-600">
          🔥 热门推荐
        </h2>
        <Suspense
          fallback={
            <div className="h-24 w-full bg-gray-100 animate-pulse rounded-lg" />
          }
        >
          <HotBooks promise={hotBooksPromise} />
        </Suspense>
      </section>

      {/* 模块 B：3秒后亮起 */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-blue-600">
          📚 全部藏书
        </h2>
        <Suspense fallback={<BookListSkeleton />}>
          <AllBooks promise={allBooksPromise} />
        </Suspense>
      </section>
    </main>
  );
}

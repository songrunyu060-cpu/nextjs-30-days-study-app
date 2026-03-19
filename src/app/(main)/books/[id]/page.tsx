import Reviews from "@/components/custom/Reviews";
import { BookListSkeleton } from "@/components/custom/SkeletonCard";
import { Suspense } from "react";

type PageProps = {
  params: Promise<{ id: string }>;
};

// 1. 模拟一个从数据库读取数据的异步函数
async function getMockReviews(id: string) {
  // 故意延迟 3 秒，让你看清 Suspense 的 Loading 状态
  await new Promise((resolve) => setTimeout(resolve, 3000));

  return [
    { id: 1, content: "这本书的架构设计非常有深度！", author: "小王" },
    { id: 2, content: "Next.js 15 的实践案例很全。", author: "老李" },
  ];
}

export default async function BookDetailPage({ params }: PageProps) {
  // Next.js 16 必须 await params
  const { id } = await params;

  // 2. 关键：发起调用但不 await！
  // 这里的 reviewsPromise 是一个“正在进行中”的承诺
  const reviewsPromise = getMockReviews(id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">图书详情</h1>
      <div className="p-6 bg-white border rounded-lg">
        <p>
          当前查看的图书 ID 是：
          <span className="font-mono text-blue-600">{id}</span>
        </p>
      </div>
      <Suspense fallback={<BookListSkeleton />}>
        <Reviews reviewsPromise={reviewsPromise} />
      </Suspense>
    </div>
  );
}

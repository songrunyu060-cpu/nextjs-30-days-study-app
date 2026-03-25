import Reviews from "@/components/custom/Reviews";
import { Suspense } from "react";

type PageProps = {
  params: { id: string };
};

type Review = { id: number; content: string; author: string };

export async function generateStaticParams() {
  return [{ id: "1" }, { id: "2" }]; // 至少给它一个测试数据
}

async function getReviews(_id: string): Promise<Review[]> {
  return await new Promise<Review[]>((resolve) => {
    setTimeout(() => {
      resolve([
        { id: 1, content: "这本书的架构设计非常有深度！", author: "小王" },
        { id: 2, content: "Next.js 15 的实践案例很全。", author: "老李" },
      ]);
    }, 3000);
  });
}
export default async function BookDetailPage({ params }: PageProps) {
  const { id } = params;
  const reviews = getReviews(id);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">图书详情</h1>
      <div className="p-6 bg-white border rounded-lg">
        <p>
          当前查看的图书 ID 是：
          <span className="font-mono">{id}</span>
        </p>
      </div>
      <Suspense
        fallback={<div className="text-sm text-gray-500">评论加载中...</div>}
      >
        <Reviews reviewsPromise={reviews} />
      </Suspense>
    </div>
  );
}

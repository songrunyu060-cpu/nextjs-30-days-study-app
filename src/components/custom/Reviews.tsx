"use client";

import { use } from "react";

// 定义 Prop 类型，它接收的是一个 Promise
interface ReviewsProps {
  reviewsPromise: Promise<{ id: number; content: string; author: string }[]>;
}

export default function Reviews({ reviewsPromise }: ReviewsProps) {
  // 4. 使用 React 19 的 use() 钩子
  // 它会自动感知 Promise 的状态：
  // - Pending: 告诉上层的 Suspense 展示 fallback
  // - Resolved: 返回最终的数据内容
  // - Rejected: 抛出错误给 ErrorBoundary
  const data = use(reviewsPromise);

  return (
    <ul className="space-y-3">
      {data.map((review) => (
        <li key={review.id} className="border-b pb-2">
          <p className="text-gray-700">{review.content}</p>
          <span className="text-sm text-gray-400">— {review.author}</span>
        </li>
      ))}
    </ul>
  );
}

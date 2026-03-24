import { use } from "react";

export default function HotBooks({ promise }: { promise: Promise<any[]> }) {
  // 魔法在这里：如果 promise 没结束，Suspense 会捕获它
  const books = use(promise);
  return (
    <div className="flex gap-4">
      {books.map((book) => (
        <div
          key={book.id}
          className="p-4 bg-orange-50 border border-orange-200 rounded-lg"
        >
          <p className="font-bold">{book.title}</p>
          <p className="text-sm text-gray-500">{book.author}</p>
        </div>
      ))}
    </div>
  );
}

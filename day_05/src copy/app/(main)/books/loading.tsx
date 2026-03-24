export default function BooksLoading() {
  // 使用 Tailwind 编写一个简单的骨架屏
  return (
    <div className="space-y-6 animate-pulse p-4">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-gray-100 rounded-xl border border-gray-200"
          ></div>
        ))}
      </div>
    </div>
  );
}

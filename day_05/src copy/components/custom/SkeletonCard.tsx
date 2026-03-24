// src/components/skeletons.tsx
export function BookCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full p-4 border rounded-xl animate-pulse">
      {/* 封面占位 */}
      <div className="aspect-[3/4] w-full bg-gray-200 rounded-lg" />
      {/* 标题占位 */}
      <div className="h-5 w-3/4 bg-gray-200 rounded" />
      {/* 作者占位 */}
      <div className="h-4 w-1/2 bg-gray-100 rounded" />
    </div>
  );
}

export function BookListSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}

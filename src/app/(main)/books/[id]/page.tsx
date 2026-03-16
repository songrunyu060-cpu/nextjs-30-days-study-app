type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BookDetailPage({ params }: PageProps) {
  // Next.js 16 必须 await params
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">图书详情</h1>
      <div className="p-6 bg-white border rounded-lg">
        <p>
          当前查看的图书 ID 是：
          <span className="font-mono text-blue-600">{id}</span>
        </p>
      </div>
    </div>
  );
}

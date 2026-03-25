import { cacheLife } from "next/cache";

async function getBooks() {
  // 模拟一个 3 秒的延迟
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return ["Next.js 实战", "React 高级指南", "TypeScript 编程"];
}

export default async function BooksPage() {
  "use cache";
  cacheLife("slowCache");
  const books = await getBooks();
  return (
    <div>
      <h1 className="text-2xl font-bold">图书列表</h1>
      <ul className="space-y-2">
        {books.map((book) => (
          <li key={book}>{book}</li>
        ))}
      </ul>
      <p>{new Date().getSeconds()}</p>
    </div>
  );
}

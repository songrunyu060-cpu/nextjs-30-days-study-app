// 模拟热门书籍：较快 (1s)
export async function getHotBooks() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return [
    { id: "1", title: "React 19 实战", author: "Dan" },
    { id: "2", title: "Next.js 16 深度进阶", author: "Vercel" },
  ];
}

// 模拟全部图书：较慢 (3s)
export async function getAllBooks() {
  await new Promise((resolve) => setTimeout(resolve, 3000));
  return [
    { id: "3", title: "算法导论", author: "Cormen" },
    { id: "4", title: "设计模式", author: "GoF" },
    { id: "5", title: "高性能 MySQL", author: "Schwartz" },
    { id: "6", title: "重构", author: "Fowler" },
  ];
}

"use client";

export default function TimeDisplay() {
  // 在服务器环境下，typeof window 是 'undefined'
  // 在浏览器环境下，它是 'object'
  const content = typeof window === "undefined" ? "服务器渲染" : "浏览器渲染";

  return <div className="font-bold text-xl">内容：{content}</div>;
}

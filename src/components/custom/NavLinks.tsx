"use client"; // 声明这是客户端组件，才能使用 usePathname

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function NavLinks() {
  const pathname = usePathname();

  const links = [
    { name: "首页", href: "/" },
    { name: "图书列表", href: "/books" },
    { name: "用户列表", href: "/users" },
    { name: "缓存学习", href: "/cache" },
    { name: "表格学习", href: "/table" },
  ];

  return (
    <nav className="flex gap-6">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch
            className={cn(
              "text-sm transition-colors",
              isActive
                ? "text-blue-600 font-bold underline decoration-2 underline-offset-8"
                : "text-gray-500 hover:text-blue-400",
            )}
          >
            {link.name}
          </Link>
        );
      })}
    </nav>
  );
}

import { ThemeToggle } from "@/components/theme/ThemeToggleButton";
import Link from "next/link";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav className="h-16 border-b flex items-center justify-between px-8 bg-background">
        <div className="font-bold text-xl">全栈图书馆</div>
        <nav className="flex gap-6">
          <Link href="/dashboard" className="hover:text-blue-600">
            首页
          </Link>
          <Link href="/books" className="hover:text-blue-600">
            图书列表
          </Link>
          <Link href="/users" className="hover:text-blue-600">
            用户列表
          </Link>
        </nav>
      </nav>
      <main className="p-8 bg-background text-foreground">{children}</main>
    </div>
  );
}

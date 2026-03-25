import { ThemeToggle } from "@/components/theme/ThemeToggleButton";
import NavLinks from "@/components/custom/NavLinks";
import { Suspense } from "react";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <nav className="h-16 border-b flex items-center justify-between px-8 bg-background">
        <div className="font-bold text-xl">全栈图书馆</div>
        <NavLinks />
        <ThemeToggle />
      </nav>
      <main className="p-8 bg-background text-foreground">
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
      </main>
    </div>
  );
}

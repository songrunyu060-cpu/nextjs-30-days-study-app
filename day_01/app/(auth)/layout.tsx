import { BookOpen } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-card relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-10 rounded-xl bg-primary">
              <BookOpen className="size-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">纸迹书海</span>
          </div>

          <div className="space-y-6">
            <blockquote className="text-2xl font-medium leading-relaxed text-balance">
              &quot;纸迹书海帮助我轻松管理纸质书，让阅读更加高效。&quot;
            </blockquote>
          </div>

          <p className="text-sm text-muted-foreground">
            受到全国超过 50,000 位用户的信赖
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-32 -right-32 size-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/4 -left-16 size-64 rounded-full bg-primary/10 blur-2xl" />
      </div>

      {/* Right panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}

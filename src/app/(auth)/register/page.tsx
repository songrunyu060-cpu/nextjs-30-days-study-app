"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Mail, Lock, User, Check, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { registerAction } from "@/features/auth/register.action";
import { passwordRequirements } from "@/schema/register.schema";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return;
    }
    setIsLoading(true);
    try {
      const result = await registerAction(
        undefined,
        new FormData(e.currentTarget),
      );
      if (result && "error" in result) {
        return;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const passwordsMatch =
    formData.password === formData.confirmPassword &&
    formData.confirmPassword.length > 0;

  return (
    <div className="space-y-8">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
        <div className="flex items-center justify-center size-10 rounded-xl bg-primary">
          <BookOpen className="size-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold tracking-tight">纸迹书海</span>
      </div>

      {/* Header */}
      <div className="space-y-2 text-center lg:text-left">
        <h1 className="text-3xl font-bold tracking-tight">创建账户</h1>
        <p className="text-muted-foreground">注册以开始纸迹书海</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">姓名</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="请输入用户名"
              className="pl-10 h-11"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">邮箱地址</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="请输入邮箱地址"
              className="pl-10 h-11"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">密码</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="创建密码"
              className="pl-10 pr-10 h-11"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? "隐藏密码" : "显示密码"}
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>

          {/* Password requirements */}
          {formData.password && (
            <div className="grid grid-cols-2 gap-2 mt-3">
              {passwordRequirements.map((req) => (
                <div
                  key={req.id}
                  className={cn(
                    "flex items-center gap-2 text-xs transition-colors",
                    req.test(formData.password)
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  <Check
                    className={cn(
                      "size-3",
                      req.test(formData.password)
                        ? "opacity-100"
                        : "opacity-30",
                    )}
                  />
                  {req.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">确认密码</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="再次输入密码"
              className={cn(
                "pl-10 pr-10 h-11",
                formData.confirmPassword &&
                  !passwordsMatch &&
                  "border-destructive focus-visible:ring-destructive/50",
              )}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showConfirmPassword ? "隐藏密码" : "显示密码"}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
          {formData.confirmPassword && !passwordsMatch && (
            <p className="text-xs text-destructive">密码不匹配</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11"
          disabled={isLoading || !passwordsMatch}
        >
          {isLoading ? "注册中..." : "创建账户"}
        </Button>
      </form>

      {/* Terms */}
      <p className="text-xs text-center text-muted-foreground">
        点击注册即表示您同意我们的{" "}
        <Link href="/terms" className="text-primary hover:underline">
          服务条款
        </Link>{" "}
        和{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          隐私政策
        </Link>
      </p>

      {/* Login link */}
      <p className="text-center text-sm text-muted-foreground">
        已有账户？{" "}
        <Link
          href="/login"
          className="text-primary hover:text-primary/80 font-medium transition-colors"
        >
          立即登录
        </Link>
      </p>
    </div>
  );
}

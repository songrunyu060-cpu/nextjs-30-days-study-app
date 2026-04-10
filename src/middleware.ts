import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { NextRequest } from "next/server";

// 白名单：不需要登录也允许访问（但可能会对“已登录用户”做重定向）
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password"];

// 支持的语言
const SUPPORTED_LOCALES = ["zh", "en"];
const DEFAULT_LOCALE = "zh";

type AuthedRequest = NextRequest & { auth: { user?: unknown } | null };

export default auth(async (request: AuthedRequest) => {
  const { nextUrl } = request;
  const { pathname } = nextUrl;
  // 标准化路径，确保 "/login/" 和 "/login" 等价
  const normalizedPathname =
    pathname !== "/" && pathname.endsWith("/")
      ? pathname.slice(0, -1)
      : pathname;

  // 是否已登录
  const isLoggedIn = !!request.auth?.user;

  // 不拦截 NextAuth 的 endpoints
  if (normalizedPathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // ==============================================
  // 1. 已登录用户禁止访问登录/注册页
  // ==============================================
  if (PUBLIC_ROUTES.includes(normalizedPathname) && isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  // ==============================================
  // 2. 白名单直接放行（放在 AUTH_ROUTES 之后）
  // ==============================================
  if (PUBLIC_ROUTES.includes(normalizedPathname)) {
    return NextResponse.next();
  }

  // ==============================================
  // 3. 鉴权：保护路由
  // ==============================================
  // const protectedPrefixes = ["/dashboard", "/admin", "/users", "/books"];
  // const isProtected = protectedPrefixes.some((p) =>
  //   normalizedPathname.startsWith(p),
  // );
  // if (isProtected && !isLoggedIn) {
  //   const loginUrl = new URL("/login", nextUrl.origin);
  //   loginUrl.searchParams.set("callbackUrl", normalizedPathname);
  //   return NextResponse.redirect(loginUrl);
  // }

  // ==============================================
  // 4. 国际化自动处理（可选）
  // ==============================================
  // const hasLocale = SUPPORTED_LOCALES.some(lang =>
  //   pathname.startsWith(`/${lang}`)
  // )
  // if (!hasLocale && !pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
  //   const locale = DEFAULT_LOCALE
  //   const newUrl = new URL(`/${locale}${pathname}`, nextUrl.origin)
  //   return NextResponse.redirect(newUrl)
  // }

  // ==============================================
  // 5. 安全响应头（企业必加）
  // ==============================================
  // const response = NextResponse.next();
  // response.headers.set("X-Frame-Options", "DENY");
  // response.headers.set("X-Content-Type-Options", "nosniff");
  // response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // response.headers.set("Content-Security-Policy", "default-src 'self'");
  // response.headers.set(
  //   "Permissions-Policy",
  //   "camera=(), microphone=(), geolocation=()",
  // );

  // return response;
  return NextResponse.next();
});

// ==============================================
// 匹配规则：只拦截需要处理的路由，性能最好
// ==============================================
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images|assets|fonts|sitemap|robots).*)",
  ],
};

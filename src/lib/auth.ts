import { auth } from "@/auth";
import { unauthorizedJson } from "@/lib/http-json";
import { redirect } from "next/navigation";

/**
 * 统一鉴权入口（弱类型，按运行时入参分流）：
 * - 首参为 `Request`：注入第二参 `session`，未登录 → 401 JSON
 * - `(prev, formData)`：未登录 → `{ error: "用户没有权限" }`
 * - 单参 `FormData`：未登录 → `redirect(opts.redirectTo ?? "/login")`
 */
export function withAuth(
  handler: (...args: any[]) => any,
  opts?: { redirectTo?: string },
): (...args: any[]) => any {
  return async (...args: any[]) => {
    const a0 = args[0];
    const a1 = args[1];

    const session = await auth();
    if (!session?.user) {
      if (a0 instanceof Request) return unauthorizedJson();
      if (args.length === 2 && a1 instanceof FormData) {
        return {
          error: "用户没有权限",
          message: "2 秒后将跳转到登录页",
          redirectTo: opts?.redirectTo ?? "/login",
          redirectDelayMs: 2000,
        };
      }
      if (args.length === 1 && a0 instanceof FormData) {
        redirect(opts?.redirectTo ?? "/login");
        return;
      }
      throw new Error("UNAUTHORIZED");
    }

    if (a0 instanceof Request) {
      return handler(a0, session, ...args.slice(1));
    }
    return handler(...args);
  };
}

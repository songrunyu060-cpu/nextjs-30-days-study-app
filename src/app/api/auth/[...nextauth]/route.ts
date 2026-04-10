import { handlers } from "@/auth";

/**
 * @description: 认证路由
 * @returns {GET, POST}
 * @example
 * GET /api/auth/session
 * POST /api/auth/signin
 * POST /api/auth/signout
 * POST /api/auth/signup
 * POST /api/auth/callback/credentials
 * POST /api/auth/callback/oauth
 * POST /api/auth/callback/oauth2
 */
export const { GET, POST } = handlers;

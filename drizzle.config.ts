import { defineConfig } from "drizzle-kit";

// drizzle-kit 会按顺序选驱动：已安装 `pg` 时会优先用 node-postgres（TCP），
// 避免在未配好 WebSocket 时误走 `@neondatabase/serverless` 导致 migrate 失败。
// 应用运行时仍可用 `@neondatabase/serverless`（见 src/db/index.ts）。

function normalizePostgresUrlForNodePg(url: string) {
  try {
    const u = new URL(url);
    // Neon 控制台有时带 channel_binding=require；node-pg 部分版本/场景下会连不上且工具不打印清晰错误
    u.searchParams.delete("channel_binding");
    return u.toString();
  } catch {
    return url;
  }
}

// 迁移优先用 Direct 串（无 -pooler），避免 pooler + serverless 驱动偶发问题；未配置则回退到应用用的 DATABASE_URL
const migrationUrlRaw =
  process.env.DATABASE_URL_MIGRATE ?? process.env.DATABASE_URL;
if (!migrationUrlRaw) {
  throw new Error(
    "请在 .env 中设置 DATABASE_URL，或单独设置 DATABASE_URL_MIGRATE（推荐 Neon Direct 连接串）供 drizzle-kit 迁移使用。",
  );
}
const migrationUrl = normalizePostgresUrlForNodePg(migrationUrlRaw);

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl,
  },
});

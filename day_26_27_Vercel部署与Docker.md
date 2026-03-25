# Day 26-27：部署深水区 — Vercel、Neon 与 Docker 自建

## 学习目标

- 能在 **Vercel** 上部署本 Next 16 项目，并正确配置 **Neon `DATABASE_URL`**。
- 理解 **Serverless 函数**、**冷启动**、**边缘路由** 对延迟的影响。
- 了解 **Docker** 自建时与 Vercel 在运维、扩展、观测上的差异。

---

## 与本项目强相关的配置

### 1. 环境变量（Vercel）

在 Vercel Project → **Settings → Environment Variables** 添加：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | Neon 连接串（Serverless 驱动常用 **pooler** 主机名） |
| `DATABASE_URL_MIGRATE` | （可选）Drizzle CLI 迁移用 **Direct** 串，见 `drizzle.config.ts` 注释 |

**注意**：`drizzle.config.ts` 会去掉 `channel_binding` 查询参数以兼容 **node-pg** 迁移；应用运行时仍用 Neon serverless 驱动（`src/db/index.ts`）。

### 2. 构建命令

与 `package.json` 一致：

- **Build Command**：`pnpm build` 或 `npm run build`
- **Install**：`pnpm install`（若 Vercel 未自动识别 pnpm，指定包管理器）

### 3. 分析

- 已装 **`@vercel/analytics`**：部署后在 Vercel Analytics 查看流量与 Web Vitals（若启用）。

### 4. 重定向

`next.config.ts` 将 `/` **301** 到 `/dashboard`：部署后根路径行为与本地一致。

---

## 案例代码 ①：最小 `Dockerfile`（与 `pnpm` + Next 16）

仓库根目录可新建（需根据实际 lockfile 微调）：

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["pnpm", "start"]
```

生产环境需注入 **`DATABASE_URL`**；Neon 仍可用同一串。

---

## 案例代码 ②：GitHub Actions —— 迁移 + 构建（示意）

```yaml
name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

数据库迁移可另加一步：`pnpm db:migrate`，使用 **Direct** 串 `DATABASE_URL_MIGRATE`。

---

## 1. Vercel 优势（与本栈契合）

- **与 Next.js 同源优化**：Image、路由、ISR/Data Cache 等集成度高。
- **预览部署**：每个 PR 独立 URL，方便联调 **OAuth 回调**（需配置 Provider）。
- **Neon**：同生态常见组合，延迟通常可接受；注意 **连接数** 与 **Serverless 并发**。

---

## 2. 冷启动与数据库

- **冷启动**：首次请求或空闲后唤醒会略慢；Neon **suspend** 后再连也有额外延迟。
- **缓解**：读路径加缓存（Day 8-9）、Neon 项目设置、合理 `revalidate`。

---

## 3. Docker 自建（概览）

典型 `Dockerfile` 多阶段：

1. `deps`：`pnpm install --frozen-lockfile`
2. `builder`：`pnpm build`
3. `runner`：`node server.js` 或 `next start`

**与 Vercel 差异**：

- 你负责 **扩容、日志、证书、WAF**；
- **Image Optimization** 需自行配置或接受自托管方案；
- **Neon** 仍可用，网络走公网，注意 **VPC / IP 允许列表**（若启用）。

---

## 4. CI/CD 概念任务

- **GitHub → Vercel**：推送即构建；**保护分支** 仅允许合并后部署生产。
- **数据库迁移**：在 **Release 前** 跑 `drizzle-kit migrate`（可用 GitHub Action，使用 `DATABASE_URL_MIGRATE`）。

---

## 5. 动手练习

- [ ] 在 Vercel 创建项目，连接本仓库，配置 `DATABASE_URL`，完成首次成功访问 `/users`。
- [ ] 对比 **首次冷访问** vs **预热后** 的 TTFB（DevTools / Vercel Speed Insights）。
- [ ] （可选）写最小 `Dockerfile` 本地 `docker run -p 3000:3000` 跑 `next start`。

---

## 6. 小结

- **Vercel + Neon** 是本项目的「默认最优路径」。
- **迁移与运行时** 连接串可分离（你仓库已在 `drizzle.config.ts` 体现）。
- **Docker** 适合强合规、私有化；成本与运维更高。

下一篇：**Day 28-30 — 综合项目「全栈 AI 图书馆」**。

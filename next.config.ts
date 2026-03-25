import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // use cache 相关配置
  cacheComponents: true,
  cacheLife: {
    fastCache: {
      // 缓存失效时间 60秒后缓存不失效 但是会重新发请求
      revalidate: 60,
      // 缓存过期时间 300秒后缓存失效
      stale: 300,
    },
    slowCache: {
      revalidate: 3600, // 1小时
      stale: 3600 * 24, // 1天
    },
    longCache: {
      revalidate: 3600 * 24, // 1天
      stale: 3600 * 24 * 7, // 7天
    },
  },

  experimental: {
    // Router Cache：通过 <Link> 客户端跳转时，缓存的 RSC 结果保留多久（秒）
    staleTimes: {
      // 动态路由：有 async 数据、cookies/headers/searchParams 等，每次导航后缓存 60 秒
      dynamic: 60,
      // 静态路由：构建时已产出或 prefetch 的页面，缓存 300 秒（5 分钟）
      static: 300,
    },
  },
  async redirects() {
    return [
      {
        source: "/", // 旧路径（支持通配符）
        destination: "/dashboard", // 新路径
        permanent: true, // true 是 301 永久重定向，false 是 307 临时重定向
      },
    ];
  },
};

export default nextConfig;

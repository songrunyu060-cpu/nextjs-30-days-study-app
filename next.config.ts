import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
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

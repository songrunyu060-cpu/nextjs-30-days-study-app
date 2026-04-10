"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function Logout() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await signOut({ redirect: true, callbackUrl: "/login" });
      }}
    >
      退出登录
    </button>
  );
}

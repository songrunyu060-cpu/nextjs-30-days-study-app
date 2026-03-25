import Link from "next/link";

import { deleteUserFormAction } from "@/features/user/user.action";
import type { User } from "@/schema";

type Props = {
  users: User[];
  /** 当前 URL 上的筛选词，用于「编辑」链回时保留筛选 */
  filterQuery?: string;
};

export function UserList({ users, filterQuery = "" }: Props) {
  const qParam =
    filterQuery.trim() !== ""
      ? `&q=${encodeURIComponent(filterQuery.trim())}`
      : "";

  if (users.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
        没有符合条件的用户，试试调整筛选关键词。
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-4 py-3 font-semibold text-gray-700">ID</th>
            <th className="px-4 py-3 font-semibold text-gray-700">姓名</th>
            <th className="px-4 py-3 font-semibold text-gray-700">邮箱</th>
            <th className="px-4 py-3 font-semibold text-gray-700">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50/80"
            >
              <td className="px-4 py-3 tabular-nums text-gray-600">
                {user.id}
              </td>
              <td className="px-4 py-3">{user.name ?? "—"}</td>
              <td className="px-4 py-3 text-gray-700">{user.email}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/users?edit=${user.id}${qParam}`}
                    className="text-blue-600 underline-offset-2 hover:underline"
                  >
                    编辑
                  </Link>
                  <form action={deleteUserFormAction} className="inline">
                    <input type="hidden" name="id" value={user.id} />
                    <button
                      type="submit"
                      className="text-red-600 underline-offset-2 hover:underline"
                    >
                      删除
                    </button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

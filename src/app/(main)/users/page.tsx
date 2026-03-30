import Link from "next/link";
import { getAllUsers } from "@/features/user/user.service";
import { UserModal } from "./_components/UserModal";
import { UserList } from "./_components/UserList";
import { searchParamsCache, serialize } from "@/lib/searchParams";
import { UserFilters } from "./_components/UserFilters.client";

type PageProps = {
  searchParams?: Promise<{ q?: string; edit?: string; create?: string }>;
};

export default async function UsersPage({ searchParams }: PageProps) {
  // 获取URL参数
  const {
    q,
    edit: editId,
    create: isCreate,
  } = searchParamsCache.parse((await searchParams) ?? {});
  // 获取所有用户
  const allUsers = await getAllUsers();
  // 根据ID查找的用户 需要修改的用户
  const editUser = allUsers.find((item) => item.id === editId);
  // 根据查询条件过滤用户
  const filterUsers = q
    ? allUsers.filter(
        (user) => user.email.includes(q) || (user.name ?? "").includes(q),
      )
    : allUsers;

  return (
    <main className="mx-auto max-w-6xl p-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-12">
          <section>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-xl font-semibold">用户列表</h2>
              <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {q === ""
                  ? `共 ${allUsers.length} 位`
                  : `显示 ${filterUsers.length} 位（共 ${allUsers.length} 位）`}
              </span>
              <Link
                href={`/users?create=true${q !== "" ? `&q=${encodeURIComponent(q)}` : ""}`}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                新增用户
              </Link>
            </div>
            <UserFilters initialQuery={q} />
            <UserList users={filterUsers} filterQuery={q} />
          </section>
        </div>
      </div>
      {/* 如果需要编辑用户或创建用户，则显示用户编辑模态框 */}
      {(editUser || isCreate) && (
        <UserModal
          editUser={isCreate ? null : editUser}
          open
          closeHref={q !== "" ? `/users?q=${encodeURIComponent(q)}` : "/users"}
        />
      )}
    </main>
  );
}

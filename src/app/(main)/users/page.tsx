import Link from "next/link";
import { getAllUsers } from "@/features/user/user.service";
import { UserModal } from "./_components/UserModal";
import { UserList } from "./_components/UserList";

type PageProps = {
  searchParams?: Promise<{ q?: string; edit?: string; create?: string }>;
};

export default async function UsersPage({ searchParams }: PageProps) {
  const sp = (await searchParams) ?? {};
  const allUsers = await getAllUsers();

  const q = (sp.q ?? "").trim();
  const editRaw = (sp.edit ?? "").trim();
  const editId =
    editRaw !== undefined && String(editRaw).trim() !== ""
      ? Number(editRaw)
      : NaN;
  const editingUser = Number.isFinite(editId)
    ? allUsers.find((u) => u.id === editId)
    : undefined;

  const createOpen = sp.create !== undefined && String(sp.create).trim() !== "";
  const lower = q.toLowerCase();
  const filtered =
    q === ""
      ? allUsers
      : allUsers.filter(
          (u) =>
            u.email.toLowerCase().includes(lower) ||
            (u.name ?? "").toLowerCase().includes(lower),
        );

  return (
    <main className="mx-auto max-w-6xl p-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight">用户管理系统</h1>
        <p className="text-gray-500">
          基于 Next.js 16 + Neon + Drizzle ORM 构建
        </p>
      </header>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-12">
          <section>
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="text-xl font-semibold">用户列表</h2>
              <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                {q === ""
                  ? `共 ${allUsers.length} 位`
                  : `显示 ${filtered.length} 位（共 ${allUsers.length} 位）`}
              </span>
              {!editingUser ? (
                <Link
                  href={`/users?create=1${q !== "" ? `&q=${encodeURIComponent(q)}` : ""}`}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  新增用户
                </Link>
              ) : null}
            </div>

            <form
              action="/users"
              method="get"
              className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              {Number.isFinite(editId) ? (
                <input type="hidden" name="edit" value={String(editId)} />
              ) : null}
              <input
                type="search"
                name="q"
                defaultValue={q}
                placeholder="按姓名或邮箱筛选…"
                className="w-full flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-md"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  筛选
                </button>
                {q !== "" ? (
                  <Link
                    href={
                      Number.isFinite(editId)
                        ? `/users?edit=${editId}`
                        : "/users"
                    }
                    className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    清除
                  </Link>
                ) : null}
              </div>
            </form>

            <UserList users={filtered} filterQuery={q} />
          </section>
        </div>
      </div>
      {editingUser && (
        <UserModal
          editingUser={editingUser}
          open
          closeHref={q !== "" ? `/users?q=${encodeURIComponent(q)}` : "/users"}
        />
      )}
      {createOpen && (
        <UserModal
          open
          closeHref={q !== "" ? `/users?q=${encodeURIComponent(q)}` : "/users"}
        />
      )}
    </main>
  );
}

import { UserCreateForm } from "@/components/user/user-create-form";
import { deleteUserFormAction } from "@/features/user/user.action";
import { getAllUsers } from "@/features/user/user.service";

export default async function UsersPage() {
  const users = await getAllUsers();
  return (
    <div className="p-6">
      <h1 className="mb-2 text-xl font-semibold">用户</h1>
      <UserCreateForm />
      <div className="text-sm font-medium text-muted-foreground">
        列表（RSC 直接读 service）
      </div>
      <ul className="mt-2 space-y-2">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex items-center justify-between gap-4 border-b border-border pb-2"
          >
            <span>
              {user.name ?? "—"}{" "}
              <span className="text-muted-foreground">·</span> {user.email}
            </span>
            <form action={deleteUserFormAction}>
              <input type="hidden" name="id" value={user.id} />
              <button
                type="submit"
                className="text-destructive text-sm underline-offset-4 hover:underline"
              >
                删除
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}

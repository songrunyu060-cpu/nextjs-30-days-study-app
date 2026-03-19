import { getAllUsers } from "@/services/user.service";

export default async function UsersPage() {
  const users = await getAllUsers();
  return (
    <div>
      <div>用户列表</div>
      <div>
        {users.map((user) => (
          <div key={user.id}>
            {user.name} - {user.email}
          </div>
        ))}
      </div>
    </div>
  );
}

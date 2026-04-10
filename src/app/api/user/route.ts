import { saveUserUseCase } from "@/features/user/use-cases";
import { getAllUsers } from "@/features/user/user.service";
import { badRequestJson } from "@/lib/http-json";
import { withAuth } from "@/lib/auth";

export const POST = withAuth(async (req) => {
  try {
    const json = await req.json();
    const user = await saveUserUseCase(json);
    return Response.json({ data: user });
  } catch {
    return badRequestJson("API 格式的错误");
  }
});

export const GET = withAuth(async () => {
  const users = await getAllUsers();
  const data = users.map((user) => {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
  return Response.json({ data });
});

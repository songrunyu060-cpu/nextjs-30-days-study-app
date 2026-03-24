import { saveUserUseCase } from "@/features/user/use-cases";
import { getAllUsers } from "@/features/user/user.service";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const user = await saveUserUseCase(json); // 复用同一个逻辑

    return Response.json(user); // API 特有的返回方式
  } catch (e) {
    return Response.json({ error: "API 格式的错误" }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const users = await getAllUsers();
    return Response.json(users);
  } catch (e) {
    return Response.json({ error: "API 格式的错误" }, { status: 400 });
  }
}

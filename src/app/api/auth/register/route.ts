import argon2 from "argon2";
import { db } from "@/db";
import { badRequestJson, conflictJson, jsonError } from "@/lib/http-json";
import { registerSchema } from "@/schema/register.schema";
import { userTable } from "@/schema/user.schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = registerSchema.safeParse(json);
    if (!parsed.success) {
      return jsonError(400, "请检查输入格式", {
        fieldErrors: parsed.error.flatten().fieldErrors,
      });
    }

    const { name, email, password } = parsed.data;

    const exists = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, email))
      .limit(1);

    if (exists.length) {
      return conflictJson("该邮箱已注册");
    }

    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    // returning 返回插入的数据
    const inserted = await db
      .insert(userTable)
      .values({
        name,
        email,
        passwordHash,
      })
      .returning({
        id: userTable.id,
        name: userTable.name,
        email: userTable.email,
      });

    return Response.json(
      { success: true, user: inserted[0] ?? { email, name } },
      { status: 200 },
    );
  } catch {
    return badRequestJson("注册失败");
  }
}

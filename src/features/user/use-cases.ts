import {
  userCreateSchema,
  userUpdateSchema,
} from "@/schema";
import { saveUserService } from "@/features/user/user.service";

function omitEmptyStrings(obj: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === "") continue;
    out[k] = v;
  }
  return out;
}

// 这个函数不依赖任何 Next.js 特有 API，API 和 Action 都可以调它
export async function saveUserUseCase(rawData: unknown) {
  if (!rawData || typeof rawData !== "object") {
    throw new Error("VALIDATION_FAILED");
  }

  const obj = { ...(rawData as Record<string, unknown>) };
  const idRaw = obj.id;
  const id =
    idRaw !== undefined && idRaw !== null && String(idRaw).trim() !== ""
      ? String(idRaw)
      : undefined;
  delete obj.id;

  // 1. 统一校验；带 id 视为更新（字段可为部分，空串视为“不修改该字段”）
  if (id) {
    const payload = omitEmptyStrings(obj);
    const validated = userUpdateSchema.safeParse(payload);
    if (!validated.success) throw new Error("VALIDATION_FAILED");
    return await saveUserService(validated.data, id);
  }

  const validated = userCreateSchema.safeParse(obj);
  if (!validated.success) throw new Error("VALIDATION_FAILED");

  // 2. 调用 Service
  return await saveUserService(validated.data);
}

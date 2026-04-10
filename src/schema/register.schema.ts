import { z } from "zod";

/** 与下方 Zod 密码规则一致，供注册页实时提示复用 */
export const passwordRequirements = [
  { id: "length", label: "至少 8 个字符", test: (p: string) => p.length >= 8 },
  {
    id: "uppercase",
    label: "包含大写字母",
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "lowercase",
    label: "包含小写字母",
    test: (p: string) => /[a-z]/.test(p),
  },
  { id: "number", label: "包含数字", test: (p: string) => /\d/.test(p) },
] as const;

/** 注册密码规则 */
export const registerPasswordSchema = z
  .string()
  .superRefine((password, ctx) => {
    for (const req of passwordRequirements) {
      if (!req.test(password)) {
        ctx.addIssue({
          code: "custom",
          message: req.label,
        });
      }
    }
  });

/** 注册表单规则 */
export const registerSchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  password: registerPasswordSchema,
});

export type RegisterInput = z.infer<typeof registerSchema>;

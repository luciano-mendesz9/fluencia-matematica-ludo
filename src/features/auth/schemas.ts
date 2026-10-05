import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().trim().min(3).max(320),
  password: z.string().min(8).max(128),
  requestId: z.uuid(),
}).superRefine(({ identifier }, context) => {
  const valid = identifier.includes("@")
    ? z.email().safeParse(identifier).success
    : /^[\p{L}\p{N}._-]+$/u.test(identifier);
  if (!valid) context.addIssue({ code: "custom", path: ["identifier"], message: "invalid identifier" });
});

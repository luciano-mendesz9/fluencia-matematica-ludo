"use server";

import { headers } from "next/headers";
import { prisma } from "@/src/lib/prisma";
import { throttleKey } from "@/src/server/auth/crypto";
import { clearSessionCookie } from "@/src/server/auth/session";
import { normalizeIdentifier } from "@/src/server/auth/normalization";
import { consumeReset, requestAdultReset, resetStudentPassword, revokeUserSessions } from "@/src/server/auth/password-reset";
import { requireGlobalRole, requireUser } from "@/src/server/auth/policies";
import { isRateLimited, recordRateLimitHit } from "@/src/server/auth/rate-limit";
import { unavailableAdultPasswordResetDelivery } from "@/src/server/auth/reset-delivery";
import { assistedStudentResetSchema, consumeResetSchema, requestResetSchema } from "./schemas";

export type RecoveryActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

const genericRequestMessage = "Se o e-mail estiver cadastrado, as instruções de recuperação serão enviadas.";

export async function requestAdultResetAction(
  _state: RecoveryActionState,
  formData: FormData,
): Promise<RecoveryActionState> {
  const parsed = requestResetSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { status: "error", message: "Informe um e-mail válido." };

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedFor || requestHeaders.get("x-real-ip") || "unknown";
  const normalizedEmail = parsed.data.email.trim().toLocaleLowerCase("pt-BR");
  const throttleKeys = [
    throttleKey("reset-identifier", normalizedEmail),
    throttleKey("reset-ip", ipAddress.slice(0, 128)),
  ];
  if (await isRateLimited(throttleKeys) || await recordRateLimitHit(throttleKeys)) {
    return { status: "success", message: genericRequestMessage };
  }

  await requestAdultReset({
    email: normalizedEmail,
    delivery: unavailableAdultPasswordResetDelivery,
  });
  return { status: "success", message: genericRequestMessage };
}

export async function consumeResetAction(
  _state: RecoveryActionState,
  formData: FormData,
): Promise<RecoveryActionState> {
  const parsed = consumeResetSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Não foi possível validar a nova senha." };
  }

  const result = await consumeReset({ token: parsed.data.token, newPassword: parsed.data.newPassword });
  return result.ok
    ? { status: "success", message: "Senha alterada. Entre novamente com a nova senha." }
    : { status: "error", message: "Este link é inválido, expirou ou já foi utilizado." };
}

export async function resetStudentPasswordAction(
  _state: RecoveryActionState,
  formData: FormData,
): Promise<RecoveryActionState> {
  const actor = await requireGlobalRole("SEMED_ADMIN");
  const parsed = assistedStudentResetSchema.safeParse({
    studentCode: formData.get("studentCode"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const normalized = normalizeIdentifier(parsed.data.studentCode);
  const student = normalized.kind === "student"
    ? await prisma.user.findUnique({ where: { studentCode: normalized.value }, select: { id: true } })
    : null;
  if (!student) return { status: "error", message: "Aluno não encontrado." };

  await resetStudentPassword({ actor, studentId: student.id, newPassword: parsed.data.newPassword });
  return { status: "success", message: "Senha do aluno redefinida e sessões anteriores revogadas." };
}

export async function revokeMySessionsAction() {
  const actor = await requireUser();
  await revokeUserSessions({ actor, targetUserId: actor.id });
  await clearSessionCookie();
}

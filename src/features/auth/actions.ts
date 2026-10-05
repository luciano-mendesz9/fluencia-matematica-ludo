"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticate } from "@/src/server/auth/authenticate";
import { revokeCurrentSession, setSessionCookie } from "@/src/server/auth/session";
import { loginSchema } from "./schemas";

export type LoginActionState = {
  status: "idle" | "error" | "rate_limited";
  message?: string;
};

export async function loginAction(_state: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    requestId: formData.get("requestId"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Não foi possível entrar. Verifique os dados e tente novamente." };
  }

  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ipAddress = forwardedFor || requestHeaders.get("x-real-ip") || "unknown";
  let result: Awaited<ReturnType<typeof authenticate>>;
  try {
    result = await authenticate({ ...parsed.data, ipAddress });
  } catch {
    return { status: "error", message: "Não foi possível entrar. Verifique os dados e tente novamente." };
  }

  if (!result.ok) {
    return result.reason === "RATE_LIMITED"
      ? { status: "rate_limited", message: "Muitas tentativas. Aguarde alguns minutos e tente novamente." }
      : { status: "error", message: "Não foi possível entrar. Verifique os dados e tente novamente." };
  }

  await setSessionCookie(result.token, result.expiresAt);
  redirect(result.redirect);
}

export async function logoutAction() {
  await revokeCurrentSession();
  redirect("/login");
}

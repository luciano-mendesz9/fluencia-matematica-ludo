import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@/src/server/auth/constants";
import { verifySessionJwt } from "@/src/server/auth/jwt";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token && await verifySessionJwt(token)) return NextResponse.next();

  const response = NextResponse.redirect(new URL("/login", request.url));
  if (token) response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/escola/:path*", "/professor/:path*", "/aluno/:path*", "/operacao/:path*", "/selecionar-escola/:path*"],
};

import "server-only";

import { redirect } from "next/navigation";
import type { AuthArea } from "./destination";
import { getCurrentSession } from "./session";

export async function requireArea(area: AuthArea) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.destination !== `/${area}`) redirect(session.destination);
  return session;
}

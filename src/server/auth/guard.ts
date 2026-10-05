import "server-only";

import { redirect } from "next/navigation";
import type { AuthArea } from "./destination";
import { getCurrentSession } from "./session";
import { getSelectedSchoolContext } from "@/src/server/schools/context";

export {
  requireClassAssignment,
  requireGlobalRole,
  requireSchoolMembership,
  requireUser,
} from "./policies";

export async function requireArea(area: AuthArea) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (area === "selecionar-escola") {
    if (session.destination !== "/selecionar-escola") redirect(session.destination);
    return { ...session, schoolContext: null };
  }
  if (area === "professor" || area === "escola") {
    if (session.destination !== "/selecionar-escola") redirect(session.destination);
    const schoolContext = await getSelectedSchoolContext(session.user.id);
    if (!schoolContext) redirect("/selecionar-escola");
    if (schoolContext.destination !== `/${area}`) redirect(schoolContext.destination);
    return { ...session, schoolContext };
  }
  if (session.destination !== `/${area}`) redirect(session.destination);
  return { ...session, schoolContext: null };
}

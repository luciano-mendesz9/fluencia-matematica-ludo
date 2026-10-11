import { redirect } from "next/navigation";
import { getCurrentSession } from "@/src/server/auth/session";

export default async function ReportsPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.destination === "/professor") redirect("/professor/relatorios");
  if (session.destination === "/escola") redirect("/escola/relatorios");
  if (session.destination === "/admin") redirect("/admin/relatorios");
  if (session.destination === "/aluno") redirect("/aluno/resultados");
  redirect(session.destination);
}

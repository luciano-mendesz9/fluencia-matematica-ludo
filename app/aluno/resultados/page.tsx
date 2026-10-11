import { AppShell } from "@/src/components/layout/app-shell";
import { StudentAnalytics } from "@/src/features/analytics/student-analytics";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { getStudentAnalytics } from "@/src/server/analytics/service";
import { requireArea } from "@/src/server/auth/guard";

const navigation = [{ href: "/aluno", label: "Início" }, { href: "/aluno/atividades", label: "Atividades" }, { href: "/aluno/resultados", label: "Resultados" }, { href: "/aluno/ranking", label: "Ranking" }];

export default async function StudentResultsPage() {
  const session = await requireArea("aluno");
  const result = await getStudentAnalytics({ actor: { ...session.user } });
  return <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="Seu progresso"><StudentAnalytics result={result} /></AppShell>;
}

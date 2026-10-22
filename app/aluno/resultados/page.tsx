import { AppShell } from "@/src/components/layout/app-shell";
import { StudentAnalytics } from "@/src/features/analytics/student-analytics";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { STUDENT_NAVIGATION } from "@/src/features/students/navigation";
import { getStudentAnalytics } from "@/src/server/analytics/service";
import { requireArea } from "@/src/server/auth/guard";

export default async function StudentResultsPage() {
  const session = await requireArea("aluno");
  const result = await getStudentAnalytics({ actor: { ...session.user } });
  return <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={[...STUDENT_NAVIGATION]} accountAction={<LogoutForm />} statusLabel="Seu progresso"><StudentAnalytics result={result} /></AppShell>;
}

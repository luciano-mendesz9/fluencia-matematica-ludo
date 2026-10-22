import { notFound } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { GamePanel } from "@/src/features/games/game-panel";
import { STUDENT_NAVIGATION } from "@/src/features/students/navigation";
import { getStudentActivity } from "@/src/server/activities/service";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireArea } from "@/src/server/auth/guard";
import { getLatestGameForActivity } from "@/src/server/games/service";

export default async function StudentGamePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("aluno"); const { id } = await params; const actor = { ...session.user };
  let item; let game;
  try {
    [item, game] = await Promise.all([getStudentActivity({ actor, activityId: id }), getLatestGameForActivity({ actor, activityId: id })]);
  } catch (error) { if (error instanceof AuthorizationError && ["NOT_FOUND", "FORBIDDEN"].includes(error.code)) notFound(); throw error; }
  if (!game) notFound();
  const context = `${item.activity.classGroup.name} · ${item.activity.classGroup.grade}º ano`;
  return <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={[...STUDENT_NAVIGATION]} accountAction={<LogoutForm />} statusLabel={context}><div className="student-game-page"><GamePanel activityId={id} game={game} progress={{ accepted: item.acceptedAnswers, target: item.activity.targetCount, extra: item.extraAnswers }} /></div></AppShell>;
}

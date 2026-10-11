import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { Icon } from "@/src/components/ui/icon";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { GamePanel } from "@/src/features/games/game-panel";
import { getStudentActivity } from "@/src/server/activities/service";
import { AuthorizationError } from "@/src/server/auth/errors";
import { requireArea } from "@/src/server/auth/guard";
import { getLatestGameForActivity } from "@/src/server/games/service";

const navigation = [{ href: "/aluno", label: "Início" }, { href: "/aluno/atividades", label: "Atividades" }, { href: "/aluno/ranking", label: "Ranking" }];

export default async function StudentGamePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireArea("aluno"); const { id } = await params; const actor = { ...session.user };
  let item; let game;
  try {
    [item, game] = await Promise.all([getStudentActivity({ actor, activityId: id }), getLatestGameForActivity({ actor, activityId: id })]);
  } catch (error) { if (error instanceof AuthorizationError && ["NOT_FOUND", "FORBIDDEN"].includes(error.code)) notFound(); throw error; }
  if (!game) notFound();
  const context = `${item.activity.classGroup.name} · ${item.activity.classGroup.grade}º ano`;
  return <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel={context}><div className="space-y-5"><Link href={`/aluno/atividades/${id}`} className="inline-flex min-h-11 items-center gap-2 font-extrabold text-brand"><Icon name="arrow-left" />Voltar à missão</Link><GamePanel key={game.revision} activityId={id} game={game} progress={{ accepted: item.acceptedAnswers, target: item.activity.targetCount, extra: item.extraAnswers }} /></div></AppShell>;
}

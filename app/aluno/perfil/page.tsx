import Link from "next/link";
import { AppShell } from "@/src/components/layout/app-shell";
import { StudentAvatar } from "@/src/components/students/student-avatar";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { AvatarEditor } from "@/src/features/gamification/avatar-editor";
import { STUDENT_NAVIGATION } from "@/src/features/students/navigation";
import { requireArea } from "@/src/server/auth/guard";
import { getStudentGamification } from "@/src/server/gamification/service";

export default async function StudentProfilePage() {
  const session = await requireArea("aluno");
  const progress = await getStudentGamification({ actor: { ...session.user } });
  const unlocked = progress.achievements.filter((achievement) => achievement.unlocked).length;
  return <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={[...STUDENT_NAVIGATION]} accountAction={<LogoutForm />} statusLabel="Meu perfil">
    <div className="space-y-7">
      <header className="student-page-header"><p>Esse herói é você</p><h1>Meu perfil 💙</h1><span>Seu cantinho no universo da matemática.</span></header>
      <section className="student-panel text-center"><div className="profile-avatar-stage"><StudentAvatar avatar={progress.profile} label={`Avatar atual de ${session.user.name}`} /></div><h2 className="mt-2 text-3xl font-black">{session.user.name}</h2><p className="mt-1 font-bold text-muted">{progress.classGroup.grade}º ano · {progress.classGroup.name}</p><span className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-brand">{progress.rank.current.icon} Nível {progress.rank.current.level} · {progress.rank.current.name}</span></section>
      <section className="student-panel" aria-labelledby="avatar-title"><div className="student-panel-title"><div><p>Crie seu estilo</p><h2 id="avatar-title">Personalize seu avatar</h2></div><span aria-hidden="true">🎨</span></div><p className="mt-2 font-bold text-muted">Escolha tom de pele, roupa, cabelo e cor. A seleção é salva no servidor e aparece no ranking.</p><div className="mt-6"><AvatarEditor initial={progress.profile} studentName={session.user.name} /></div></section>
      <section className="student-stat-grid" aria-label="Estatísticas do perfil"><div><span aria-hidden="true">⚡</span><strong>{progress.totalXp}</strong><small>XP total</small></div><div><span aria-hidden="true">🏆</span><strong>{progress.rankingPosition ? `${progress.rankingPosition}º` : "—"}</strong><small>Ranking</small></div><div><span aria-hidden="true">🏅</span><strong>{unlocked}</strong><small>Medalhas</small></div></section>
      <section className="student-panel" aria-labelledby="rank-title"><div className="flex items-start justify-between gap-4"><div><p className="student-eyebrow text-brand">Minha patente</p><h2 id="rank-title" className="mt-1 text-2xl font-black">{progress.rank.current.name}</h2></div><span className="text-4xl">{progress.rank.current.icon}</span></div><div className="student-progress mt-5"><span style={{ width: `${progress.rank.progressPercent}%`, background: progress.rank.current.accent }} /></div><div className="mt-2 flex justify-between gap-2 text-xs font-black text-muted"><span>Nível {progress.rank.current.level}</span><span>{progress.rank.next ? `${progress.rank.xpInRank} / ${progress.rank.requiredForNext} XP` : "Patente máxima"}</span><span>{progress.rank.next ? `Nível ${progress.rank.next.level}` : "Completa"}</span></div></section>
      <div className="student-link-list"><Link href="/aluno/conquistas"><span>🏅</span><strong>Meu álbum de conquistas</strong><span>→</span></Link><Link href="/aluno/ranking"><span>🏆</span><strong>Posição no ranking</strong><span>→</span></Link><Link href="/aluno/resultados"><span>📊</span><strong>Meus resultados</strong><span>→</span></Link></div>
    </div>
  </AppShell>;
}

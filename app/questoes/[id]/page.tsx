import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { CreateVersionForm, QuestionStatusForm } from "@/src/features/questions/question-forms";
import { AuthorizationError } from "@/src/server/auth/errors";
import { getCurrentSession } from "@/src/server/auth/session";
import { getEligibleQuestion, listTaxonomy } from "@/src/server/questions/service";

export default async function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession(); if (!session) redirect("/login");
  const actor = { id: session.user.id, name: session.user.name, globalRole: session.user.globalRole, studentCode: session.user.studentCode };
  const { id } = await params;
  let question;
  try { question = await getEligibleQuestion({ actor, questionId: id }); } catch (error) { if (error instanceof AuthorizationError && error.code === "NOT_FOUND") notFound(); throw error; }
  const taxonomy = await listTaxonomy(actor); const latest = question.versions[0]; if (!latest) notFound();
  const admin = session.user.globalRole === "SEMED_ADMIN";
  const navigation = admin ? [{ href: "/admin", label: "Visão geral" }, { href: "/questoes", label: "Banco de questões" }] : [{ href: "/professor", label: "Visão geral" }, { href: "/professor/turmas", label: "Minhas turmas" }, { href: "/questoes", label: "Banco de questões" }];
  return <AppShell areaLabel={admin ? "Administração" : "Professor"} currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel={question.origin === "SEMED" ? "Questão da rede" : "Questão privada"}><div className="grid gap-8"><header><Link href="/questoes" className="font-semibold text-brand">← Voltar ao banco</Link><h1 className="mt-3 text-3xl font-bold">Questão e histórico</h1><p className="mt-2 text-muted">Versões anteriores são imutáveis; salvar cria uma nova versão.</p></header><section className="rounded-panel border border-border bg-surface p-5 sm:p-6"><h2 className="mb-5 text-2xl font-bold">Estado da questão</h2><p className="mb-4 text-muted">{question.status === "ACTIVE" ? "Ativa e disponível para seleção." : "Arquivada, preservando todas as versões."}</p><QuestionStatusForm question={{ id: question.id, revision: question.revision, status: question.status }}/></section>{question.status === "ACTIVE" && <section className="rounded-panel border border-border bg-surface p-5 sm:p-6"><h2 className="mb-5 text-2xl font-bold">Criar versão {question.latestVersionNumber + 1}</h2><CreateVersionForm question={{ id: question.id, revision: question.revision, latest }} taxonomy={taxonomy}/></section>}<section><h2 className="text-2xl font-bold">Histórico</h2><ol className="mt-4 grid gap-4">{question.versions.map((version) => <li key={version.versionNumber} className="rounded-panel border border-border bg-surface p-5"><h3 className="font-bold">Versão {version.versionNumber}{version.versionNumber === question.latestVersionNumber ? " · atual" : ""}</h3><p className="mt-1 text-sm text-muted">{version.grade}º ano · dificuldade {version.difficulty} · {version.theme.name}{version.skill ? ` · ${version.skill.name}` : ""}</p><p className="mt-4 whitespace-pre-wrap">{version.statement}</p><p className="mt-4 break-all font-mono text-xs text-muted">Integridade: {version.contentHash}</p></li>)}</ol></section></div></AppShell>;
}

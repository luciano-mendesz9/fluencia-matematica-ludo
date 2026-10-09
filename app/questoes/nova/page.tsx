import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/src/components/layout/app-shell";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { RichQuestionEditor } from "@/src/features/questions/rich-editor";
import { getCurrentSession } from "@/src/server/auth/session";
import { listTaxonomy } from "@/src/server/questions/service";

export default async function NewQuestionPage() {
  const session=await getCurrentSession(); if(!session) redirect("/login");
  const actor={id:session.user.id,name:session.user.name,globalRole:session.user.globalRole,studentCode:session.user.studentCode};
  const taxonomy=await listTaxonomy(actor); const admin=session.user.globalRole==="SEMED_ADMIN";
  const navigation=admin?[{href:"/admin",label:"Visão geral"},{href:"/questoes",label:"Banco de questões"},{href:"/questoes/revisao",label:"Revisão SEMED"}]:[{href:"/professor",label:"Visão geral"},{href:"/professor/turmas",label:"Minhas turmas"},{href:"/questoes",label:"Banco de questões"}];
  return <AppShell areaLabel={admin?"Administração":"Professor"} currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm/>} statusLabel={admin?"Nova questão da rede":"Nova questão privada"}><div className="grid gap-6"><header><Link href="/questoes" className="font-semibold text-brand">← Voltar ao banco</Link><h1 className="mt-3 text-3xl font-bold">Editor completo de questão</h1><p className="mt-2 text-muted">Cadastre correção, explicação e imagem em uma versão imutável.</p></header><section className="rounded-panel border border-border bg-surface p-5 sm:p-6"><RichQuestionEditor taxonomy={taxonomy}/></section></div></AppShell>;
}

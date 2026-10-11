import { AppShell } from "@/src/components/layout/app-shell";
import { AreaDashboard } from "@/src/components/layout/area-dashboard";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { requireArea } from "@/src/server/auth/guard";
import { listGlobalAdults } from "@/src/server/people/service";
import { listSchoolsForAdmin } from "@/src/server/schools/service";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/pessoas", label: "Pessoas globais" },
  { href: "/admin/relatorios", label: "Resultados" },
  { href: "/questoes", label: "Banco de questões" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function AdminPage() {
  const session = await requireArea("admin");
  const [schools, adults] = await Promise.all([listSchoolsForAdmin({ ...session.user }), listGlobalAdults({ ...session.user })]);
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="Sessão ativa">
      <AreaDashboard eyebrow="Visão geral da SEMED" title={`Olá, ${session.user.name}.`} description="Gerencie a estrutura municipal, as contas globais e o conteúdo compartilhado a partir de fluxos já disponíveis." metrics={[{ label: "Escolas", value: schools.length, description: "Cadastradas na plataforma", icon: "building" }, { label: "Escolas ativas", value: schools.filter((school) => school.status === "ACTIVE").length, description: "Disponíveis para vínculos", icon: "school" }, { label: "Contas globais", value: adults.length, description: "Administração e operação", icon: "people" }]} destinations={[{ href: "/admin/escolas", title: "Escolas", description: "Cadastre escolas e acompanhe seus vínculos ativos.", icon: "building" }, { href: "/admin/relatorios", title: "Resultados da rede", description: "Consulte indicadores agregados sem misturar pontos e desempenho.", icon: "activity" }, { href: "/admin/pessoas", title: "Pessoas globais", description: "Gerencie administradores SEMED e desenvolvedores.", icon: "people" }, { href: "/questoes", title: "Banco de questões", description: "Consulte e gerencie questões da rede.", icon: "book" }, { href: "/questoes/revisao", title: "Revisão SEMED", description: "Analise questões enviadas para compartilhamento.", icon: "shield" }, { href: "/admin/redefinir-senha-aluno", title: "Acesso de alunos", description: "Redefina senhas em fluxo administrativo autorizado.", icon: "settings" }]} />
    </AppShell>
  );
}

import { AppShell } from "@/src/components/layout/app-shell";
import { StructurePanel } from "@/src/components/layout/structure-panel";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { requireArea } from "@/src/server/auth/guard";

const navigation = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/escolas", label: "Escolas" },
  { href: "/admin/redefinir-senha-aluno", label: "Redefinir senha de aluno" },
];

export default async function AdminPage() {
  const session = await requireArea("admin");
  return (
    <AppShell areaLabel="Administração" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="Sessão ativa">
      <StructurePanel title="Área administrativa" description="Base visual para a futura gestão municipal, com navegação consistente e espaço reservado para fluxos autorizados." />
    </AppShell>
  );
}

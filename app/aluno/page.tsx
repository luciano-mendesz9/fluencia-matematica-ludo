import { AppShell } from "@/src/components/layout/app-shell";
import { StructurePanel } from "@/src/components/layout/structure-panel";
import { LogoutForm } from "@/src/features/auth/logout-form";
import { requireArea } from "@/src/server/auth/guard";

const navigation = [{ href: "/aluno", label: "Início" }];

export default async function StudentPage() {
  const session = await requireArea("aluno");
  return (
    <AppShell areaLabel="Aluno" currentUserLabel={session.user.name} navigation={navigation} accountAction={<LogoutForm />} statusLabel="Sessão ativa">
      <StructurePanel title="Área do aluno" description="Base visual para práticas e partidas futuras, com linguagem direta, alvos de toque confortáveis e navegação por teclado." />
    </AppShell>
  );
}

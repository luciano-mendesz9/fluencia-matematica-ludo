import { AppShell } from "@/src/components/layout/app-shell";
import { StructurePanel } from "@/src/components/layout/structure-panel";

const navigation = [{ href: "/aluno", label: "Início" }];

export default function StudentPage() {
  return (
    <AppShell areaLabel="Aluno" currentUserLabel="Acesso ainda não conectado" navigation={navigation}>
      <StructurePanel title="Área do aluno" description="Base visual para práticas e partidas futuras, com linguagem direta, alvos de toque confortáveis e navegação por teclado." />
    </AppShell>
  );
}

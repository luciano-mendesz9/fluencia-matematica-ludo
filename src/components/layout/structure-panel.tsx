import { Badge } from "../ui/badge";
import { Feedback } from "../ui/feedback";

export function StructurePanel({ title, description }: { title: string; description: string }) {
  return (
    <section aria-labelledby="area-title" className="max-w-4xl">
      <Badge variant="info">Shell estrutural</Badge>
      <h1 id="area-title" className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{description}</p>
      <div className="mt-8">
        <Feedback title="Área preparada, sem dados simulados" variant="info">
          Este endereço valida a estrutura responsiva, acessível e autenticada. Autorizações por vínculo e dados reais serão conectadas nas tarefas próprias antes de qualquer operação privada.
        </Feedback>
      </div>
    </section>
  );
}

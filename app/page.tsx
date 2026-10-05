import Link from "next/link";
import { Badge } from "@/src/components/ui/badge";
import { InfoDialog } from "@/src/components/ui/info-dialog";

const principles = [
  { title: "Aprender jogando", description: "Atividades matemáticas ganham contexto em uma experiência inspirada no Ludo." },
  { title: "Acompanhamento claro", description: "Professores acompanham participação e dificuldades sem confundir pontos com aprendizagem." },
  { title: "Segurança por princípio", description: "Identidade, vínculos, movimentos e pontos serão sempre validados no servidor." },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-bold tracking-tight text-foreground">
            Fluência <span className="text-brand">Matemática</span>
          </Link>
          <Badge variant="info">MVP em construção</Badge>
          <Link href="/login" className="inline-flex min-h-11 items-center rounded-control border border-brand px-4 font-semibold text-brand hover:bg-blue-50">Entrar</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div className="self-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Plataforma educacional municipal</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Matemática praticada com propósito, jogo e feedback.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
            Uma experiência online, acessível e responsiva para estudantes do 1º ao 5º ano e para as equipes que acompanham sua aprendizagem.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <InfoDialog />
            <Link href="#principios" className="inline-flex min-h-11 items-center justify-center rounded-control border border-border bg-surface px-5 py-2.5 font-semibold text-foreground transition hover:border-brand hover:text-brand">
              Ver princípios
            </Link>
          </div>
        </div>

        <div className="rounded-panel border border-blue-100 bg-surface p-6 shadow-[0_18px_50px_rgba(23,105,224,0.10)] sm:p-8">
          <div className="rounded-panel bg-blue-50 p-6" role="status">
            <p className="font-semibold text-blue-950">Base técnica verificada</p>
            <p className="mt-2 leading-7 text-blue-900">Next.js, Tailwind CSS e testes de navegador estão preparados para evoluir o produto em entregas pequenas e rastreáveis.</p>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-control border border-border p-4"><dt className="text-sm text-muted">Anos atendidos</dt><dd className="mt-1 text-2xl font-bold text-foreground">1º–5º</dd></div>
            <div className="rounded-control border border-border p-4"><dt className="text-sm text-muted">Primeiro jogo</dt><dd className="mt-1 text-2xl font-bold text-foreground">Ludo</dd></div>
          </dl>
        </div>
      </section>

      <section id="principios" className="border-y border-border bg-surface py-14" aria-labelledby="principios-title">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 id="principios-title" className="text-2xl font-bold text-foreground">Princípios do produto</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {principles.map((principle) => (
              <article key={principle.title} className="rounded-panel border border-border bg-background p-6">
                <h3 className="text-lg font-bold text-foreground">{principle.title}</h3>
                <p className="mt-3 leading-7 text-muted">{principle.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-16 font-sans">
      <main className="w-full max-w-3xl rounded-3xl border border-blue-100 bg-white p-8 shadow-sm sm:p-12">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">
          Plataforma educacional
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
          Fluência Matemática
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          Uma experiência de prática matemática gamificada, segura e acessível
          para estudantes dos anos iniciais.
        </p>
        <div
          className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5 text-blue-950"
          role="status"
        >
          A base técnica do projeto está pronta para evoluir por tarefas.
        </div>
      </main>
    </div>
  );
}

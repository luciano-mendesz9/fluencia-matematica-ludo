type RankingEntry = { position: number; name: string; points: number; isCurrentStudent: boolean };

function medal(position: number) {
  if (position === 1) return "🥇";
  if (position === 2) return "🥈";
  if (position === 3) return "🥉";
  return null;
}

export function RankingTable({ entries, student = false }: { entries: RankingEntry[]; student?: boolean }) {
  if (entries.length === 0) return <div className={`${student ? "student-card" : "adult-card"} p-6 text-center`}><p className="font-bold">Ainda não há alunos ativos nesta turma.</p><p className="mt-2 text-sm text-muted">O ranking aparecerá quando houver matrículas ativas.</p></div>;
  return <ol className="space-y-2" aria-label="Classificação mensal">
    {entries.map((entry, index) => {
      const award = medal(entry.position);
      return <li key={`${entry.name}-${index}`} className={`grid min-h-16 grid-cols-[3.25rem_minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border px-4 py-3 ${entry.isCurrentStudent ? "border-blue-300 bg-blue-50" : "border-border bg-white"}`}>
        <span className="text-center text-lg font-black text-foreground" aria-label={`${entry.position}ª posição`}>{award ? <span aria-hidden="true" className="text-2xl">{award}</span> : `${entry.position}º`}</span>
        <span className="min-w-0"><span className="block truncate font-extrabold text-foreground">{entry.name}</span>{entry.isCurrentStudent ? <span className="text-xs font-bold text-brand">Você</span> : null}</span>
        <span className="whitespace-nowrap text-right"><strong className="text-lg text-brand">{entry.points}</strong><span className="ml-1 text-xs font-semibold text-muted">pontos</span></span>
      </li>;
    })}
  </ol>;
}

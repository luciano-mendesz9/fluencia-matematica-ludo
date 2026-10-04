# Contexto, autoridade e decisões

## Autoridade

Ordem: instrução atual do responsável; decisões `[D]` do PRD; ADRs aprovados; interpretações `[I]`;
propostas `[P]`. Proposta detalhada continua proposta. Contradições são registradas, não ocultadas.

## Conciliação com o PRD

| Assunto | Situação vigente | Efeito |
| --- | --- | --- |
| Stack | Next.js App Router/TypeScript, Prisma, npm | confirma e detalha a proposta do PRD |
| Banco | PostgreSQL/Neon em todos os ambientes | substitui SQLite local e fecha a escolha de provedor |
| Client DB | único `src/lib/prisma.ts`, adapter Neon compatível | proíbe seleção de provider por ambiente/URL |
| Pontos | `max(1, 10 - 3 × erros)`; dificuldade não multiplica | substitui fórmulas antigas |
| Efeito do erro | reduz prêmio futuro, não saldo | interpretação explícita, ainda pede confirmação humana |
| Vitória | +30 uma vez por partida | evento separado e idempotente |
| Ranking | mês/turma, sem histórico de classificação | eventos/respostas permanecem; nada é apagado no mês |
| Conectividade | somente online | offline/sincronização fora do MVP |
| Cadastro | individual | importação fora do MVP |
| Escola do professor | múltiplos vínculos; preferência local por usuário | contexto visual nunca autoriza |
| Visual | superfícies brancas, azul de marca/ação | verde antigo não é paleta de marca |
| Qualidade | validação servidor + banco + Playwright | cliente é conveniência, não fronteira de confiança |

## Evidência do repositório

Em 04/10/2026: `main` em `930b759`; sem remoto; árvore continha bootstrap Create Next App e
`docs/` não rastreado. Dependências observadas: Next 16.3.3, React/ReactDOM 19.2.8, Tailwind 4,
TypeScript 5, Node 20.19.2 e npm 9.2.0. A versão instalada do Next está abaixo do patch de segurança
16.3.8 publicado em 30/09/2026; FM-001 deve atualizar dentro de 16.3 e registrar o lockfile.

## Versões propostas (baseline em 04/10/2026)

- Node `20.19.x` LTS mínimo operacional; Next 16 exige Node >=20.9.
- Next `16.3.8`, React/ReactDOM `19.2.x`, TypeScript `5.x`, Tailwind `4.x`.
- Prisma ORM/Client e `@prisma/adapter-neon` na mesma linha `7.x`, fixados pelo lockfile.
- Playwright Test na linha estável vigente quando FM-001 for executada, versão exata fixada no
  lockfile; Chromium no ciclo curto e três engines nos marcos.

Não usar `latest` em scripts reproduzíveis. Antes de instalar, FM-001 revalida advisories e
compatibilidade Node/Next; FM-003 revalida Prisma/adapter/Neon. Fontes oficiais:
[Next 16](https://nextjs.org/docs/app/guides/upgrading/version-16),
[segurança Next](https://nextjs.org/docs/app/guides/data-security),
[Prisma PostgreSQL v7](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/postgresql),
[Tailwind/Next](https://tailwindcss.com/docs/installation/framework-guides/nextjs) e
[Playwright](https://playwright.dev/docs/test-configuration).

## Escopo negativo

Sem outros minigames, partidas aluno-aluno, IA generativa no produto, jogo livre, importação,
offline, nota pedagógica derivada do ranking, edição livre de pontos ou histórico visual de rankings.

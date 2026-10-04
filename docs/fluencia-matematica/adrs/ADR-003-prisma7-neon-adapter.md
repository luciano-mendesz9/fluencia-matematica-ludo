# ADR-003 — Prisma 7 com adapter Neon

**Estado:** proposto, versão exata revalidada em FM-003.

Usar Prisma ORM/Client 7.x e `@prisma/adapter-neon` na mesma linha, com client gerado em caminho
explícito e instância única em `src/lib/prisma.ts`. Prisma 7 desloca configuração de conexão da CLI
para `prisma.config.ts`; `DIRECT_URL` atende migrations e `DATABASE_URL` pooled atende runtime.

A alternativa Prisma 6 é mantida somente se FM-003 provar incompatibilidade reproduzível entre
Prisma 7, Next 16.3, Node 20 e adapter Neon. Nesse caso, atualizar este ADR antes de código. Não
misturar receitas/configurações das duas linhas.

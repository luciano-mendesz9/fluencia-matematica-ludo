# Banco e ambientes

Ver [ADR-001](adrs/ADR-001-postgresql-neon-only.md). Dev, E2E e produção são PostgreSQL/Neon
separados. Branch Git e branch Neon são recursos independentes; integração de Git não aplica SQL.

## Variáveis futuras

`DATABASE_URL` é runtime pooled para `PrismaNeon`; `DIRECT_URL` é conexão direta da CLI em
`prisma.config.ts`; ambas devem identificar a mesma branch/banco lógico do ambiente. `SHADOW_DATABASE_URL`
somente se Prisma Migrate exigir, sempre isolada e descartável. `APP_ENV_ID` e uma tabela/marker de
ambiente devem coincidir antes de migrate/seed/cleanup. Nunca confiar apenas em `NODE_ENV`, hostname
contendo “neon” ou prefixo da URL. Nenhuma delas é `NEXT_PUBLIC_*`.

Next carrega `.env*` conforme seu runtime. Prisma 7 CLI usa `prisma.config.ts` e carregamento
explícito (`import "dotenv/config"` ou arquivo indicado). Playwright carrega `.env.e2e.local`
explicitamente no config. Scripts Node isolados usam `--env-file`/dotenv declarado. `.env.example`
tem apenas placeholders; `.env*.local` e storage states ficam ignorados.

## Migrations

Em branch de tarefa: alterar schema, `prisma migrate dev --name <slug>` contra branch dev autorizada,
revisar SQL, testar banco vazio e snapshot representativo, versionar migration. CI/staging/prod usam
`prisma migrate deploy`, jamais `db push` como história oficial. Reset só em banco descartável
confirmado por marker e autorização. Backup/restauração são ensaiados antes do piloto.

`prisma generate` segue mudança de schema; client gerado não fica desatualizado. Migrations de cada
entrega são pequenas; evolução preserva dados. Mudança destrutiva requer expand/backfill/contract,
plano de rollback e autorização.

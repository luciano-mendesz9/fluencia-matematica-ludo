# FM-003 — Fundação Prisma/Neon e migration mínima

**Ordem/fase:** 3/Base | **Branch:** `task/FM-003-prisma-neon-foundation` | **Situação:** planejada

## Objetivo e pré-condições

Com FM-001 integrada e branch Neon dev/teste fornecida, fixar Prisma 7/adapter Neon, único
`src/lib/prisma.ts`, configuração CLI e primeira migration mínima de `User`, `Session` e `AuditEvent`.
Ler [dados](../02-data-model.md), [ambientes](../10-database-and-environments.md) e ADR-001/003.

## Dados, contratos e segurança

Criar `prisma/schema.prisma`, `prisma.config.ts`, migration revisada, `.env.example` e guard de
ambiente. `DATABASE_URL` runtime pooled; `DIRECT_URL` CLI direta ao mesmo destino; marker `APP_ENV_ID`.
Client não chega ao browser. Inclui geração e conexão; exclui credenciais reais, auth e tabelas futuras.

## Sequência, burla e concorrência

Revalidar compatibilidade; instalar versões iguais; validar destino por allowlist+marker; gerar migration
contra dev isolado; aplicar em banco E2E vazio; provar unicidades/transaction rollback. Recusar produção,
URLs divergentes, marker ausente e seed/reset ambíguo. Testar singleton/hot reload e falha clara sem env.

## Aceite/evidência/entrega

`prisma validate`, `generate`, `migrate status/deploy` no banco E2E autorizado, integração real,
gates FM-001 e verificação de nenhum secret no diff/log. Aceite: mesma história PostgreSQL, sem SQLite/
`db push`, migration reproduzível vazia. Relatório informa ambiente lógico, nunca URL. Bloqueio: banco
não fornecido; não simular aprovação com mocks.

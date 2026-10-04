# ADR-001 — PostgreSQL/Neon em todos os ambientes

**Estado:** aceito pelo prompt em 04/10/2026.

## Contexto e decisão

O jogo exige transações, unicidade e concorrência que precisam ser verificadas no mesmo engine.
Desenvolvimento, teste e produção usam PostgreSQL hospedado no Neon, em bancos/branches isolados.
SQLite não é fallback. Uma troca de URL não converte migrations SQLite em PostgreSQL nem garante as
mesmas restrições. Existe uma única história de migrations versionadas.

Runtime usa URL pooled com adapter Neon; Prisma CLI usa conexão direta quando recomendada. Ambas
apontam para o mesmo ambiente lógico e são conferidas por marker explícito. `db push` não substitui
migrations. Branch Git e Neon não se vinculam/mesclam automaticamente.

## Consequências

Testes de integração exigem Neon de teste disponibilizado pelo responsável. Seed/reset recusam
produção e dependem de identificação positiva do destino. Mais fidelidade e menos divergência em
troca de maior dependência de rede. Reverter exige novo ADR, esquema/client/migrations separados e
plano de dados; não basta condicional por `NODE_ENV` ou prefixo da URL.

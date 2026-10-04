# FM-026 — CI, observabilidade e runbooks

**Ordem/fase:** 26/Operação | **Branch:** `task/FM-026-ci-observability-runbooks` | **Situação:** planejada

## Objetivo/dependências

Após FM-023–025, tornar gates reproduzíveis em GitHub Actions, instrumentar saúde/alertas e criar
runbooks de migration, restore, secrets, auth e fornecedores. Sem deploy de produção nesta tarefa.

## Pipeline, segurança e ambientes

Workflow usa Node/lockfile fixos, `npm ci`, lint, typecheck, unidade, build, integração PostgreSQL e
Playwright 3 engines conforme matriz. Secrets só no job protegido; marker confirma banco test; aplica
`migrate deploy`, seed sintético namespaced e publica HTML/trace com retenção. Falta de secret falha
explicando, não skip verde.

## Observabilidade/runbooks

Métricas de erro/latência/taxa, correlationId, health sem dados, alertas e release SHA. Documentos:
migration/rollback, backup+restore, rotação, revogação, Neon/TTS/e-mail/mídia indisponível e incidente.
Ensaiar restore em destino isolado e reconciliar amostra; nenhum comando destrutivo aponta produção.

## Testes/aceite/entrega

PR de teste prova workflow; simular falha, artifact e restore; validar logs redigidos. Aceite: gates
locais=CI, migration vazia/existente e restore verificados, runbooks têm dono/escalada. Relatório
FM-026, evidências do CI. OD-005/009/004 podem limitar alertas/retenção e ficam explícitas.

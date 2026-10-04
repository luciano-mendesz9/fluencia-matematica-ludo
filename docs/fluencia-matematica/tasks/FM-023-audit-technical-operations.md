# FM-023 — Auditoria, logs e operações técnicas

**Ordem/fase:** 23/Operação | **Branch:** `task/FM-023-audit-technical-operations` | **Situação:** planejada

## Objetivo/dependências

Consolidar AuditEvent das mutações administrativas e oferecer `/operacao` ao desenvolvedor com saúde,
versão e erros técnicos, sem respostas pedagógicas individuais. Depende FM-005/015/019; BR-022.

## Dados/contratos

Padronizar actor/action/target/school/correlation/before/after redigidos e índices/retention hook.
Logger estruturado separa OperationalLog de auditoria. DTO técnico: release SHA, status de serviços,
contagens agregadas e erros sanitizados; não inclui senha/hash/token/gabarito/resposta/nome de aluno.

## Segurança/bordas/UI

Somente papel desenvolvedor/SEMED conforme política; consulta auditável, rate/paginação e filtros
allowlisted. Sanitizar exceção, URL e metadata. Tentar editar pontos, ler answer ou injetar newline/
secret em log é negado/redigido. `/operacao` tem estados e correlation lookup sem dado pessoal.

## Testes/aceite/entrega

Integração verifica eventos de tarefas anteriores, imutabilidade e redaction; snapshot de chaves
proibidas; Playwright SCOPE-06. Aceite: incidentes são correlacionáveis e desenvolvedor não consegue
operações críticas/dados pedagógicos. Relatório FM-023, migration se necessária e gates. OD-004 pode
alterar retenção; não apagar antes da política.

# Índice ordenado de tarefas

Todas estão **planejadas** em 04/10/2026. Branch base de integração: `main` local; remoto pendente.

| Ordem | ID | Fase/objetivo | Dependências | Branch | Critério principal |
| ---: | --- | --- | --- | --- | --- |
| 1 | [FM-001](FM-001-bootstrap.md) | Base: auditar/completar bootstrap e smoke | — | `task/FM-001-bootstrap` | gates e Playwright smoke |
| 2 | [FM-002](FM-002-design-system.md) | Base: design system/shell | 001 | `task/FM-002-design-system` | branco/azul, 320–desktop |
| 3 | [FM-003](FM-003-prisma-neon-foundation.md) | Base: Prisma/Neon/migration mínima | 001 | `task/FM-003-prisma-neon-foundation` | banco isolado, client único |
| 4 | [FM-004](FM-004-authentication.md) | Base: login/sessão | 002,003 | `task/FM-004-authentication` | aluno/adulto, sessão segura |
| 5 | [FM-005](FM-005-authorization-recovery.md) | Base: políticas/revogação/reset | 004 | `task/FM-005-authorization-recovery` | autorização reutilizável |
| 6 | [FM-006](FM-006-schools-memberships-context.md) | Escola: vínculos e seletor | 005 | `task/FM-006-schools-memberships-context` | múltiplas escolas sem elevação |
| 7 | [FM-007](FM-007-academic-years-classes.md) | Escola: ano/turmas | 006 | `task/FM-007-academic-years-classes` | CRUD escopado individual |
| 8 | [FM-008](FM-008-students-enrollments.md) | Escola: alunos/matrículas | 007 | `task/FM-008-students-enrollments` | código único e histórico |
| 9 | [FM-009](FM-009-teachers-assignments.md) | Escola: adultos/docência | 007 | `task/FM-009-teachers-assignments` | papéis e turmas vigentes |
| 10 | [FM-010](FM-010-question-bank.md) | Conteúdo: banco e versões | 008,009 | `task/FM-010-question-bank` | ownership/versionamento |
| 11 | [FM-011](FM-011-question-editor-media.md) | Conteúdo: editor/correção/áudio | 010 | `task/FM-011-question-editor-media` | prévia fiel e DTO sem gabarito |
| 12 | [FM-012](FM-012-semed-sharing.md) | Conteúdo: envio/revisão SEMED | 011 | `task/FM-012-semed-sharing` | cópia rastreável |
| 13 | [FM-013](FM-013-activity-authoring.md) | Atividade: criação/cobertura | 011 | `task/FM-013-activity-authoring` | versões fixas e dificuldades 1–6 |
| 14 | [FM-014](FM-014-participation-target.md) | Atividade: aluno/meta/prática extra | 013 | `task/FM-014-participation-target` | meta persiste entre partidas |
| 15 | [FM-015](FM-015-activity-lifecycle.md) | Atividade: abrir/fechar/concorrência | 014 | `task/FM-015-activity-lifecycle` | corrida definida e auditada |
| 16 | [FM-016](FM-016-ludo-domain-engine.md) | Jogo: tabuleiro/movimentos/máquina | 001 | `task/FM-016-ludo-domain-engine` | motor puro determinístico |
| 17 | [FM-017](FM-017-game-session-turns.md) | Jogo: sessão/dado/turnos/desafio | 003,015,016 | `task/FM-017-game-session-turns` | servidor controla estado |
| 18 | [FM-018](FM-018-answer-move-recovery.md) | Jogo: resposta/movimento/recuperação | 011,017 | `task/FM-018-answer-move-recovery` | atomicidade e regra completa |
| 19 | [FM-019](FM-019-points-victory.md) | Jogo: ledger/pontos/vitória | 018 | `task/FM-019-points-victory` | 10/7/4/1 e +30 uma vez |
| 20 | [FM-020](FM-020-resume-concurrency-game-ui.md) | Jogo: retomada/duas abas/UI | 002,019 | `task/FM-020-resume-concurrency-game-ui` | revisão, reconexão, responsivo |
| 21 | [FM-021](FM-021-monthly-ranking.md) | Resultado: ranking mensal | 019 | `task/FM-021-monthly-ranking` | agregação sem reset destrutivo |
| 22 | [FM-022](FM-022-pedagogical-analytics.md) | Resultado: dashboards/feedback | 015,018 | `task/FM-022-pedagogical-analytics` | indicadores separados/reconciliados |
| 23 | [FM-023](FM-023-audit-technical-operations.md) | Operação: auditoria/logs | 005,015,019 | `task/FM-023-audit-technical-operations` | logs sem dado proibido |
| 24 | [FM-024](FM-024-pdf-xlsx-exports.md) | Resultado: PDF/XLSX | 022,023 | `task/FM-024-pdf-xlsx-exports` | filtros iguais e fórmula neutralizada |
| 25 | [FM-025](FM-025-cross-browser-accessibility.md) | Qualidade: regressão/a11y/engines | 020–024 | `task/FM-025-cross-browser-accessibility` | 3 engines, teclado, 320px |
| 26 | [FM-026](FM-026-ci-observability-runbooks.md) | Operação: CI/observabilidade/runbooks | 023–025 | `task/FM-026-ci-observability-runbooks` | pipeline e restauração ensaiada |
| 27 | [FM-027](FM-027-pilot-readiness.md) | Piloto: capacidade/aceites | 026 | `task/FM-027-pilot-readiness` | gates técnicos/pedagógicos/humanos |

O grafo é acíclico. FM-016 pode avançar em paralelo após FM-001 porque é domínio puro; sua integração
antes de FM-017 ainda é obrigatória. OD-002/003 podem mudar estado de tarefas conforme [decisões](../14-open-decisions.md).

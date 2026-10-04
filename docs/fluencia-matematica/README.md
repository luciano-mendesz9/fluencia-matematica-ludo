# Plano de desenvolvimento — Fluência Matemática

Este diretório é o contrato de planejamento do MVP até o piloto. O [PRD](PRD.md) preserva a
origem; [contexto e decisões](00-context-and-decisions.md) conciliam o estado atual; o
[índice](tasks/INDEX.md) define a sequência executável. Implementação futura segue o
[protocolo diário](12-agent-workflow.md).

## Ordem de leitura

1. [PRD](PRD.md) e [decisões](00-context-and-decisions.md).
2. [arquitetura](01-architecture.md), [dados](02-data-model.md) e
   [segurança](03-server-security.md).
3. [regras](04-business-rules.md), [Ludo/pontos](05-ludo-and-points.md) e
   [decisões abertas](14-open-decisions.md).
4. [rotas](07-routes-and-user-flows.md), [design](08-design-system.md),
   [testes](09-testing-and-playwright.md) e [ambientes](10-database-and-environments.md).
5. [índice de tarefas](tasks/INDEX.md) e a tarefa específica.

## Iniciar um dia de trabalho

Diga **“Desenvolva a tarefa FM-XXX.”** O agente deve confirmar no código e no Git que todas as
dependências estão integradas — um relatório ou rótulo não basta —, criar/reutilizar a branch
indicada sem reset, implementar somente o escopo, testar e escrever
`reports/FM-XXX/YYYY-MM-DD-attempt-NN.md`. Estados distinguem: `planejada`, `pronta`,
`em andamento`, `bloqueada`, `implementada`, `verificada`, `publicada` e `integrada`.

## Estado observado em 04/10/2026

O PRD é não rastreado na base observada e a aplicação já foi criada por Create Next App
(Next 16.3.3/React 19.2.8/Tailwind 4), contrariando a premissa do prompt de que o projeto estaria
vazio. Nada foi reinstalado. FM-001 auditará e completará esse bootstrap existente. A branch base
local é `main`; não havia remoto configurado, portanto integração e publicação dependem de revisão
e configuração posterior.

## Marcos

Base (FM-001–005), estrutura escolar (006–009), conteúdo/atividades (010–015), jogo/pontos
(016–020), análise/saídas (021–024) e operação/piloto (025–027). A matriz completa está em
[rastreabilidade](13-traceability.md).

# FM-015 — Abertura, fechamento e disputa com respostas

**Ordem/fase:** 15/Atividade | **Branch:** `task/FM-015-activity-lifecycle` | **Situação:** planejada

## Objetivo

Implementar rascunho → aberta → fechada, abertura após cobertura e fechamento consistente com
resposta concorrente. Depende FM-014; BR-008/010, ACT-04.

## Serviço/transação/contratos

`openActivity(id,revision)` fixa seleção/destinatários/timestamp; `closeActivity(id,revision)` fecha e
suspende sessões ativas. Resposta aceita bloqueia/valida Activity dentro da mesma ordenação
transacional: quem confirmar lock/revisão primeiro define o resultado; nunca há ponto sem resposta
nem resposta aceita após fechamento confirmado. Retry é idempotente.

## UI e segurança

Professor atribuído abre/fecha; outros papéis conforme matriz. Negar turma alheia, lacuna 1–6,
revisão antiga, reabertura/edição retroativa. Detalhe mostra estado, confirmação e conflito recuperável;
aluno recebe suspensão clara, não perde progresso.

## Testes/aceite/entrega

Integração PostgreSQL com barreira concorrente fechamento×resposta, duplo close e falha pós-commit;
Playwright professor fecha enquanto aluno está no detalhe e acesso posterior bloqueia. Aceite:
invariantes reconciliadas e auditadas. Relatório FM-015, migration/índices se necessários e gates.

# FM-019 — Ledger de pontos e bônus de vitória

**Ordem/fase:** 19/Jogo | **Branch:** `task/FM-019-points-victory` | **Situação:** planejada

## Objetivo/bloqueio

Após FM-018 e confirmação OD-001, criar PointEvent e conceder 10/7/4/1 no acerto e +30 na vitória,
uma vez cada. BR-015/016/018, PTS-01–05. Sem confirmação, tarefa não fica pronta.

## Dados/contratos/transação

Migration `PointEvent` com contexto aluno/turma/atividade/jogo, `ANSWER_AWARD` único por answer e
`VICTORY_BONUS` único por game. Função pura `awardFor(errorStreak)=max(1,10-3e)`. Transação de
answer cria evento e incrementa meta; movimento final encerra jogo e cria bônus separado. DTO retorna
novos eventos e saldo agregado, nunca aceita amount do cliente.

## Bordas/segurança

Dificuldade não entra na fórmula; erro não debita; meta atingida não para pontos; reload/retry/falha
pós-commit lê eventos existentes. Duas finalizações permitem um bônus. `awardedAt` e classId vêm do
servidor/contexto histórico. Sem edição manual livre.

## Testes/aceite/entrega

Tabela 0/1/2/3/10 erros, dificuldades 1/6, 4+30, retry, concorrência e prática adicional; reconciliar
ledger com estado. Playwright exibe pontos/resultado sem duplicar no refresh. Aceite: constraints
provam unicidade e eventos distintos. Relatório FM-019, migration e gates.

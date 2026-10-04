# FM-018 — Resposta, movimento e recuperação

**Ordem/fase:** 18/Jogo | **Branch:** `task/FM-018-answer-move-recovery` | **Situação:** planejada

## Objetivo/decisões

Com FM-011/017 e OD-002 fechada, aceitar uma resposta, dar feedback, controlar sequência 1–4 e aplicar
um movimento legal/captura/chegada. Não concede pontos ainda (FM-019), mas expõe award intent atômico.

## Dados e contratos

Migration `AnswerAttempt` e campos de sequência. `answer(challengeId,actionId,revision,response)` corrige
e fecha desafio; erro incrementa `errorStreak` e abre recuperação; acerto cria `MOVE_PENDING` com
movimentos legais. `move(pieceId,actionId,revision)` relembra dado/estado, aplica motor e avança turno.

## Segurança/concorrência/UI

Negar resposta duplicada/diferente, challenge alheio/fechado, `correct/score` enviado, peça/destino
ilegal e revisão velha. Correção, AnswerAttempt, meta e transição são uma transação; escolha da peça
não corrige/premia novamente. Todos de volta à base entram recuperação de liberação conforme decisão.
UI funcional de desafio/feedback/movimento pode ser simples, acessível, sem prometer layout FM-020.

## Testes/aceite/entrega

Unitários normalização e sequências; integração duas respostas, erro→novos desafios, 6/acerto extra,
captura/segura/chegada e fechamento concorrente; Playwright LUDO-04–12. Aceite: uma AnswerAttempt por
Challenge e estado recuperável. Relatório FM-018, migration e gates.

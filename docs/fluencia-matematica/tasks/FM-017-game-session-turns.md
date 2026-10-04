# FM-017 — Sessão, dado, turnos e criação de desafio

**Ordem/fase:** 17/Jogo | **Branch:** `task/FM-017-game-session-turns` | **Situação:** planejada

## Objetivo/dependências

Integradas FM-003/015/016, persistir partida e ações, controlar dado/turno no servidor e selecionar
desafio sem gabarito. BR-011–013 e LUDO-01–03/07/10.

## Dados/contratos

Migration `GameSession`, `GameAction`, `Challenge`; JSON de pinos validado ou tabelas conforme revisão.
`startOrResume(participation)`, `roll({gameId,clientActionId,expectedRevision})`. Servidor sorteia
valor permitido, aplica fase, cria desafio de versão elegível ou passa turno; DTO contém revisão,
dado, movimentos candidatos e prompt allowlisted.

## Segurança/idempotência/fluxo

Derivar aluno/atividade; validar aberta, participação, turno e uma sessão ativa. Ignorar `dice`,
`questionId`, `correct` do cliente. Unique(game,clientActionId) devolve resultado original; expected
revision antigo →409. Antes da primeira saída: alterna sem questão, primeiro 6 libera sem ponto.

## Testes/aceite/entrega

Integração com RNG injetado: retries, duas abas, sem movimento, conteúdo esgotado/repetido, fechamento
e vínculo revogado; Route Handler/Action direto adulterado. Playwright mínimo do início até desafio,
sem UI final. Aceite: payload nunca contém gabarito e dado não muda no retry. Relatório FM-017,
migration e gates.

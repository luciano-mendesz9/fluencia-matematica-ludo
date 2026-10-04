# FM-020 — Retomada, concorrência e interface final do jogo

**Ordem/fase:** 20/Jogo | **Branch:** `task/FM-020-resume-concurrency-game-ui` | **Situação:** planejada

## Objetivo/dependências

Com FM-002/019, entregar experiência completa do Ludo, retomada após refresh/conexão, duas abas/
dispositivos e suspensão por fechamento/revogação. Resultado: fluxo real acessível desktop/mobile.

## Serviços/rotas/UI

`/aluno/atividades/[id]/jogo` carrega DTO atual via `startOrResume`; comandos carregam
`clientActionId+revision`. Board visual deriva posições lógicas; cartas/dado, questão, feedback,
seletor de pino, turno, erros, meta e pontos. Reconexão consulta servidor; controles laterais desktop
e abaixo no celular, pinos por símbolo+cor, áudio opt-in e reduced motion.

## Segurança/estados

Uma sessão ativa por participação; aba antiga recebe 409 e reidrata, não repete ação. Offline desativa
mutação sem simular resultado. Atividade fechada/sessão revogada suspende. Estados loading, sem acesso,
aguarde, reconectando, conflito, derrota/vitória e nova partida (só se aberta).

## Testes/aceite/entrega

Integração unique/revisão/retry; Playwright dois contexts, refresh em cada fase, conexão interrompida,
320/390/desktop, teclado e LUDO-13/PTS-05. Inspeção visual com assertions. Aceite: cliente nunca é
autoridade e não há overflow/ação encoberta. Relatório FM-020 e gates.

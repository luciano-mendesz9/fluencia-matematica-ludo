# FM-016 — Motor de domínio do Ludo

**Ordem/fase:** 16/Jogo | **Branch:** `task/FM-016-ludo-domain-engine` | **Situação:** implementada e verificada localmente

## Objetivo/independência

Após FM-001, modelar tabuleiro, movimentos legais, captura, casas seguras, chegada e máquina como
funções TypeScript puras e determinísticas, sem UI/banco. Pode avançar em paralelo, mas FM-017 exige
integração. Referência [Ludo](../05-ludo-and-points.md); OD-002 deve virar configuração/testes aprovados.

## Contratos

`BoardDefinition`, `GameState`, `legalMoves(state,player,dice)`, `applyMove`, `chooseMachineMove`.
Posições são lógicas e versão do board é persistível; entrada/corredor/seguras têm invariantes. RNG é
injeção server-side, nunca valor do cliente. Máquina prioriza chegada, captura, saída e avanço,
desempate por pieceId se confirmado.

## Segurança, bordas e regras

O motor recebe RNG apenas do adaptador servidor; entrada do navegador não pode selecionar dado ou
estado. Quatro pinos, saída com 6, sem captura em segura, captura retorna base, valor exato proposto, pinos
próprios compartilháveis propostos, sem barreira/três-seis/bônus captura. Detectar nenhum movimento,
vitória e estado inválido; funções não pontuam nem escolhem questão.

## Testes/aceite/entrega

Testes de tabela e propriedades: todo movimento fica no mapa; captura/segura; corredor/exato;
prioridade/empate; todos base/concluídos; estado imutável. Aceite: 100% das transições catalogadas
com fixtures legíveis e nenhuma dependência React/Prisma. Gates FM-001. Relatório FM-016 e decisão
OD-002 citada; não criar página para provar motor.

## Implementação observada em 10/10/2026

O motor puro está em `src/domain/ludo`, com definição de tabuleiro versionada, posições lógicas,
validação de invariantes, movimentos legais, aplicação imutável, captura, vitória e escolha
determinística da máquina. As alternativas de OD-002 são propriedades explícitas de `LudoRules`;
o preset exportado mantém o nome `PROPOSED_MVP_*` para não promover propostas a decisões confirmadas.
Fixtures e testes unitários catalogam as transições sem importar React, Next ou Prisma.

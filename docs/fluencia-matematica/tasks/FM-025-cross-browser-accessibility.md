# FM-025 — Regressão cross-browser e acessibilidade

**Ordem/fase:** 25/Qualidade | **Branch:** `task/FM-025-cross-browser-accessibility` | **Situação:** planejada

## Objetivo/escopo

Com FM-020–024 integradas, corrigir regressões dos fluxos principais em Chromium, Firefox e WebKit,
desktop/390/320, teclado, foco, contraste, reduced motion e leitura semântica. Não adiciona feature.

## Matriz

Perfis: SEMED/coordenador/professor/aluno/desenvolvedor. Fluxos: login/escola, cadastros, questão,
atividade, jogo/reconexão, dashboard/ranking/export. Automatizar axe onde útil e fazer inspeção manual
dos estados visuais/áudio/tabuleiro. Locators por papel/rótulo; snapshots revisados, não autoaceitos.

## Segurança e bordas

Reexecutar acessos diretos e requests alteradas; correção visual não pode afrouxar guards. Testar zoom,
texto longo, nome extremo, falha de rede, erro/empty/forbidden, pinos sem cor, foco de modal e ausência
de overflow. Documentar limitações de leitor de tela e validação humana restante.

## Aceite/entrega

`test:e2e:all` e gates completos passam; zero violação crítica/alta automática e checklist manual
assinado/referenciado. Capturas relevantes e traces de falhas corrigidas. Relatório FM-025 lista
browser/dispositivo/estado, commit/push/PR; OD-010 pode definir amostra real do piloto.

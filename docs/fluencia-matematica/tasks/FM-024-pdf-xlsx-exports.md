# FM-024 — Exportações PDF e XLSX

**Ordem/fase:** 24/Resultados | **Branch:** `task/FM-024-pdf-xlsx-exports` | **Situação:** planejada

## Objetivo/decisão

Após FM-022/023 e OD-008, gerar PDF e XLSX server-side com exatamente os mesmos filtros/definições do
dashboard. BR-021, EXPORT-01/02.

## Contratos/handlers

Um `ReportQuery` validado alimenta tela e exporters. Route Handlers autenticam a própria requisição,
revalidam escola/turma/período e retornam filename seguro, tipo e stream. PDF inclui título, filtros,
data, denominadores e notas; XLSX separa contagem/precisão/dificuldade/pontos, preserva tipos e prefixa
texto iniciado `= + - @` para impedir fórmula.

## Segurança/bordas/UI

Nunca exportar senha/hash/token/código de acesso ou ranking histórico. Negar URL direta de outra
escola, filtro excessivo e CSV/formula injection. Limite de período/linhas, timeout e correlationId;
geração grande pode virar job em decisão futura, não agora. Botões mostram Aguarde/erro e download.

## Testes/aceite/entrega

Unitários de neutralização/filename; integração compara dataset/contagens com dashboard e inspeciona
PDF/XLSX; Playwright download por perfil, filtro e acesso hostil. Aceite: arquivos abrem, não executam
fórmula e não vazam campos. Relatório FM-024 e gates; fixar bibliotecas/versões no lockfile.

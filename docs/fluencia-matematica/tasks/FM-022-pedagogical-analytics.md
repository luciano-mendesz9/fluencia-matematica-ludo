# FM-022 — Indicadores, dashboards e feedbacks

**Ordem/fase:** 22/Resultados | **Branch:** `task/FM-022-pedagogical-analytics` | **Situação:** planejada

## Objetivo/bloqueios

Com FM-015/018 e OD-003, entregar consultas de participação, meta, precisão, dificuldade, prática
extra, repetição e feedback por regras, separados de pontos. BR-019/020, DATA-01–04.

## Serviços/rotas/contratos

Camada de filtros comum por escola/turma/atividade/aluno/período retorna denominadores e contexto.
Dashboards `/professor`, turma, aluno, `/escola` e `/admin` agregam conforme papel. Feedback requer
amostra configurada, cita evidência e link ao detalhe; nunca afirma diagnóstico/domínio. Contexto da
resposta é histórico e uso de áudio é neutro.

## Segurança/UI/bordas

Query começa pelo vínculo autorizado, não filtra só no fim; DTO por papel. Negar escola/turma/aluno
externos e cache compartilhado. Mostrar “dados insuficientes”, empty/loading/error, filtros preservados,
gráficos com tabela alternativa e mobile. Repetição não conta como questão distinta.

## Testes/aceite/entrega

Unitários de denominadores/limiares; integração compara fixtures e SQL de reconciliação; Playwright
filtros, detalhe, dados insuficientes e perfis. Aceite: cada número tem definição/denominador, ranking
não substitui feedback e nenhum dado cru vaza. Relatório FM-022 e gates.

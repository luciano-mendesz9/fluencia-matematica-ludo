# FM-021 — Ranking mensal por turma

**Ordem/fase:** 21/Resultados | **Branch:** `task/FM-021-monthly-ranking` | **Situação:** planejada

## Objetivo/decisões

Após FM-019 e OD-007, agregar PointEvent por turma e mês do servidor, exibir alunos ativos inclusive
zero, empate 1/1/3 e nenhum histórico consultável. BR-017, RANK-01–04.

## Consulta/rotas/DTO

Query usa intervalo civil America/Fortaleza confirmado, `classId` do evento e `awardedAt`; não faz
reset/delete/snapshot. DTO aluno contém posição, nome de apresentação e pontos; professor recebe
escopo autorizado. `/aluno/ranking` e bloco em turma/professor, mês atual apenas.

## Segurança/bordas/UI

Aluno vê turma atual permitida; professor assignment; coordenador escola. Negar classId externo,
email/código/erros no payload. Partida cruzando mês distribui por timestamp; transferência não move
eventos; fechamento não remove pontos. Empate visual e zero pontos acessíveis em mobile.

## Testes/aceite/entrega

Integração com clock controlado, virada, timezone/DST aplicável, empate, transferência e IDs hostis;
Playwright aluno/professor e acesso direto. Aceite: novo mês aparece zero sem apagar qualquer resposta/
evento e não existe rota de mês passado. Relatório FM-021 e gates.

# FM-014 — Participação, meta e prática adicional

**Ordem/fase:** 14/Atividade | **Branch conjunta:** `task/FM-013-FM-014-FM-015-activity-lifecycle` | **Situação:** verificada localmente

## Objetivo/decisão

Sobre FM-013, criar destinatários/participação e área do aluno com estados não iniciou/em andamento/
meta cumprida; progresso acumula entre partidas e continua após meta. BR-009/018. Confirmar OD-006;
sem confirmação, manter contrato parametrizado e não marcar pronta.

## Dados e contratos

Migration `ActivityParticipation` com enrollment histórico, acceptedAnswers, targetReachedAt,
extraAnswers e unique(activity,student). Serviço de abertura cria destinatários pela matrícula ativa;
`recordAcceptedAnswer` será chamado transacionalmente pelo jogo, nunca pelo cliente. DTO do aluno
mostra atividade/meta/progresso, sem respostas de colegas.

## Fluxo/segurança/concorrência

`/aluno` → atividade → jogo futuro; professor vê participação agregada. Negar aluno fora do destino,
atividade/turma alheia e incremento enviado pelo cliente. Retry/duas respostas ao mesmo desafio usam
unique e incrementam uma vez; 12 acertos+8 erros aceitos =20 se OD-006 confirmada.

## Testes/aceite/entrega

Integração de destinatários, meta exata, retry e nova partida; Playwright listas/estados e acesso
direto. Aceite: lançamento/áudio/abandono não contam, prática extra aparece separada e ainda será
pontuada em FM-019. Relatório FM-014, migration, gates.

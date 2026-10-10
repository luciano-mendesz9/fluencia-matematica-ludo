# FM-013 — Criação e cobertura de atividades

**Ordem/fase:** 13/Atividade | **Branch conjunta:** `task/FM-013-FM-014-FM-015-activity-lifecycle` | **Situação:** verificada localmente

## Objetivo/dependências

Com FM-011 e matriz curricular mínima OD-003, criar rascunho de atividade por turma, meta positiva,
seleção rede+próprias e validação de cobertura 1–6 antes da abertura. BR-008/ACT-01.

## Dados/contratos/rotas

Migration `Activity` e `ActivityQuestionVersion` fixa versão. Actions criar/editar/prever recebem
campos e IDs, derivam professor/escola/série pela turma, filtram versões elegíveis e retornam coverage
DTO sem gabaritos. `/atividades/nova`, preview e detalhe rascunho; ponto de retorno preserva turma.

## Segurança/estado/UI

Exigir assignment vigente; negar turma externa, questão privada alheia, série divergente, meta <=0,
versão retirada e revisão antiga. Rascunho editável; versões fixas na abertura. UI mostra lacunas por
dificuldade, estados vazio/loading/error e confirmação; mobile e teclado.

## Testes/aceite/entrega

Integração de elegibilidade/FKs/revisão; requisições manipuladas; Playwright compor banco misto,
falhar cobertura e obter preview. Aceite: nenhuma abertura possível sem seis dificuldades e nenhuma
mudança futura de questão reescreve seleção. Relatório FM-013, migration e gates.

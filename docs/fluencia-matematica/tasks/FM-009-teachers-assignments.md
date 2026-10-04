# FM-009 — Adultos, papéis e atribuições docentes

**Ordem/fase:** 9/Escola | **Branch:** `task/FM-009-teachers-assignments` | **Situação:** planejada

## Objetivo/escopo

Com FM-007, cadastrar adultos individualmente, atribuir membership e professor a turmas com período.
Resultado: mesmos credenciais globais podem atuar em várias escolas, sem papel global indevido.

## Dados/contratos/autorização

Migration `TeacherClassAssignment` e ajustes de unicidade de e-mail/membership. SEMED cria papéis
globais/locais; coordenador só cria/gerencia professor/aluno em sua escola e nunca SEMED/desenvolvedor.
Actions recebem alvo/mudança, derivam ator e escopo, validam período/turma e retornam DTO allowlisted.

## Fluxo, segurança, bordas e concorrência

Rotas de pessoas/atribuições com filtros locais, confirmação de revogação e estados vazios. Negar
autoelevação, escola/turma externa, último administrador municipal (se aplicável), e revogação com
request concorrente: serviço seguinte revalida vínculo e nega. Inativar, não apagar; auditar before/after.

## Testes/aceite/entrega

Integração de duplicidade/período; matriz SCOPE-01/05; Playwright coordenador e SEMED em desktop/mobile.
Aceite: professor de duas escolas vê conjuntos separados e revogação passa a valer imediatamente.
Relatório FM-009, migration e gates.

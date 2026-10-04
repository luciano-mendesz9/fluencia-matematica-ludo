# FM-007 — Anos letivos e turmas

**Ordem/fase:** 7/Escola | **Branch:** `task/FM-007-academic-years-classes` | **Situação:** planejada

## Objetivo e escopo

Após FM-006, entregar cadastro individual de ano letivo e turma (1º–5º) por SEMED/coordenador
escopado, lista/detalhe responsivos e status. Exclui alunos/docentes, importação e atividade.

## Dados/contratos/segurança

Migration `AcademicYear(schoolId,year,status)` e `ClassGroup(schoolId,academicYearId,grade,name,status)`
com FK coerente e unicidade. Actions aceitam campos editáveis, derivam schoolId do contexto autorizado,
releem recurso escopado e retornam DTO. Bloquear ano de outra escola, série fora 1–5, duplicidade,
papel professor e encerramento com dependências ativas sem política.

## Fluxo/UI/concorrência

`/escola/anos`, `/escola/turmas`, detalhe com breadcrumbs e retorno preservado; formulário com busy,
erros 409/422 e estados vazios. Revisão otimista evita sobrescrita concorrente. Exclusão física não é
permitida; inativação auditada.

## Testes/aceite/entrega

Integração de FKs/unicidade/revisão; tentativa cross-school; Playwright criar/listar/editar/inativar
desktop+390. Gates. Aceite: nenhuma turma cruza escola/ano e toda mutação gera AuditEvent. Relatório
FM-007 e migration focada.

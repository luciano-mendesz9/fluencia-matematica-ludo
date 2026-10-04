# FM-010 — Banco de questões e versionamento

**Ordem/fase:** 10/Conteúdo | **Branch:** `task/FM-010-question-bank` | **Situação:** planejada

## Objetivo e dependências

Após FM-008/009 e definição mínima OD-003, criar temas/habilidades, identidade da questão, versões e
consulta combinada de banco SEMED+privado. BR-005/006; resultado observável é CRUD versionado sem
expor conteúdo particular.

## Dados/serviços/rotas

Migration `Theme`, `Skill`, `Question`, `QuestionVersion`; índices série/dificuldade/origem/status.
`createQuestion`, `createVersion`, `listEligibleQuestions` validam autoria e escopo. Versão usada ou
publicada é imutável; edição cria número/contentHash novo. `/questoes` e `/questoes/[id]` mostram
origem/estado/histórico permitido; exclui editor completo de opções/mídia (FM-011).

## Segurança/bordas/UI

Professor vê rede+próprias em qualquer escola onde tenha turma, nunca privadas alheias; SEMED gere
rede. Negar owner/visibility enviados, série/dificuldade inválidas, habilidade incompatível e IDOR.
Concorrência usa revisão/unique version. Filtros em query string, retorno preservado, empty/forbidden.

## Testes/aceite/entrega

Integração de versão/ownership/concorrência; Q-01/02/04; Playwright criar, filtrar e versionar. Gates.
Aceite: fatos anteriores continuam apontando versão antiga e DTO de lista não contém gabarito. Relatório
FM-010, migration; conteúdo curricular não é inventado se OD-003 faltar — tarefa fica bloqueada.

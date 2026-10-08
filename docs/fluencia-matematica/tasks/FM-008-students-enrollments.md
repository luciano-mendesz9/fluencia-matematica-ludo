# FM-008 — Alunos, códigos e matrículas

**Ordem/fase:** 8/Escola | **Branch:** `task/FM-008-students-enrollments` | **Situação:** verificada com PostgreSQL/Chromium; integração em preparação

## Objetivo/dependências

Sobre FM-007, cadastrar aluno individual, gerar código estável e criar/encerrar matrícula principal.
Preservar histórico na troca de turma. BR-004, AUTH-01 e regra de não reatribuir fatos passados.

## Dados e contratos

Migration `Enrollment(studentId,classId,startsAt,endsAt,status,revision)` e constraints para uma
matrícula ativa principal. Serviço cria User aluno+senha temporária em transação, gera código único
não previsível e retorna código uma vez ao operador autorizado, nunca senha/hash em listas. Transferir
encerra anterior e cria nova; não atualiza respostas/pontos.

## Segurança/UI/bordas

SEMED ou coordenador da escola; professor somente leitura de turma atribuída. Negar classe externa,
duplicidade, aluno adulto, período inválido e duas transferências concorrentes. Rotas lista/detalhe/
cadastro e redefinição via FM-005; confirmação segura e mobile. Sem importação ou dados excessivos.

## Testes/aceite/entrega

Integração de unicidade/transação/corrida; requisições cross-school; Playwright cadastro, login do
aluno, troca de turma e acesso negado. Aceite: código estável e contexto histórico intacto. Relatório
FM-008, migration, gates; transferência do ranking futuro depende FM-021.

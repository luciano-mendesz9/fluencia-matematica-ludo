# FM-006 — Escolas, vínculos e contexto escolhido

**Ordem/fase:** 6/Escola | **Branch:** `task/FM-005-FM-006-authorization-schools-context` | **Situação:** verificada na branch

## Objetivo/dependências

Com FM-005 integrada, implementar escola/membership, CRUD SEMED mínimo, professor multi-escola e
`/selecionar-escola`. BR-002/003 e SCOPE-02/04. Resultado: preferência local por usuário acelera a
navegação, mas o servidor sempre confirma o vínculo.

## Dados, contratos e rotas

Migration `School`, `SchoolMembership` com papel/status/período e unicidades. Serviços listam apenas
DTO `{id,name,role}` permitidos. Action recebe apenas `schoolId`; seleção efetiva fica em cookie/
parâmetro assinado ou request contextual e `localStorage[school:userId]` é conveniência client-side.
Rotas admin de cadastro individual e seletor/troca.

## Segurança, estados e fluxo

SEMED gerencia; coordenador não eleva papéis; professor vê vínculos próprios. Preferência de outra
conta, vínculo revogado ou ID alterado retorna seleção/403. Troca limpa turma/filtros incompatíveis e
caches privados. UI cobre zero/uma/múltiplas escolas, loading, erro e mobile.

## Testes/aceite/entrega

Integração de período/duplicidade/revogação; requisições hostis; Playwright primeiro acesso, retorno,
troca, duas contas no navegador e acesso direto. Aceite: User não tem `schoolId`; professor alterna
sem vazamento. Relatório FM-006, migration e gates; sem importar escolas.

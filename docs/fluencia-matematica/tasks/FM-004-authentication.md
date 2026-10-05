# FM-004 — Autenticação, credenciais e sessão

**Ordem/fase:** 4/Base | **Branch:** `task/FM-004-authentication` | **Situação:** integrada

## Objetivo/dependências

Após FM-002/003, implementar login de adulto por e-mail e aluno por código, hash bcrypt e JWT
assinado em cookie com sessão revogável no banco, além de logout. Resultado: `/login` real direciona ao fluxo autorizado. Regras
BR-001/003; [segurança](../03-server-security.md); ADR-004.

## Dados, rotas e contratos

Evoluir `User/Session` com identificadores canônicos, status, tokenHash/expiry/revocation; migration
preserva dados. Server Action `login({identifier,password}) → {ok,redirect}` e `logout`; nunca retorna
hash/token/razão de falha específica. UI branca/azul, autocomplete correto, busy e erro anunciado.

## Validação e bordas

Validar tamanho/formato, rate limit, comparação constante, usuário ativo e sessãoVersion; cookie
HttpOnly/Secure/SameSite, rotação e expiração. Testar enumeração, SQL/input extremo, conta bloqueada,
cookie alterado, logout/replay e chamadas diretas. Duplo submit não cria sessões ilimitadas.

## Implementação/testes/aceite

Migration → auth primitives → serviços → actions → páginas → fixtures sintéticas. Unitários de
normalização; integração PostgreSQL de hash/sessão/revogação; Playwright AUTH-01/02 adulto/aluno e
acesso direto. Gates completos. Aceite: identidade deriva só do cookie e nenhuma página protegida
confia no login visual. Relatório FM-004; provedor de e-mail está excluído.

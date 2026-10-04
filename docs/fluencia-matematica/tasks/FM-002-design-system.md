# FM-002 — Design system e shells compartilhados

**Ordem/fase:** 2/Base | **Branch:** `task/FM-002-design-system` | **Situação:** planejada

## Objetivo, dependências e escopo

Sobre FM-001 integrada, entregar tokens branco/azul, componentes acessíveis e shells público,
administrativo, professor e aluno em rotas estruturais reais. Referências: [design](../08-design-system.md)
e [fluxos](../07-routes-and-user-flows.md). Não cria dashboards de mentira nem dados pedagógicos.

## Componentes, contratos e UI

`src/components/ui/*`, `src/components/layout/*`, tokens em CSS, páginas de demonstração somente se
explicitamente identificadas como catálogo interno. Props são DTOs mínimos (`currentUserLabel`,
`schoolOptions`) e nunca registros. Header/sidebar/drawer, botão, formulário, tabela, badge, modal,
feedback e todos os estados; foco, reduced motion, 44px e contraste AA. 320/390/desktop sem overflow.

## Segurança, bordas e sequência

Shell não autoriza rota; ação escondida não substitui política. Preferência de escola ainda não é
implementada. Construir tokens → primitives → shell responsivo → estados → testes. Loading e busy
usam `aria-busy`/“Aguarde...”; modal restaura foco; cores sem significado isolado.

## Testes, aceite e entrega

Unitários de variantes essenciais; Playwright por teclado, drawer, foco/modal e screenshots revisadas
nas três larguras. Rodar gates de FM-001. Aceite: paleta correta, links existentes do shell estrutural,
sem botões falsos e sem regressão do smoke. Relatório FM-002; commit/push/PR; risco: identidade visual
final (OD-010) pode ajustar tokens sem bloquear a base.

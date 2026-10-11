# Redesenho das interfaces adultas — 10/10/2026

## Identificação

- Branch: `codex/frontend-adult-redesign`
- Base local: `task/FM-017-game-session-turns` em `be6bb46`
- Referência visual: `/home/luciano_mendesz9/Downloads/index(2).html`
- Escopo: somente apresentação e interação de frontend para administrador SEMED, coordenação, professor, operação e login.
- Exclusão expressa: páginas e shell do aluno, preservados para uma identidade visual posterior.

## Entrega

- Shell adulto responsivo com cabeçalho fixo, sidebar, drawer móvel, rota ativa, contexto escolar e identificação da conta.
- Navegação com ícones vetoriais locais, sem nova dependência ou carregamento externo.
- Bordas de controles com 1 px e cores suaves; cards com sombra discreta e foco visível.
- Painéis iniciais de administrador, coordenação e professor com contagens consultadas nos serviços existentes, sem indicadores simulados.
- Painel de operação sem dados pedagógicos ou métricas fictícias.
- Login responsivo com placeholders, instruções distintas para adultos e alunos, mostrar/ocultar senha, estado ocupado e mensagens existentes preservadas.
- Componentes de botão e campo harmonizados com o novo padrão.
- Shell e navegação do aluno separados e mantidos no padrão anterior.

## Limites preservados

- Nenhuma alteração em serviços, actions, autorização, schema Prisma, migrations ou banco de dados.
- Nenhuma implementação antecipada de analytics, ranking, relatórios ou recursos previstos em FMs futuras.
- Nenhum PR, merge ou integração na branch principal.

## Verificação executada

| Gate | Resultado |
| --- | --- |
| `npm run typecheck` | aprovado |
| `npm run lint` | aprovado |
| `npm test` | 14 arquivos, 62 testes aprovados |
| `npm run build` | aprovado com Next.js 16.3.8 e 41 rotas reconhecidas |
| `npm run test:e2e -- tests/e2e/design-system.spec.ts` | Chromium: 5 cenários aprovados |
| Responsividade | 320 px, 390 px e desktop sem overflow no cenário automatizado |
| Login | placeholders e alternância mostrar/ocultar senha verificados no navegador |

O primeiro ciclo E2E revelou seletores parciais nos helpers para `Senha` e `Menu`, pois os novos controles acessíveis incluem `Mostrar senha` e `Fechar menu`. Os helpers foram tornados exatos. O mesmo ciclo evidenciou que o drawer compartilhado alcançava o aluno; os componentes foram separados antes da aprovação final.

## Estado

- Implementada: sim.
- Verificada localmente: sim, nos gates listados.
- Publicada: sim, na branch `codex/frontend-adult-redesign`.
- Integrada: não.
- Validação humana de identidade visual: pendente de revisão do responsável.

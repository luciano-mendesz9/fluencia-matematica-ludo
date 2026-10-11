# Redesenho das interfaces do aluno — 10/10/2026

## Identificação

- Branch: `codex/frontend-adult-redesign`
- Base local: `task/FM-017-game-session-turns` em `be6bb46`
- Referência visual: `/home/luciano_mendesz9/Downloads/aluno.html`
- Escopo: shell, início, lista de atividades, detalhe/progresso e partida do aluno.
- Premissa: o HTML foi usado como referência visual; cada tela foi adaptada às rotas e aos dados reais do projeto Next.js.

## Entrega

- Identidade visual própria do aluno, separada do shell adulto, com cabeçalho, avatar, navegação desktop e barra inferior móvel.
- Página inicial com missão principal, progresso real, contagem de atividades e demais atividades abertas.
- Rota própria `/aluno/atividades` para a lista completa de atividades disponíveis.
- Cards de atividade reutilizáveis com estado, turma, ano, prazo pedagógico, progresso e ação contextual.
- Detalhe da atividade com progresso, acertos, erros, respostas extras e meta, mantendo os dados fornecidos pelo servidor.
- Painel de partida remodelado sobre o fluxo real de FM-017: iniciar sessão, lançar dado, acompanhar fase, desafio e resumo do tabuleiro.
- Navegação responsiva e foco visível, com controles de borda fina e contraste compatível com a linguagem branca e azul do produto.

## Limites preservados

- Ranking, pontuação e perfil gamificado não foram simulados, pois dependem das entregas futuras FM-019 e FM-021.
- Resposta ao desafio e movimento no tabuleiro não foram antecipados, pois pertencem à FM-018 e às etapas seguintes do jogo.
- Nenhuma alteração em serviços, actions, autorização, schema Prisma ou migrations.
- Nenhum PR, merge ou integração na branch principal.

## Verificação executada

| Gate | Resultado |
| --- | --- |
| `npm run typecheck` | aprovado |
| `npm run lint` | aprovado após remoção de propriedade não utilizada |
| `npm run test:e2e -- tests/e2e/design-system.spec.ts` | Chromium: 5 cenários aprovados |
| `npm run test:e2e -- tests/e2e/activity-lifecycle.spec.ts` | Chromium: fluxo professor/aluno aprovado |
| Responsividade | tela inicial do aluno inspecionada em 390 px, sem overflow e com navegação inferior funcional |
| Fluxo real | professor publica; aluno visualiza, inicia e lança o dado; professor encerra; estado encerrado é preservado |

## Estado

- Implementada: sim, dentro das capacidades já existentes no projeto.
- Verificada localmente: sim, nos gates listados.
- Publicada: sim, na branch `codex/frontend-adult-redesign`.
- Integrada: não.
- Validação humana de identidade visual: pendente de revisão do responsável.

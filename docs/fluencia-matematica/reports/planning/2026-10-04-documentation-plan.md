# Relatório do plano documental — 04/10/2026

## Resultado

Foi criado o contrato documental do MVP até o piloto sem implementar FM-001, instalar pacotes,
criar Prisma Client/migration ou acessar banco. O PRD original foi preservado. O repositório real já
possuía Create Next App, apesar da premissa de projeto vazio; a divergência foi registrada e FM-001
passou a auditar/completar a base existente.

## Git observado

- Base local: `main` em `930b759` (`Initial commit from Create Next App`).
- Branch desta entrega: `docs/fluencia-development-plan`.
- Remoto: nenhum configurado na inspeção; push/PR ficam pendentes, sem inventar destino.
- `docs/` já estava não rastreado com `PRD.md`; ele não foi reescrito.

## Arquivos e fases

Foram adicionados README e 15 documentos numerados; cinco ADRs+índice; 27 especificações FM+índices;
dois templates; índice de relatórios e este relatório. `AGENTS.md` recebeu somente diretrizes
compatíveis, preservando o bloco gerado pelo Next.

Ordem: base FM-001–005; estrutura escolar 006–009; conteúdo/atividades 010–015; jogo/pontos 016–020;
resultados 021–024; qualidade/operação/piloto 025–027. O grafo é acíclico; FM-016 pode ser executada
em paralelo após FM-001, mas precisa estar integrada antes de FM-017.

## Decisões firmadas e pendentes

Firmadas: Next App Router/TypeScript/npm, PostgreSQL/Neon exclusivo, client Prisma central, validação
servidor, visual branco/azul, Playwright, online, cadastro individual, fórmula 10/7/4/1 e bônus 30.
Pendências têm IDs OD-001–010; as de alto impacto bloqueiam somente tarefas afetadas. Fornecedores,
política municipal, conteúdo pedagógico e detalhes complementares do Ludo não foram falsamente
promovidos a decisões.

## Verificações documentais

- inventário e status Git, branch, remotes, PRD completo e instruções locais;
- documentação Next 16.3 instalada para fronteiras server/client, segurança e Server Actions;
- fontes oficiais atuais de Next, Prisma 7/Neon, Tailwind 4 e Playwright;
- conferência de estrutura, IDs/branches/tarefas, links relativos, dependências e fórmulas;
- `git diff --check` e revisão do status/diff antes do commit.

Resultados: 56 arquivos Markdown inspecionados; links relativos dos arquivos novos válidos; 27 IDs,
arquivos, branches e entradas no índice reconciliados; dependências acíclicas pela ordem; facetas de
objetivo, segurança, testes, aceite e relatório presentes em cada tarefa; diff novo sem whitespace.
O PRD preservado contém whitespace final preexistente nas linhas 3–6 e foi excluído apenas desse
check de estilo para não reescrever a fonte de verdade.

Os comandos/resultados finais de conferência são registrados no fechamento desta execução. Não foram
executados testes da aplicação como evidência da documentação; a validação aqui é documental.

## Próximo passo

Revisar e integrar esta branch à base. Depois, solicitar **“Desenvolva a tarefa FM-001.”** O agente
deve confirmar a integração no Git, criar/reutilizar `task/FM-001-bootstrap`, auditar o scaffold atual,
atualizar o patch de segurança do Next e entregar os gates/Playwright smoke com relatório próprio.

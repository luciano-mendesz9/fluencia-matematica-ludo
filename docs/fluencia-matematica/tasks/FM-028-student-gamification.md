# FM-028 — Gamificação e nova experiência do aluno

## Objetivo

Transformar a área do aluno a partir do protótipo `fluencia-matematica.html`, mantendo a identidade
branca e azul, a acessibilidade e os fluxos reais já existentes. O HTML é referência de produto e
interface; estados demonstrativos não são fonte de autorização nem substituem persistência.

## Dependências

- FM-019: eventos imutáveis de pontos e bônus de vitória.
- FM-021: ranking mensal autorizado da turma.
- FM-025: requisitos responsivos e de acessibilidade.

## Escopo decidido em 22/10/2026

1. Catálogo persistente de dez patentes. Bronze é o nível inicial 0 e Prata é o nível 1. Cada
   promoção de Prata a Lenda exige 50 XP; o limiar acumulado é derivado sem alterar o ledger.
2. Oito conquistas do protótipo, avaliadas a partir de eventos/respostas/ranking reais e registradas
   de modo idempotente. Para facilitar teste e demonstração: pódio top 3, sequência de 3 dias,
   100 XP, 3 acertos seguidos, primeiro lugar, 250 XP, 5 acertos e patente Diamante (nível 7).
3. Sequência diária derivada de respostas aceitas no fuso `America/Fortaleza`. Uma sequência ainda
   permanece vigente quando a última prática ocorreu ontem; dias sem resposta encerram a sequência.
4. Catálogo de minigames persistente com somente Ludo e Corrida Matemática. Somente o Ludo está
   ativo. A liberação ao aluno depende de uma atividade aberta do professor; sem atividade ele
   aparece com cadeado em “Próximas missões”. Corrida Matemática aparece como futura, sem simular
   jogabilidade.
5. Nova navegação: Início, Jogos, Ranking, Conquistas e Perfil. Atividades e resultados continuam
   acessíveis como histórico/apoio, sem perda dos fluxos existentes.
6. Avatar persistente com tom de pele, cor de roupa, estilo e cor de cabelo. A atualização autentica
   o aluno, aceita somente valores permitidos, usa revisão otimista e registra auditoria.
7. Ranking redesenhado com pódio, avatar e patente, preservando pontos mensais, empates competitivos,
   isolamento por turma e DTO sem código, e-mail ou identificadores técnicos.

## Requisitos de servidor e banco

- `StudentRank`, `Achievement`, `StudentAchievement`, `StudentProfile` e `Minigame` são persistentes.
- XP total e patente são derivados de `PointEvent`; não criar saldo editável nem reset mensal.
- Conquistas são reavaliadas de forma idempotente e uma conquista obtida não é removida.
- A atividade referencia seu minigame; novas atividades usam Ludo enquanto ele for o único ativo.
- Toda leitura/mutação privada revalida conta de aluno e matrícula/escopo aplicável no servidor.
- Migração compartilhada só pode ser executada após confirmação do ambiente e autorização explícita.

## Aceite

- Testes unitários cobrem patentes, sequência, acertos consecutivos e critérios de conquistas.
- Testes PostgreSQL cobrem seed dos dez níveis, desbloqueio idempotente, isolamento e avatar.
- Playwright cobre 390 px, desktop, navegação, Ludo bloqueado/liberado, conquistas e edição do avatar.
- Lint, typecheck, Prisma validate/generate, build Webpack e `git diff --check` passam.
- Relatório em `reports/FM-028/`, com status separado para código, banco, navegador e publicação.

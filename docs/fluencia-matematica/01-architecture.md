# Arquitetura do MVP

## Estrutura e fronteiras

```text
app/                 rotas, layouts, Server Components e adaptadores de entrada
src/components/      UI compartilhada; Client Components apenas para interação/browser
src/features/*/      actions, schemas, DTOs e composição por domínio
src/server/auth/     sessão, papéis e políticas
src/server/services/ casos de uso; única implementação das regras
src/server/data/     consultas escopadas e mapeamento para DTO
src/domain/          regras puras de Ludo, pontos e indicadores
src/lib/prisma.ts    único ponto de Prisma/Neon
prisma/              schema e migrations por tarefa
tests/               unitários, integração e e2e
```

Pages/layouts são Server Components por padrão. Só seletores interativos, formulários, gráficos,
áudio, animação do tabuleiro e acesso a `localStorage` recebem `use client`. Dados privados são
carregados no servidor e reduzidos a DTOs permitidos antes de cruzar a fronteira.

## Entradas

Server Actions atendem formulários/mutações da própria UI e chamam serviços protegidos. Route
Handlers atendem downloads, mídia, callbacks externos e endpoints do jogo que pedem semântica HTTP.
Nenhuma regra é duplicada: ambos são adaptadores sobre o mesmo serviço. Cada entrada é tratada como
POST/GET diretamente alcançável e reautoriza a operação.

## Serviço protegido

`identifySession → requireActiveUser → requireRole/membership → parseInput → loadScopedResource →
assertState/revision → transact/idempotency → mapAllowedDTO`. Erros públicos têm `code`, mensagem
segura e `correlationId`; detalhes ficam em log sanitizado. Não retornar registros Prisma crus.

## Consistência

Mutações de resposta/jogo/pontos usam transação, chave de idempotência única e revisão otimista.
Conflito retorna estado atual sem repetir dado, resposta ou prêmio. E-mail/áudio/armazenamento ficam
fora de transações longas; usar outbox/job apenas quando uma tarefa provar necessidade.

## Identidade e contexto

`User` é global. `SchoolMembership` dá papel por escola, `TeacherClassAssignment` limita turma e
`Enrollment` limita aluno. Escola/turma selecionadas são filtros; toda autorização deriva da sessão
e de vínculos atuais. Cache privado deve incorporar usuário e escopo ou ser evitado.

## Bibliotecas propostas

Prisma 7 + adapter Neon (dados); Zod 4 (entrada/saída); Argon2id (hash); biblioteca de sessão
avaliada em ADR-004; date-fns/tz ou Temporal disponível para mês municipal; Playwright (E2E), Vitest
(unidade), Testing Library (componentes quando útil), axe-core (auditoria), ExcelJS (XLSX com
neutralização de fórmula) e React-pdf ou renderer server-side avaliado para PDF. Dependências de
e-mail, TTS e mídia permanecem abertas e atrás de interfaces.

## Referências Next 16.3

Parâmetros de rota são assíncronos; Turbopack é padrão; `proxy.ts` não substitui autorização.
Server Actions são endpoints não confiáveis, fazem checagem básica de origem, mas ainda exigem
autenticação/autorização/validação. Seguir os guias versionados em `node_modules/next/dist/docs/`.

# Estratégia de testes

## Camadas e scripts planejados

FM-001 adiciona `typecheck` (`tsc --noEmit`), `lint` (`eslint .`), `test`/`test:unit` (Vitest),
`test:integration`, `test:e2e` (`playwright test --project=chromium`), `test:e2e:all`,
`test:e2e:ui` e `ci` sequencial `lint && typecheck && test && build && test:e2e`.

Unidade cobre pontuação, movimentos, turnos, normalização numérica e indicadores. Integração usa
PostgreSQL/Neon isolado real para vínculos, constraints, transações, idempotência e corridas; mocks
de Prisma não provam integridade. Requisições diretas adulteram IDs, papéis, score, correto e revisão.

## Playwright

`playwright.config.ts`: `baseURL` de teste; `webServer` inicia aplicação; `reuseExistingServer` só
fora de CI; Chromium no desenvolvimento; traces em primeira repetição e screenshot/vídeo em falha.
Projetos desktop, 390px e 320px; Firefox/WebKit em marcos FM-025/027. Locators por papel/rótulo,
sem sleeps arbitrários. Sorteio controlado existe apenas em servidor E2E autenticado e banco de
teste; cliente não escolhe dado/gabarito.

Setup cria banco/branch explicitamente identificado, aplica migrations e seed sintético; cleanup
por namespace da execução. `storageState` sintético fica ignorado e nunca é commitado. Falta de URL,
banco, browser ou credencial falha com diagnóstico; não vira skip aprovado.

## CI

GitHub Actions futuro: npm cache + `npm ci`; conferência Node; lint/typecheck/unidade/build; job de
integração/E2E com secrets de banco de teste protegido; `prisma migrate deploy`; Playwright browsers
instalados por versão; relatório HTML/trace em falha. Nunca aponta para produção. Job valida um
identificador explícito de ambiente e allowlist antes de seed/reset.

## Evidência

Relatório da tarefa registra comando, ambiente lógico, contagem e resultado. Artefatos pequenos
selecionados podem ficar em `reports/FM-XXX/assets/`; HTML/traces grandes no CI com retenção definida.
Screenshot complementa assertion e revisão humana; snapshots não são atualizados só para “ficar verde”.

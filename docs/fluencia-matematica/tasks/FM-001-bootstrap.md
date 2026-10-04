# FM-001 — Bootstrap executável e testável

**Ordem/fase:** 1/Base | **Branch:** `task/FM-001-bootstrap` | **Situação:** verificada

## Objetivo e resultado observável

Auditar o Create Next App já presente, atualizar Next 16.3.3 para o patch seguro 16.3.8 (ou patch
mantido revalidado), fixar Node/npm/dependências e criar os scripts/gates, Vitest e Playwright smoke.
`/` deve abrir em Chromium e os comandos documentados devem passar.

## Pré-condições, referências e escopo

Base `main`; sem banco. Ler [decisões](../00-context-and-decisions.md), [arquitetura](../01-architecture.md),
[testes](../09-testing-and-playwright.md) e docs Next instaladas. Inclui config, diretórios mínimos,
CI local e página inicial neutra; exclui auth, Prisma, design completo e funcionalidade pedagógica.

## Arquivos/contratos/segurança

Previstos: `package.json/lock`, engines, `vitest.config.ts`, `playwright.config.ts`, `tests/e2e/smoke.spec.ts`,
config de coverage/ignores e README operacional. Não há migration. Página retorna só conteúdo público;
nenhum secret/browser hook de teste entra no bundle de produção.

## Implementação, testes e aceite

Revalidar advisories; atualizar versões compatíveis; criar scripts `lint`, `typecheck`, `test`,
`test:integration`, `test:e2e`, `test:e2e:all`, `build`; instalar browsers; smoke por papel/rótulo.
Rodar `npm ci`, lint, typecheck, unidade, build e Chromium E2E. Aceite: lock reproduzível, nenhum erro,
Playwright inicia seu `webServer`, trace só em falha e documentação não promete banco inexistente.

## Entrega/riscos

Relatório `reports/FM-001/YYYY-MM-DD-attempt-NN.md`, commit e push/PR quando remoto existir. Registrar
download de browsers/rede indisponível como bloqueio. Não inicializar outro app nem apagar bootstrap.

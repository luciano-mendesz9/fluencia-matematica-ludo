<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Fluência Matemática

Antes de trabalhar, leia `docs/fluencia-matematica/PRD.md`, `00-context-and-decisions.md`,
`12-agent-workflow.md`, `tasks/INDEX.md` e a especificação FM solicitada. Preserve mudanças
existentes. Use a branch exata da tarefa e produza o relatório obrigatório.

Toda operação privada deve autenticar, autorizar vínculos e validar entrada/estado no servidor.
A interface é branca e azul, responsiva e acessível. Uma tarefa com UI só termina com fluxo real,
testes de servidor/banco e Playwright aplicáveis; tela estática não é funcionalidade concluída.

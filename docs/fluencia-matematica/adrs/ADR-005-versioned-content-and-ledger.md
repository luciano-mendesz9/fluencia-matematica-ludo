# ADR-005 — Conteúdo versionado e ledger imutável

**Estado:** aceito tecnicamente.

Questões respondidas apontam para versão imutável; editar cria nova versão. Atividade aberta fixa
versões. Compartilhar com SEMED cria cópia rastreável, sem mudar o original. Respostas e eventos de
pontos são fatos append-only; correções futuras usam evento compensatório/auditoria.

Isso preserva explicabilidade, ranking e feedback históricos. Custa armazenamento e exige consultas
com contexto congelado, mas impede reescrever gabarito, turma ou pontos de uma interação passada.

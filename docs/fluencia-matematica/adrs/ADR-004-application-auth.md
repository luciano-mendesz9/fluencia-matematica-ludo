# ADR-004 — Autenticação gerenciada pela aplicação

**Estado:** aceito pelo responsável em 04/10/2026; provedor de e-mail pendente.

O MVP precisa de código+senha para aluno e e-mail+senha para adultos, papéis/vínculos locais,
revogação e reset assistido. Por decisão explícita do responsável, a credencial própria usa bcrypt e
JWT assinado em cookie HttpOnly. O hash do JWT é persistido em `Session`, permitindo expiração,
rotação e revogação no servidor; validar apenas a assinatura nunca é suficiente. `proxy.ts` faz uma
triagem criptográfica de rota, mas páginas, Actions e serviços revalidam sessão e usuário no banco.

Alternativa de IdP externo só é aceita se suportar alunos sem e-mail, controle municipal, exportação
e custo acordado. Independentemente do fornecedor, serviços derivam identidade da sessão e
revalidam vínculos.

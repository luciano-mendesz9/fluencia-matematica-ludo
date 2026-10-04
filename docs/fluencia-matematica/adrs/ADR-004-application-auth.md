# ADR-004 — Autenticação gerenciada pela aplicação

**Estado:** proposto; provedor de e-mail pendente.

O MVP precisa de código+senha para aluno e e-mail+senha para adultos, papéis/vínculos locais,
revogação e reset assistido. Planeja-se credencial própria com Argon2id, sessões opacas em cookie
HttpOnly e tokens de reset armazenados por hash. Uma biblioteca de sessão madura pode implementar
primitivas, sem terceirizar autorização escolar.

Alternativa de IdP externo só é aceita se suportar alunos sem e-mail, controle municipal, exportação
e custo acordado. Independentemente do fornecedor, serviços derivam identidade da sessão e
revalidam vínculos.

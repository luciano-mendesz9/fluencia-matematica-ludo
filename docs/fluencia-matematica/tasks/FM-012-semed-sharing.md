# FM-012 — Envio e publicação de questões pela SEMED

**Ordem/fase:** 12/Conteúdo | **Branch:** `task/FM-011-FM-012-question-editor-semed-sharing` | **Situação:** verificada e publicada na branch combinada; não integrada

## Objetivo

Implementar enviada → em análise → aprovada/publicada, ajustes solicitados ou recusada. Aprovação
cria cópia SEMED rastreável da versão enviada e preserva a questão particular. Depende FM-011;
BR-006/Q-03.

## Dados/contratos/segurança

Migration `QuestionSubmission(sourceVersionId,submitter,status,reviewer,decision...)`. Autor envia
versão própria; revisor SEMED decide com revisão esperada. Payload contém decisão/notas validadas;
serviço copia conteúdo/opções/mídia em transação, registra origem e AuditEvent. Não altera owner/
visibilidade original nem publica edição posterior silenciosa.

## Fluxo e bordas

Professor: detalhe → enviar → acompanha estado. SEMED: fila → análise → decisão → banco da rede.
Estados busy, vazio, conflito e histórico. Negar professor publicando, revisor sem papel, versão
alheia, duplo submit e duas decisões; retry devolve resultado original.

## Testes/aceite/entrega

Integração de transição/idempotência/cópia; requisições hostis; Playwright envio, recusa/ajuste e
aprovação. Aceite: original e cópia têm IDs distintos, source rastreável, outro professor vê apenas
cópia publicada. Relatório FM-012, migration e gates.

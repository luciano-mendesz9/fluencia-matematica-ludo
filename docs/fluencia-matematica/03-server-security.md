# Segurança e validação no servidor

## Sequência obrigatória

Toda consulta privada, Action, Handler e exportação: identificar usuário pela sessão; verificar
usuário/sessão ativos; confirmar papel e vínculo vigente; validar forma e semântica da entrada;
buscar o recurso já filtrado pelo escopo; validar estado/revisão/regra; executar mutação atômica e
idempotente; retornar DTO allowlisted. `userId`, `schoolId`, `classId`, papel, dado, acerto e pontos
do cliente nunca comprovam autoridade.

## Matriz de ações críticas

| Ação/serviço | Entrada confiável do cliente | Permissão/estado | Burla e resposta | Teste |
| --- | --- | --- | --- | --- |
| login | identificador/senha | conta ativa, rate limit | enumeração/força bruta → mensagem genérica/429 | AUTH-01/02 |
| selectSchool | schoolId | membership atual | ID de outra escola → 403 | SCOPE-02/04 |
| manageMembership | target + mudança | SEMED ou coordenador limitado | elevar papel/fora da escola → 403 | SCOPE-05 |
| manageClass/enrollment | IDs + campos | vínculo gestor, ano ativo | aluno/turma externa → 404/403 | integração |
| saveQuestion | conteúdo | autor/SEMED; ownership | gabarito/owner forjado → 403/422 | Q-01/02 |
| submit/publishQuestion | versionId/decisão | autor/revisor SEMED; estado | publicar versão privada direta → 409/403 | Q-03/04 |
| open/closeActivity | id/revision | docente da turma; cobertura/estado | turma alheia/revisão antiga → 403/409 | ACT-01/04 |
| rollDice | gameId/actionId/revision | próprio aluno; turno/fase | valor de dado enviado/retry → ignorar/resultado original | LUDO-01/03 |
| answer | challengeId/actionId/revision/resposta | próprio, pendente, aberta | `correct/score` forjado/dupla aba → ignorar/409 | PTS-01/integração |
| move | gameId/piece/actionId/revision | após acerto, movimento legal | casa/pontos forjados → 422/409 | LUDO-07/08 |
| ranking | classId | matrícula/vínculo permitido | outra turma → 403; DTO mínimo | RANK-01 |
| report/export | filtros | professor/coordenador no escopo | schoolId alterado → 403 | EXPORT-01/02 |
| media | mediaId | escopo da questão/atividade | URL privada externa → 404 | AUDIO-01 |
| technical logs | filtros | desenvolvedor autorizado | dados pedagógicos → campos ausentes | SCOPE-06 |

## Controles

- Cookie `HttpOnly`, `Secure`, `SameSite=Lax/Strict` conforme fluxo; rotação, expiração e revogação
  por `sessionVersion`. CSRF: proteção de origem do Next em Actions mais token/origin explícito para
  rotas que precisem; nenhuma mutação via GET.
- Argon2id com parâmetros medidos; token de reset aleatório, hash no banco, uso único e expiração.
- Rate limit por conta/IP com armazenamento compartilhado antes do piloto; não registrar senha/token.
- Upload: allowlist MIME real/assinatura, tamanho, dimensão, antivírus quando aplicável, nome gerado,
  bucket privado e URL temporária; SVG/HTML não confiável não é servido inline.
- DTOs escondem gabarito até resposta aceita e escondem questões particulares de outros autores.
- Logs têm correlação, ação, resultado e IDs mínimos; valores sensíveis são redigidos.
- Idempotência e concorrência vivem no banco. Botão desabilitado é apenas UX.

Erros públicos: `UNAUTHENTICATED` 401, `FORBIDDEN` 403, `NOT_FOUND` 404 sem revelar existência,
`VALIDATION` 422, `STATE_CONFLICT` 409 com revisão atual, `RATE_LIMITED` 429 e `INTERNAL` 500 com
correlationId.

# FM-005 — Políticas de autorização e recuperação

**Ordem/fase:** 5/Base | **Branch:** `task/FM-005-FM-006-authorization-schools-context` | **Situação:** verificada na branch

## Objetivo/escopo

Sobre FM-004, criar guards reutilizáveis de usuário/papel/vínculo, revogação de sessão, reset
assistido do aluno e fluxo temporário de adulto atrás de interface de e-mail. Inclui `PasswordReset`
e auditoria; exclui escolha final de fornecedor (OD-005).

## Contratos e servidor

`requireUser`, `requireGlobalRole`, `requireSchoolMembership`, `requireClassAssignment` retornam
principal mínimo ou erro tipado. `requestAdultReset(email)` é neutro; `consumeReset(token,newPassword)`
é uso único; `resetStudent(studentId,newPassword)` exige SEMED/coordenador da escola. Tokens aleatórios
somente em trânsito, hash no banco, expiração e sessionVersion incrementada.

## Segurança, burla, concorrência e UI

Negar papel/client IDs forjados, vínculo encerrado, token repetido/expirado, coordenador externo e
desenvolvedor tentando dados pedagógicos. Consumo concorrente permite um vencedor. Páginas explicam
sucesso genérico e nunca expõem existência da conta. Link de e-mail é capturado por fake test-only.

## Testes/aceite/entrega

Integração direta de cada guard, corridas do token, sessão antiga revogada; Playwright reset adulto e
assistido, acesso direto negado. Gates. Aceite: qualquer feature seguinte usa esses serviços, sem
copiar `if role`. Relatório FM-005; bloquear envio real até provedor aprovado, sem bloquear adapter.

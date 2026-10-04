# FM-027 — Prontidão e execução controlada do piloto

**Ordem/fase:** 27/Piloto | **Branch:** `task/FM-027-pilot-readiness` | **Situação:** planejada

## Objetivo/pré-condições

Com FM-026 integrada e todas OD altas resolvidas, validar capacidade, operação, conteúdo, privacidade,
dispositivos e aceites humano/pedagógico para recomendar ou não o piloto. Não publicar/usar dados reais
sem autorização separada.

## Plano

Inventário de escolas/alunos/simultaneidade, carga com dados sintéticos, p95/erro e limites; rehearsal
de migration+restore; smoke de todos os perfis; amostra 320/390/desktop e browsers; revisão de
conteúdo/dificuldade/feedback/áudio por pedagógico; revisão de acessibilidade e política municipal.
Definir RPO/RTO, suporte, comunicação, critérios de pausa/rollback e coleta mínima.

## Segurança/evidência

Ambiente piloto explicitamente identificado e separado; contas sintéticas antes das reais; least
privilege, secrets e logs auditados. Carga não usa produção sem plano/autorização. Resultados técnicos,
pedagógicos e humanos são seções distintas; “build verde” não prova validação pedagógica.

## Testes

Executar carga sintética, smoke E2E por perfil, regressão cross-browser, restauração, acessibilidade e
reconciliação de dados. Registrar amostra, comandos, ambiente e resultado; teste omitido vira bloqueio.

## Aceite/entrega

Checklist com cada gate aprovado, bloqueado ou não executado; nenhuma lacuna vira aprovação. Relatório
FM-027 inclui capacidade medida, restore, dispositivos, sign-offs, risco residual e decisão go/no-go.
Commit/push/PR; deploy do piloto ocorre apenas por autorização operacional posterior e registra SHA/
migrations/smoke reais.

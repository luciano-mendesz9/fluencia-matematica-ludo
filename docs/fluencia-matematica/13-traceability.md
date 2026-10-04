# Rastreabilidade

| Requisito PRD | Regras | Documento | Tarefas | Validação servidor | Teste/evidência |
| --- | --- | --- | --- | --- | --- |
| identidade/perfis | BR-001/003 | 03,07 | FM-004–006 | sessão/papel/vínculo | AUTH/SCOPE + relatório E2E |
| escolas/cadastros | BR-002–004 | 02,07 | FM-006–009 | recurso escopado/duplicidade | integração + Playwright |
| questões/versionamento | BR-005–007 | 02,04 | FM-010–012 | ownership/versão/DTO sem gabarito | Q-01–06 + traces |
| áudio/mídia | BR-005/019 | 03,08 | FM-011 | MIME/escopo/ordem | AUDIO-01 + revisão |
| atividades/meta | BR-008–010/018 | 04,07 | FM-013–015 | cobertura/estado/transação | ACT-01–04 |
| Ludo | BR-011–014 | 05 | FM-016–018,020 | turno/revisão/movimento | LUDO-01–13 + corrida |
| pontos/vitória | BR-015/016 | 05 | FM-019 | unique/transação | PTS-01–05 + ledger |
| ranking | BR-017 | 06 | FM-021 | turma/mês servidor | RANK-01–04 |
| analytics/feedback | BR-019/020 | 06 | FM-022 | consulta escopada/contexto | DATA-01–04 + reconciliação |
| auditoria/operação | BR-022 | 03,11 | FM-023,026 | allowlist/log redigido | SCOPE-06 + inspeção |
| exportações | BR-021 | 06,07 | FM-024 | mesmos filtros/neutralização | EXPORT-01/02 |
| responsividade/acessibilidade | transversal | 08,09 | FM-002 e toda UI; FM-025 | DTO + estados | 320/390/desktop, axe, 3 engines |
| piloto/operação | transversal | 10,11 | FM-026–027 | ambiente explícito | restore/carga/runbook/aceite humano |

Cobertura detalhada fica nos critérios de cada tarefa. A verificação documental confere: IDs únicos,
dependências acíclicas, links, fórmula única 10/7/4/1, bônus 30, ausência de offline/importação e
nenhuma tarefa de UI sem serviço real correspondente.

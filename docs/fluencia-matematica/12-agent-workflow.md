# Protocolo diário do agente

Ao receber **“Desenvolva a tarefa FM-XXX”**:

1. Abra [INDEX](tasks/INDEX.md), a especificação e seus links; leia tentativas anteriores.
2. Inspecione instruções, status/diff, branch/worktrees, remotos e dependências; preserve trabalho.
3. Confirme no código/branch base que dependências estão integradas. Rótulo/relatório não prova isso.
4. Atualize referências com segurança; crie ou reutilize a branch exata, sem reset/recomeço.
5. Se uma dependência faltar, documente o bloqueio e passo concreto; não implemente-a escondido.
6. Implemente só o escopo, fluxo completo e autorização no servidor. Decisão técnica rotineira pode
   ser tomada e justificada; decisão de negócio pendente respeita [14](14-open-decisions.md).
7. Execute testes proporcionais: unidade, PostgreSQL, requisição hostil, Playwright e inspeção visual.
8. Corrija falhas da tarefa. Se houver bloqueio/limite, preserve checkpoint e não declare conclusão.
9. Crie `reports/FM-XXX/YYYY-MM-DD-attempt-NN.md` pelo template, mesmo em falha.
10. Atualize estado sem confundir implementada/verificada/publicada/integrada; faça commits focados,
    push/PR quando possível e autorizado, nunca force push/merge automático.
11. Encerre com tarefa, branch, entrega, testes reais, relatório, PR e pendências.

## Estados

`planejada`: especificada; `pronta`: decisões/dependências integradas; `em andamento`: há execução;
`bloqueada`: condição externa concreta; `implementada`: código completo ainda sem todos os gates;
`verificada`: gates aplicáveis passaram; `publicada`: branch remota/PR; `integrada`: commit presente
na base. Só `integrada` libera dependente, salvo base explicitamente encadeada.

## Regra de escopo

Não stashear, descartar, resetar, rebasear, migrar banco compartilhado, publicar ou mesclar fora da
autorização. Não imprimir URLs/segredos. Uma tela bonita sem persistência/serviço real não conclui
funcionalidade. Falta de browser/banco é bloqueio explícito, nunca aprovação implícita.

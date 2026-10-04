# Execução das tarefas FM

O [índice](INDEX.md) é o mapa; cada arquivo é contrato de uma sessão razoável. Para executar, siga
[12-agent-workflow](../12-agent-workflow.md). Branch vazia não é criada antecipadamente. Uma tarefa
só fica `pronta` quando dependências estão integradas na base e decisões bloqueadoras fechadas.

Toda tarefa: preserva alterações; usa branch indicada; implementa persistência/serviço/UI do seu
recorte; aplica autorização no servidor; testa positivo, negativo, burla e concorrência aplicáveis;
produz relatório; distingue commit, push, PR e merge. Comandos exatos podem evoluir quando a tarefa
de bootstrap os criar, mas o relatório usa os scripts reais do lockfile vigente.

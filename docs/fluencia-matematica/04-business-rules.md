# Regras de negócio rastreáveis

Status: **D** decisão, **I** interpretação, **P** proposta. Todas são aplicadas em serviços no
servidor e testadas; propostas que bloqueiam tarefas aparecem em [decisões abertas](14-open-decisions.md).

| ID | Regra, origem e invariantes | Serviço/tarefa | Cenários essenciais |
| --- | --- | --- | --- |
| BR-001 D | aluno usa código individual+senha; adulto e-mail+senha; conta deve estar ativa | auth / FM-004 | credencial válida, inválida, bloqueada, rate limit |
| BR-002 D/P | professor pode ter várias escolas; escolha local por usuário só vale se vínculo atual | context / FM-006 | primeira escolha, retorno, vínculo revogado, outra conta |
| BR-003 P | papéis e vínculos limitam escola/turma; contexto UI nunca eleva autoridade | policies / FM-005–009 | URL/ID alterado e revogação concorrente |
| BR-004 D | cadastro é individual; sem importação no MVP | admin / FM-007–009 | duplicidade e validação semântica |
| BR-005 D/P | questão tem série 1–5, dificuldade 1–6, tema, tipo e versão imutável após uso | questions / FM-010 | edição cria versão; histórico preserva original |
| BR-006 D | questão privada só para autor; envio à SEMED não altera original | sharing / FM-012 | acesso externo negado; aprovação cria cópia rastreável |
| BR-007 P | alternativa usa ID, não posição; numérica aceita vírgula/ponto conforme política explícita | correction / FM-011 | ordem embaralhada, limites e formatos inválidos |
| BR-008 D/P | atividade fixa versões, meta positiva e exige cobertura 1–6 antes de abrir | activity / FM-013 | cobertura faltante bloqueia, edição pós-abertura não retroage |
| BR-009 I/P | meta conta acertos+erros aceitos; retry não conta; progresso acumula; prática extra pontua | participation / FM-014 | 12+8=20, reenvio, nova partida |
| BR-010 P | fechar impede novas ações; operação já ordenada antes permanece consistente | activity/game / FM-015,020 | corrida fechamento-resposta |
| BR-011 D | jogo apenas em atividade, aluno x máquina, quatro pinos, online | game / FM-016–020 | sem jogo livre/offline |
| BR-012 D/I | antes da primeira saída: alternância, sem questão; primeiro 6 libera sem ponto | game / FM-017 | dado 1–5 e primeiro 6 |
| BR-013 D | sem movimento: sem questão e passa turno; erro mantém máquina aguardando e restringe 1–4 | game / FM-017–018 | nenhum movimento, múltiplos erros |
| BR-014 D | acerto permite movimento; 6 movimentado dá novo desafio; captura fora de segura volta à base | game / FM-018 | movimento legal/ilegal, casa segura |
| BR-015 D/I | prêmio=`max(1,10-3×erros)`; erro não reduz saldo; dificuldade não multiplica | points / FM-019 | 0/1/2/3/10 erros, retry |
| BR-016 D/P | vitória soma 30 uma única vez, evento distinto do acerto | points / FM-019 | movimento final concorrente/reload |
| BR-017 D/P | ranking agrega eventos do mês civil por turma; não apaga dados nem mostra meses anteriores | ranking / FM-021 | virada, empate 1/1/3, transferência |
| BR-018 D | atingir meta não encerra partida/pontos | activity/game / FM-014,019 | prática adicional |
| BR-019 P | respostas preservam contexto original e repetição; áudio não penaliza | analytics / FM-022 | versão editada, repetida, áudio |
| BR-020 P | feedback exige evidência e não vira diagnóstico; abaixo do limiar = dados insuficientes | feedback / FM-022 | <5 distintas, habilidade divergente |
| BR-021 D/P | PDF/XLSX usam os mesmos filtros/definições e escopo; planilha neutraliza fórmulas | export / FM-024 | nome `=...`, filtro e escola externa |
| BR-022 P | auditoria preserva mutações administrativas; desenvolvedor não lê dado pedagógico individual | audit / FM-023 | alteração, tentativa proibida |

Detalhes de pré-condição/estado de BR-012–018 estão em [Ludo](05-ludo-and-points.md); contratos de
ator/rota em [fluxos](07-routes-and-user-flows.md). Aceite positivo, negativo e concorrente de cada
regra aparece nas tarefas indicadas e na [matriz](13-traceability.md).

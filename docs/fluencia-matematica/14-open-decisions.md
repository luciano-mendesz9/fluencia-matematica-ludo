# Decisões abertas

| ID/prioridade | Decisão e alternativas | Bloqueia | Responsável/evidência |
| --- | --- | --- | --- |
| OD-001 confirmada | erro reduz prêmio futuro, nunca o saldo acumulado | FM-019 | responsável do produto, 10/10/2026 |
| OD-002 confirmada | chegada exata; sem extra da máquina no 6; convivência própria; contador preservado ao voltar à base | FM-018–020 | responsável do produto, 10/10/2026 |
| OD-003 parcial | matriz curricular série/habilidade/dificuldade e limiares | FM-010,013,022,027 | equipe pedagógica |
| OD-004 alta | política municipal de privacidade, retenção, exclusão e grupos pequenos | FM-023,024,027 | município/jurídico |
| OD-005 alta | provedores de e-mail, TTS e mídia/custos/SLA | FM-005,011,026 | produto/infra |
| OD-006 confirmada | respostas aceitas certas e erradas contam na meta; progresso acumula entre partidas | FM-014 | responsável do produto, 09/10/2026 |
| OD-007 confirmada | fuso America/Fortaleza, empate 1/1/3 e transferência sem reatribuição | FM-021 | responsável do produto, 10/10/2026 |
| OD-008 média | campos exatos PDF/XLSX e formatos | FM-024 | usuários/pedagógico |
| OD-009 média | tamanho da rede, simultaneidade, RPO/RTO | FM-026–027 | município/infra |
| OD-010 parcial | ranking exibe nome e sobrenome completos; validação visual e dispositivos do piloto pendentes | FM-002,021,025,027 | responsável do produto, 10/10/2026 |

Decisões confirmadas viram ADR ou atualização identificada deste arquivo, com data/autor. Tarefas não
afetadas prosseguem; tarefa bloqueada não substitui requisito por suposição silenciosa.

## OD-003 — decisão mínima para o banco de questões

Decisão confirmada pelo responsável do produto em 08/10/2026 para FM-010 e FM-013:

- um tema, como Álgebra, pode ser utilizado em qualquer série; a taxonomia não restringe previamente tema ou habilidade por série;
- cada versão de questão declara sua série e recebe do autor uma dificuldade inteira de 1 a 6;
- a dificuldade é uma avaliação contextual dentro do conteúdo e da série informados, não uma escala comparável globalmente entre séries;
- habilidade é um detalhamento opcional do tema e, quando informada, deve pertencer ao tema selecionado.

Permanece aberta para FM-022 e FM-027 a definição pedagógica dos limiares de domínio, agregações e comparações analíticas. Esta decisão parcial não constitui validação científica desses limiares.

## OD-004 — retenção e exclusão

A FM-023 registrou o ponto de extensão técnico, mas não tomou uma decisão municipal em 11/10/2026:

- eventos de auditoria e logs operacionais não têm exclusão automática;
- a remoção de uma conta pode apenas anonimizar a referência opcional do ator, sem alterar ação,
  alvo, escola, correlação, estados ou data do evento;
- qualquer janela de retenção ou rotina de expurgo depende de política explícita do município/jurídico.

Assim, retenção continua aberta para FM-024 e FM-027; a ausência da decisão opera de forma
fail-closed, sem apagar evidências silenciosamente.

## OD-006 — meta e feedback ao professor

Decisão confirmada pelo responsável do produto em 09/10/2026 para FM-014:

- toda resposta aceita avança a meta, esteja certa ou errada;
- a mesma resposta/desafio repetido não avança novamente;
- o progresso persiste e acumula entre partidas;
- respostas após a meta são registradas separadamente como prática adicional;
- totais de respostas certas e erradas permanecem separados para apoiar o feedback do professor.

Lançamento, áudio, abandono e demais ações sem resposta aceita não avançam a meta.

## OD-001 — efeito do erro na pontuação

Decisão confirmada pelo responsável do produto em 10/10/2026:

- o erro reduz apenas o prêmio do próximo acerto na mesma sequência;
- a progressão é 10, 7, 4 e mínimo de 1 ponto a partir de três erros;
- nenhum erro debita pontos já acumulados pelo aluno.

## OD-002 — regras complementares do Ludo

Decisão confirmada pelo responsável do produto em 10/10/2026:

- a chegada exige valor exato;
- a máquina não recebe lançamento extra ao tirar 6;
- pinos próprios podem compartilhar a mesma casa;
- quando todos os pinos jogáveis voltam à base, o contador de erros da sequência é preservado.

## OD-007 — ranking mensal

Decisão confirmada pelo responsável do produto em 10/10/2026:

- o mês civil usa o fuso `America/Fortaleza`;
- empates usam classificação competitiva, como 1/1/3;
- uma transferência não reatribui eventos de pontos já registrados: cada evento permanece na turma histórica gravada em `classId`.

Não há reset, exclusão ou snapshot mensal. A consulta do mês atual deriva diretamente dos eventos.

## OD-010 — nome no ranking

Decisão parcial confirmada pelo responsável do produto em 10/10/2026 para a FM-021:

- o ranking exibe o nome e o sobrenome completos armazenados no cadastro do aluno;
- e-mail, código individual, identificadores técnicos e dados de erros não fazem parte do DTO do ranking.

Permanecem abertas para FM-025 e FM-027 a validação visual e a lista final de dispositivos do piloto.

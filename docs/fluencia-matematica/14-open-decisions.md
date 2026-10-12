# Decisões abertas

| ID/prioridade | Decisão e alternativas | Bloqueia | Responsável/evidência |
| --- | --- | --- | --- |
| OD-001 confirmada | erro reduz prêmio futuro, nunca o saldo acumulado | FM-019 | responsável do produto, 10/10/2026 |
| OD-002 confirmada | chegada exata; sem extra da máquina no 6; convivência própria; contador preservado ao voltar à base | FM-018–020 | responsável do produto, 10/10/2026 |
| OD-003 confirmada para o piloto | 5 questões distintas; abaixo de 50% sugere retomada; relatórios individuais autorizados no escopo | FM-022,027 | responsável do produto, 12/10/2026; validação pedagógica no piloto |
| OD-004 confirmada para o piloto | retenção por categoria, logs de erro por 6 meses e supressão de grupos menores que 5 | FM-026–027 | responsável do produto, 12/10/2026; validação municipal/jurídica antes de expurgo |
| OD-005 confirmada para o piloto | Nodemailer com Gmail/senha de app; áudio e imagens fora desta etapa | FM-005,011,026 | responsável do produto, 12/10/2026 |
| OD-006 confirmada | respostas aceitas certas e erradas contam na meta; progresso acumula entre partidas | FM-014 | responsável do produto, 09/10/2026 |
| OD-007 confirmada | fuso America/Fortaleza, empate 1/1/3 e transferência sem reatribuição | FM-021 | responsável do produto, 10/10/2026 |
| OD-008 confirmada | PDF com filtros/resumo/cobertura/alunos autorizados; XLSX Resumo/Cobertura/Alunos/Definições | FM-024 | responsável do produto, 11/10/2026 |
| OD-009 confirmada para o piloto | até 2 escolas/300 alunos/100 simultâneos; carga 2x; RPO 1 h e RTO 4 h | FM-026–027 | responsável do produto, 12/10/2026 |
| OD-010 confirmada para o piloto | ranking com nome completo e matriz real de dispositivos/acessibilidade | FM-002,021,025,027 | responsável do produto, 12/10/2026 |

Decisões confirmadas viram ADR ou atualização identificada deste arquivo, com data/autor. Tarefas não
afetadas prosseguem; tarefa bloqueada não substitui requisito por suposição silenciosa.

## OD-003 — decisão mínima para o banco de questões

Decisão confirmada pelo responsável do produto em 08/10/2026 para FM-010 e FM-013:

- um tema, como Álgebra, pode ser utilizado em qualquer série; a taxonomia não restringe previamente tema ou habilidade por série;
- cada versão de questão declara sua série e recebe do autor uma dificuldade inteira de 1 a 6;
- a dificuldade é uma avaliação contextual dentro do conteúdo e da série informados, não uma escala comparável globalmente entre séries;
- habilidade é um detalhamento opcional do tema e, quando informada, deve pertencer ao tema selecionado.

Decisão confirmada pelo responsável do produto em 12/10/2026 para o piloto:

- a unidade do feedback é aluno + habilidade, ou tema quando a questão não declarar habilidade, + dificuldade;
- o recorte exige ao menos 5 versões de questão distintas; abaixo disso, mostrar “Dados insuficientes”;
- com amostra suficiente e precisão abaixo de 50%, mostrar “Sugestão de retomada”;
- com precisão igual ou superior a 50%, mostrar somente observação descritiva, sem declarar domínio;
- respostas repetidas entram na precisão, aparecem separadamente e não aumentam a amostra distinta;
- não usar “domina”, “não domina”, “aprovado” ou diagnóstico, nem comparar publicamente alunos,
  turmas, escolas ou séries pela precisão;
- toda observação informa acertos, respostas, questões distintas, repetições e período analisado;
- professor e coordenador podem abrir relatórios individuais somente dos alunos do próprio escopo
  autorizado; a SEMED mantém visão municipal agregada, conforme OD-004;
- 5 questões distintas e 50% são parâmetros iniciais do piloto, sujeitos a revisão documentada pela
  equipe pedagógica, sem alteração retroativa das evidências históricas.

A decisão libera a configuração dos limiares na aplicação. A validação pedagógica humana durante o
piloto continua sendo um gate da FM-027 e não equivale a validação científica.

## OD-004 — retenção e exclusão

A FM-023 registrou o ponto de extensão técnico, mas não tomou uma decisão municipal em 11/10/2026:

- eventos de auditoria e logs operacionais não têm exclusão automática;
- a remoção de uma conta pode apenas anonimizar a referência opcional do ator, sem alterar ação,
  alvo, escola, correlação, estados ou data do evento;
- qualquer janela de retenção ou rotina de expurgo depende de política explícita do município/jurídico.

Para a FM-024, o responsável do produto confirmou em 11/10/2026:

- não há expurgo automático enquanto não existir política municipal;
- SEMED exporta somente dados agregados, sem nomes de alunos;
- professor e coordenador exportam alunos identificados apenas nas escolas/turmas autorizadas;
- senha, hash, token, código de acesso e histórico de ranking nunca entram no relatório.

A política aprovada pelo responsável do produto em 12/10/2026 para o piloto é:

- respostas, progresso, pontos e histórico pedagógico: 5 anos após o encerramento do ano letivo;
- auditoria administrativa e de segurança: 5 anos;
- logs técnicos comuns: 90 dias;
- logs técnicos de erro ou incidente: 6 meses;
- exclusão encerra acesso e vínculos antes de qualquer anonimização; dados pessoais somente podem ser
  anonimizados quando não houver obrigação vigente de conservação;
- professor e coordenador veem alunos identificados apenas no escopo autorizado; a SEMED vê dados
  municipais agregados;
- agregações municipais com menos de 5 alunos exibem “grupo pequeno” e suprimem contagens,
  percentuais e detalhamento que permitam reidentificação;
- nenhum expurgo automático será ativado antes da validação municipal/jurídica e de um ensaio em
  ambiente isolado. A ausência dessa validação permanece fail-closed, sem apagar evidências.

## OD-005 — e-mail, áudio e mídia no piloto

Decisão confirmada pelo responsável do produto em 12/10/2026:

- o envio de e-mail usa Nodemailer por SMTP do Gmail com uma conta dedicada e senha de app;
- a conta deve ter verificação em duas etapas; a senha de app fica somente em secret do ambiente,
  nunca no código, banco, log, relatório ou repositório;
- Gmail gratuito é solução provisória, sem SLA contratual assumido pela plataforma; limites,
  bloqueios, rejeições e revogação da senha de app devem gerar alerta operacional;
- os limites vigentes do Gmail devem ser monitorados; bloqueio, rejeição ou aproximação do limite
  configurado para a operação gera alerta, sem presumir capacidade ou disponibilidade contratual;
- falha no e-mail não revela se a conta existe e preserva a redefinição assistida autorizada;
- áudio, TTS e imagens ficam fora desta etapa do piloto, inclusive sem contratar provedor externo;
- a remoção ou desativação das experiências atuais de áudio/imagem exige tarefa de implementação e
  teste próprios; esta decisão não declara que o código já foi alterado.

Essa escolha substitui, para o piloto, a proposta anterior de contratar provedores externos de TTS e
mídia. Uma expansão além do volume do piloto exige reavaliar provedor, custo, entregabilidade e SLA.

## OD-009 — capacidade, continuidade e recuperação

Decisão confirmada pelo responsável do produto em 12/10/2026 para o piloto:

- capacidade de referência: até 2 escolas, 10 turmas, 300 alunos e 30 adultos;
- pico esperado de 100 usuários simultâneos; o ensaio de carga deve validar 200 simultâneos;
- metas sob a carga aprovada: p95 de leitura abaixo de 1 s, p95 de gravação abaixo de 1,5 s e taxa de
  erro abaixo de 1%;
- RPO de 1 hora e RTO de 4 horas;
- migration e restauração devem ser ensaiadas em destino isolado, com reconciliação de amostra, antes
  do go/no-go;
- expansão da rede exige inventário real e novo teste, sem extrapolar silenciosamente o piloto.

## OD-008 — formato das exportações

Decisão confirmada pelo responsável do produto em 11/10/2026 para a FM-024:

- PDF inclui título, filtros, data/hora, resumo com numeradores e denominadores, cobertura por
  habilidade/dificuldade, resultados individuais quando o papel permitir, definições e notas;
- XLSX contém as abas `Resumo`, `Cobertura`, `Alunos` e `Definições`, preservando números e datas;
- a aba `Alunos` informa a restrição de privacidade no escopo municipal agregado;
- qualquer texto iniciado por `=`, `+`, `-` ou `@`, inclusive após espaços ou controles iniciais,
  é prefixado para não ser interpretado como fórmula;
- pontos aparecem como dimensão separada da precisão e usam o mesmo recorte autorizado.

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

Decisão complementar confirmada pelo responsável do produto em 12/10/2026 para o piloto:

- Android Chrome em aparelho intermediário ou de baixo desempenho, largura de 360 px;
- iPhone Safari, largura aproximada de 390 px;
- Chromebook Chrome e Windows Chrome/Edge em 1366×768; Firefox desktop complementar;
- versão estável atual e anterior dos navegadores principais, Wi-Fi escolar e conexão móvel limitada;
- zoom de 200%, texto ampliado, teclado, TalkBack no Android, NVDA no Windows e VoiceOver no iPhone
  quando houver dispositivo disponível;
- validação humana de login, seleção de escola, atividade, jogo, feedback, ranking e exportação;
- nenhuma violação automática crítica/alta; falha que impeça login, resposta, jogo ou leitura do
  feedback bloqueia o piloto.

A automação técnica da FM-025 permanece válida, mas não substitui a assinatura humana dessa matriz na
FM-027.

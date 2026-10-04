# PRD — Fluência Matemática

**Versão:** 0.1 — consolidação para revisão e planejamento de implementação  
**Data:** 04/10/2026  
**Contexto:** plataforma educacional municipal para os anos iniciais  
**Stack confirmada:** Next.js e Prisma ORM  
**Execução prevista:** Codex ou outro agente de desenvolvimento, como Claude Code ou Copilot, com revisão humana.

## 1. Como interpretar este documento

Este PRD reúne decisões tomadas durante a elaboração do projeto e propostas complementares necessárias para torná-lo implementável. Não é um registro de funcionalidades já desenvolvidas.

- **[D] Decisão confirmada:** requisito expressamente escolhido pelo responsável pelo projeto.
- **[I] Interpretação:** significado operacional adotado a partir de uma decisão, indicado para revisão quando houver ambiguidade.
- **[P] Proposta:** recomendação que ainda não foi expressamente confirmada. Não deve ser apresentada como escolha definitiva do responsável.

Os agentes devem preservar essa distinção. Um PRD não substitui o plano técnico, as decisões de arquitetura ou a validação pedagógica. Questões classificadas como propostas podem ser detalhadas no planejamento, mas não devem ser silenciosamente promovidas a decisões confirmadas.

## 2. Problema e visão do produto

Professores precisam identificar quais habilidades matemáticas seus alunos estão praticando, onde ocorrem dificuldades e quais conteúdos merecem retomada. Os alunos precisam de oportunidades frequentes de prática com feedback compreensível.

**[D]** A Fluência Matemática será uma plataforma gamificada para alunos e professores do 1º ao 5º ano. O aluno pratica matemática enquanto joga. As interações produzem dados para acompanhamento coletivo e individual.

**[D]** O primeiro minigame será uma adaptação do Ludo, com um aluno contra a máquina. O projeto poderá receber outros minigames futuramente, mas eles não integram o MVP.

**[P]** O adversário será um motor de regras programadas. IA generativa não será necessária para realizar suas jogadas. O uso de agentes de IA no desenvolvimento não implica uso de IA generativa no produto.

## 3. Objetivos e critérios de avaliação do produto

### 3.1 Objetivos

1. **[D]** Oferecer prática matemática em atividades disponibilizadas pelo professor.
2. **[D]** Relacionar cada questão à série, dificuldade e tema.
3. **[D]** Apresentar feedback ao aluno após erros.
4. **[D]** Manter uma competição por pontos entre alunos da mesma turma.
5. **[D]** Produzir feedbacks úteis sobre a turma e cada aluno.
6. **[D]** Operar em computadores e celulares com conexão à internet.
7. **[P]** Permitir administração municipal com isolamento dos dados entre escolas e turmas.

### 3.2 Indicadores de adoção e funcionamento — [P]

| Indicador | Definição |
| --- | --- |
| Participação | Alunos com ao menos uma resposta aceita / alunos destinatários da atividade |
| Cumprimento da meta | Alunos que atingiram a meta / alunos destinatários |
| Prática adicional | Respostas aceitas depois de atingir a meta |
| Uso pelos professores | Professores que disponibilizaram atividades no período |
| Disponibilidade de conteúdo | Habilidades e dificuldades com questões utilizáveis por série |
| Confiabilidade | Erros em respostas, movimentações, pontuação, áudio e exportação |

Metas numéricas de adesão e capacidade serão definidas após conhecer o tamanho da rede e realizar um piloto. O PRD não promete melhoria pedagógica apenas pela quantidade de pontos ou vitórias.

## 4. Escopo do MVP

### 4.1 Incluído — [D]

- Ludo de dois jogadores: aluno e máquina, quatro pinos por jogador.
- Captura de pinos e casas seguras.
- Seis cartas de dificuldade, de 1 a 6, relativas à série do aluno.
- Questões de alternativas e de resposta numérica.
- Leitura em áudio do enunciado e das alternativas, acionada por botão.
- Alunos autenticados com código individual e senha, sem exigência de e-mail.
- Atividades disponibilizadas pelo professor; sem jogo livre independente.
- Meta de questões respondidas para cumprimento de cada atividade.
- Prática adicional com pontuação após atingir a meta.
- Ranking mensal da turma, sem histórico de classificações.
- Cadastro individual de escolas e usuários.
- Questões da SEMED e questões particulares dos professores.
- Envio de questões particulares à SEMED para compartilhamento.
- Painéis e exportações em PDF e planilha.
- Professor com uma conta vinculada a diferentes escolas e turmas.
- Seleção de escola e retorno à última escola acessada.

### 4.2 Complementos propostos — [P]

- Salvamento e retomada de partidas.
- Recuperação de acesso de adultos e redefinição assistida da senha do aluno.
- Gestão de ano letivo, turmas, matrículas e vínculos.
- Revisão e publicação de questões enviadas à SEMED.
- Registro de versões de questões, eventos de pontos e alterações administrativas.
- Indicadores de escola e da rede, além dos resultados das turmas.

### 4.3 Fora da primeira versão

- **[D]** Partidas offline e sincronização offline: requisito cancelado durante a elaboração.
- **[D]** Importação de cadastros por planilha: primeira versão terá somente cadastro individual.
- **[D]** Outros minigames e partidas entre alunos.
- **[D]** Histórico de rankings mensais.
- **[D]** Jogo livre fora das atividades do professor.
- **[P]** Chat, rede social, aplicativo nativo, geração automática de questões e feedbacks por IA generativa.
- **[P]** Cobrança, integração com sistemas externos de matrícula e edição manual livre de pontos.

## 5. Perfis, vínculos e permissões

### 5.1 Matriz de acesso

| Perfil | Decisões confirmadas [D] | Complementos propostos [P] |
| --- | --- | --- |
| Administrador da SEMED | Cadastrar e gerenciar escolas, coordenadores, professores, alunos e desenvolvedores | Gerenciar o banco da rede, analisar envios e consultar indicadores municipais |
| Coordenador | Pertencer a uma escola; cadastrar e gerenciar professores e alunos dessa escola | Gerenciar turmas e matrículas; acompanhar resultados da escola |
| Professor | Responsável por uma ou mais turmas; consultar desempenho; criar questões e disponibilizar atividades; ter vínculos com diferentes escolas | Consultar e exportar respostas e feedbacks das próprias turmas |
| Aluno | Participar das atividades, jogar e responder; competir no ranking da turma | Consultar seu progresso e resultados simplificados |
| Desenvolvedor | Realizar operações técnicas não críticas e consultar logs | Consultar erros, saúde das integrações, versão da aplicação e indicadores técnicos sem dados pedagógicos individuais |

### 5.2 Requisitos de autorização — [P]

- O administrador tem escopo municipal; coordenador tem escopo de sua escola; professor tem escopo de seus vínculos e turmas; aluno tem escopo de seus próprios dados e do ranking permitido.
- Uma escola escolhida na interface não concede acesso a ela.
- Verificar usuário ativo, papel e vínculo no servidor em cada operação protegida, incluindo exportações e reprodução de recursos privados.
- Coordenador não concede papéis de administrador ou desenvolvedor nem gerencia vínculos de outras escolas.
- Desenvolvedor não pode promover contas, alterar respostas, editar pontos ou acessar automaticamente dados pedagógicos individuais.
- O responsável pelo professor em uma escola não deve conseguir bloquear sua conta global e interromper o acesso a outras escolas. Pode suspender o vínculo local; bloqueio global fica com a SEMED.
- Um professor já existente deve ser vinculado à escola, evitando duplicação de contas. A resolução da identidade não deve expor dados de outras escolas ao coordenador.
- Bloqueios preservam o histórico pedagógico. Exclusão definitiva e retenção de dados exigem política específica antes da operação municipal.
- Mudanças administrativas relevantes devem registrar autor, data, escopo, ação e resultado, sem registrar senhas ou tokens.

### 5.3 Identidade e acesso

- **[D]** Aluno: código individual e senha; sem e-mail obrigatório.
- **[P]** Adultos: e-mail único e senha, sem cadastro público.
- **[P]** Código do aluno único na plataforma, gerado pelo sistema, estável nas mudanças de turma.
- **[P]** Aluno recupera acesso por redefinição feita pela SEMED ou por coordenador autorizado da sua escola; não haverá envio de recuperação a um e-mail inexistente.
- **[P]** Adultos recuperam senha por link temporário de uso único. Provedor de envio ainda não escolhido.
- **[P]** Senhas armazenadas somente como hash adequado; sessão em cookie protegido; limitação de tentativas de autenticação e redefinição.
- **[P]** Mudança de senha, bloqueio e revogação de vínculo devem ter comportamento de sessão documentado e testado.

### 5.4 Seleção de escola do professor — [D], com detalhes [P]

1. Após login sem preferência válida, apresentar a tela de escolas vinculadas ao professor.
2. Ao selecionar, abrir o contexto daquela escola e salvar a preferência no armazenamento local.
3. Nos próximos logins, entrar diretamente na última escola válida.
4. Permitir trocar de escola a qualquer momento pelo seletor.
5. **[P]** Associar a chave local ao usuário, evitando herdar a seleção de outra conta no mesmo navegador.
6. **[P]** Validar o vínculo atual no servidor antes de usar a preferência. Preferência inválida retorna à seleção.
7. **[P]** A preferência é por navegador/dispositivo, sem sincronização obrigatória entre aparelhos.
8. **[P]** Ao trocar de escola, limpar filtros e seleção de turma incompatíveis, sem misturar dados em cache.

## 6. Estrutura escolar e cadastros — [P]

| Entidade | Dados mínimos propostos |
| --- | --- |
| Escola | Nome, identificador, situação |
| Ano letivo | Ano e situação |
| Turma | Escola, ano letivo, série de 1 a 5, identificação, situação |
| Conta de aluno | Nome, código, hash de senha, situação |
| Matrícula | Aluno, turma, início, fim e situação |
| Conta de adulto | Nome, e-mail, hash de senha, situação e papéis |
| Vínculo escolar | Usuário, escola, papel local e situação |
| Vínculo docente | Professor, turma, período e situação |

O cadastro será individual, com validação de duplicidades e mensagens claras. Não coletar endereço, documentos ou outros dados sem finalidade definida.

**[P]** Cada aluno terá uma matrícula ativa principal no MVP. Mudanças de turma devem preservar a turma e a série existentes no momento de cada resposta. A regra de permanência de pontos após transferência está na seção 11 e deve ser validada antes da implementação dessa operação.

## 7. Banco de questões

### 7.1 Campos e publicação

| Campo | Status | Finalidade |
| --- | --- | --- |
| Série de 1 a 5 | [D] | Adequação ao aluno |
| Dificuldade de 1 a 6 | [D] | Seleção pela carta/dado |
| Tema | [D] | Organização pedagógica |
| Habilidade específica | [P] | Feedback mais preciso que o tema amplo |
| Enunciado | [D] | Apresentação do desafio |
| Tipo de resposta | [D] | Alternativas ou numérica |
| Gabarito | [D] | Correção automática |
| Explicação após erro | [P] | Apoiar a compreensão |
| Imagem e descrição acessível | [P] | Apoio visual quando necessário |
| Recursos de áudio | [D] | Ouvir enunciado e alternativas |
| Autor, origem, versão e situação | [P] | Rastreabilidade e controle de uso |

Temas mencionados na elaboração, como tabuada, álgebra e porcentagem, não devem ser automaticamente disponibilizados para todas as séries. A equipe pedagógica definirá conteúdos e critérios de dificuldade por série e habilidade; este PRD não presume uma matriz curricular já validada.

### 7.2 Propriedade e compartilhamento

- **[D]** SEMED cadastra questões para disponibilização na rede.
- **[D]** Professor utiliza imediatamente as próprias questões, sem aprovação prévia.
- **[D]** Outros professores não acessam suas questões particulares.
- **[D]** O autor pode enviar uma questão à SEMED para compartilhar.
- **[P]** Fluxo de envio: enviada → em análise → aprovada/publicada, ajustes solicitados ou recusada.
- **[P]** Enviar uma versão identificada para análise. Publicar uma cópia sob gestão da SEMED, mantendo a origem e sem alterar o original particular.
- **[P]** Professor pode usar seu banco particular nas escolas em que tem turmas autorizadas.
- **[P]** Editar uma questão cria nova versão; a versão respondida continua associada ao histórico.
- **[P]** Uma atividade publicada fixa as versões selecionadas. Atualizações posteriores não substituem silenciosamente questões em uma partida.

### 7.3 Formatos de resposta — [P]

**Alternativas:** uma alternativa correta por questão no MVP; identificadores estáveis para as opções. Se embaralhar a ordem, gabarito, áudio e resposta devem usar o identificador, não a posição visual.

**Numérica:** cadastrar o valor esperado e os critérios de equivalência. Aceitar vírgula ou ponto decimal quando aplicável; ignorar espaços externos. Não usar avaliação de código, expressões livres ou tolerância numérica implícita. Frações, unidades, números negativos e respostas aproximadas devem ter suporte expressamente definido no plano de conteúdo; não devem ser presumidos como implementados.

Disponibilizar prévia para o autor conferir apresentação, correção e áudio antes de utilizar a questão.

### 7.4 Seleção, repetição e cobertura — [P]

- Selecionar somente questões da série, dificuldade e seleção de conteúdo da atividade.
- Evitar repetir uma mesma versão imediatamente quando houver alternativas disponíveis.
- Prática adicional pode exigir repetição quando o banco se esgotar. Identificar essas exposições e não classificá-las como questões inéditas nos feedbacks.
- Preferir a mesma habilidade durante a recuperação após erro, desde que haja questões da dificuldade sorteada. Se não houver, selecionar outra questão elegível da atividade e registrar a mudança; não afirmar que houve recuperação na habilidade anterior.
- Validar a cobertura das seis dificuldades antes de abrir a atividade. Não substituir silenciosamente uma carta por dificuldade diferente.
- Se uma questão for retirada por problema grave e a cobertura se tornar insuficiente, impedir novos desafios afetados e informar o professor, preservando os registros existentes.

## 8. Atividades do professor

### 8.1 Definições confirmadas — [D]

- O aluno joga somente dentro de uma atividade disponibilizada pelo professor.
- O professor define uma meta de questões respondidas.
- Atingir a meta não exige vencer a partida.
- O aluno pode continuar jogando após a meta e continuar ganhando pontos.

### 8.2 Configuração proposta — [P]

Título, orientação, escola, turma, professor responsável, seleção de questões, meta inteira positiva, situação e disponibilidade.

Para o MVP, propor uma atividade por turma. O professor pode combinar questões da rede e questões próprias. A série é derivada da turma. Publicação requer cobertura válida e áudio utilizável para as questões de alternativas.

Situações: rascunho → aberta → fechada. Rascunhos podem ser editados; após abertura, mudanças de conteúdo ou meta exigem nova atividade ou uma revisão com política explícita. Não alterar retroativamente a meta cumprida ou o gabarito de uma resposta.

### 8.3 Meta e participação — [I/P]

**[I]** Questões respondidas significa contar acertos e erros. Cada novo desafio respondido na sequência de recuperação conta. Reenvio da mesma resposta não conta novamente.

**[P]** Contar apenas respostas aceitas pelo servidor; lançamento sem questão, simples abertura, pedido de áudio e abandono sem resposta não contam.

**[P]** Estados por aluno: não iniciou, em andamento e meta cumprida. Guardar quando a meta foi atingida e quantidade de respostas adicionais.

**[P]** O progresso da meta acumula entre partidas da mesma atividade. O estado da atividade não muda para fechada porque um aluno atingiu a meta.

**[P]** Professor pode fechar manualmente a atividade. Novas respostas recebidas após o fechamento não são aceitas. Uma resposta já confirmada antes dele permanece válida. O servidor deve resolver a disputa entre fechamento e resposta de forma consistente.

## 9. Ludo: experiência e regras

### 9.1 Configuração — [D]

Dois jogadores, quatro pinos por jogador, capturas e casas seguras. A máquina lança o dado e movimenta sem responder matemática. O aluno escolhe entre seus movimentos legais após acertar, conforme detalhamento proposto.

Seis cartas viradas representam as dificuldades de 1 a 6. Revelar a carta do dado e apresentar a questão correspondente. As cartas não são um banco limitado a seis enunciados: **[P]** renovar o conteúdo em novos desafios e voltar à apresentação fechada a cada lançamento.

### 9.2 Saída inicial — [D]

- O aluno precisa tirar 6 para liberar seu primeiro pino.
- Antes dessa saída não há questões para ele.
- Aluno e máquina alternam os lançamentos nessa etapa.
- **[I]** O primeiro 6 libera o pino sem questão.
- **[P]** Como não houve acerto, essa saída sem questão não gera pontos nem jogada extra.

### 9.3 Turno com questões — [D], com ordenação [P]

1. Aluno solicita lançamento; o servidor produz um valor permitido.
2. **[D]** Se nenhum movimento for possível, não apresentar questão e passar o turno à máquina.
3. Se houver movimento, apresentar uma questão da dificuldade sorteada.
4. Receber a resposta e corrigi-la.
5. **[D]** Erro: mostrar a resposta correta, manter a máquina aguardando e permitir nova tentativa com dado de 1 a 4.
6. **[P]** Mostrar também explicação curta, sem substituir o feedback por um rótulo negativo sobre o aluno.
7. **[D]** Acerto: conceder os pontos aplicáveis e permitir movimentar um pino pelo valor desse lançamento.
8. **[D]** Acerto com 6 e movimento: outra jogada do aluno, com nova questão.
9. **[D]** Acerto de 1 a 5 e movimento: a máquina joga.
10. **[P]** Encerrar a sequência de recuperação após o acerto e voltar ao dado completo no próximo lançamento.

**[P]** Não descartar o valor nem a questão para tentar obter outro lançamento. Pausar e retomar mantém o desafio pendente. Escolher o pino não concede uma segunda correção ou um segundo prêmio.

### 9.4 Capturas e retorno à base

- **[D]** Capturar um pino adversário em casa sem proteção o devolve à base.
- **[D]** Casas seguras impedem captura.
- **[P]** Capturas não retiram pontos nem apagam respostas.
- **[D]** Quando todos os pinos jogáveis do aluno estiverem novamente na base, liberar o dado de 1 a 6 e suspender questões até sair um pino.
- **[P]** Pinos que já concluíram o percurso não são considerados pinos presos na base.
- **[P]** Se havia erros acumulados, preservar o contador durante essa etapa. A liberação excepcional do dado não concede um acerto nem reinicia o prêmio. Depois de liberar um pino, retornar à recuperação 1–4 até acertar, quando aplicável.

### 9.5 Regras complementares propostas — [P]

- Usar mapa de percurso determinístico com entradas, casas seguras e chegada documentados em uma especificação do jogo.
- Exigir número exato para concluir o percurso de cada pino.
- Um 6 permite colocar outro pino na entrada ou movimentar um pino existente, se forem movimentos legais. Após a saída inicial, exige questão correta.
- A máquina também sai da base com 6 e recebe jogada extra se tirar 6 e movimentar.
- Na etapa anterior à saída do primeiro pino do aluno, prevalece a alternância dos lançamentos; a proposta de jogada extra da máquina aplica-se depois dessa etapa.
- Não conceder jogada extra por captura ou chegada de pino; não aplicar penalidade especial por três resultados 6 consecutivos.
- Máquina sem movimento passa o turno. Um 6 sem movimento não concede jogada extra a nenhum jogador.
- Não implementar barreiras formadas por dois pinos no MVP. Pinos do mesmo jogador podem compartilhar casas; casas seguras podem conter pinos dos dois jogadores sem captura.
- A estratégia da máquina é determinística: priorizar um pino que chega ao destino, depois captura, depois saída da base, depois avanço; empatar pelo identificador do pino. A política precisa ser testável e substituível.
- Vence quem concluir o percurso dos quatro pinos.
- Derrota não desconta pontos. Após o encerramento, permitir outra partida na mesma atividade aberta.

Esses detalhes complementares precisam de revisão do responsável antes de serem tratados como regras definitivas do Ludo adaptado.

### 9.6 Pausa, retomada e fechamento — [P]

- Manter no máximo uma partida ativa por aluno e atividade. Outra aba ou dispositivo retoma a mesma partida em vez de criar duas versões concorrentes.
- Salvar após transições confirmadas. Reconexão deve recuperar o estado do servidor.
- Ao perder conexão, pausar novas ações. Não lançar, corrigir ou movimentar em modo offline.
- Uma falha depois de aceitar uma ação não deve obrigar o aluno a refazê-la; consultar o resultado por identificador e retomar.
- Fechamento da atividade suspende a partida e impede novos lançamentos, respostas e bônus posteriores. Preservar progresso e pontos confirmados.
- Primeiro lançamento após retomada não reinicia contadores de erro, estado dos pinos ou meta.

## 10. Pontuação: regra vigente

### 10.1 Acertos e erros — [D], com interpretação [I]

**[D]** Acerto normal vale 10 pontos. Cada erro reduz em 3 pontos o prêmio, até um mínimo de 1 ponto. A dificuldade não multiplica a pontuação.

**[I]** O desconto reduz o prêmio do próximo acerto da sequência. Não é uma retirada imediata do saldo já conquistado. Cada erro corresponde a uma resposta incorreta aceita; o contador inclui os diferentes desafios recebidos na sequência de recuperação.

```text
prêmio_do_acerto = máximo(1, 10 − 3 × erros_da_sequência)
```

| Erros antes do acerto | Pontos concedidos no acerto |
| --- | ---: |
| 0 | 10 |
| 1 | 7 |
| 2 | 4 |
| 3 | 1 |
| 4 ou mais | 1 |

- Erro não concede pontos; incrementa o contador e reduz o próximo prêmio.
- **[P]** Acerto encerra a sequência e zera o contador para o próximo desafio normal.
- **[P]** Questão exibida sem resposta ainda não pontua. Resposta correta aceita concede o prêmio uma vez, mesmo se a escolha do pino ocorrer depois.
- Lançamentos sem questão não concedem pontos nem contam como acertos.
- Cumprir a meta não encerra o ganho de pontos, conforme decisão do responsável.
- **[P]** Retomar ou abrir outra aba não elimina erros acumulados.

### 10.2 Vitória — [D]

Ganhar uma partida concede **30 pontos extras**, além dos pontos pelas respostas. **[P]** Registrar um evento de vitória por partida; reabrir a tela de resultado, atualizar a página ou repetir uma requisição não concede outro bônus.

Exemplo: acerto sem erros que permite a movimentação vencedora concede 10 pontos pela resposta e 30 pela vitória, totalizando 40 pontos adicionais. Uma vitória após dois erros concede 4 + 30 = 34 pontos.

### 10.3 Regras substituídas

Não implementar dificuldade × 10, dificuldade × 5 ou prêmio fixo menor apenas por estar na recuperação. Essas eram sugestões anteriores substituídas pela decisão de 10 pontos com redução progressiva de 3 e piso de 1.

## 11. Ranking mensal

- **[D]** Ranking por turma, com pontos de acertos e bônus de vitória.
- **[D]** Mensal, sem histórico de classificações anteriores.
- **[P]** Considerar o mês civil no fuso configurado do município; proposta inicial: America/Fortaleza.
- **[P]** Registrar data de concessão pelo servidor. Uma partida que atravessa meses concede cada prêmio no mês do respectivo evento, sem transportar saldo anterior.
- **[P]** Abrir o novo mês com pontuação zero, sem depender de apagar respostas ou executar um reset destrutivo.
- **[P]** Não criar telas, snapshots ou pódios consultáveis de meses anteriores. Os registros de respostas continuam disponíveis para fins pedagógicos e rastreabilidade; não serão apresentados como histórico de rankings.
- **[P]** Empates compartilham posição, usando classificação 1, 1, 3. Ordenação visual secundária pode ser por nome; não usar velocidade para desempate.
- **[P]** Mostrar somente nome de apresentação, posição e pontos; não publicar código de acesso, e-mail ou percentual de erros no ranking dos alunos.
- **[P]** Alunos da turma podem consultar o ranking autenticados; não haverá ranking público.
- **[P]** Exibir os alunos ativos da turma, incluindo os que têm zero ponto.
- **[P]** Eventos carregam a turma da atividade. Em transferência, não levar pontos da turma anterior à nova. O aluno passa a competir na turma atual; não migrar eventos nem resultados pedagógicos retroativamente.
- **[P]** Fechar uma atividade não retira pontos confirmados no mês.

Como há prática adicional com pontos, a classificação reflete também volume de prática. Não usá-la como medida de domínio matemático ou nota escolar.

## 12. Dados e feedbacks pedagógicos

### 12.1 Registro mínimo por interação — [P]

Identificador da interação, aluno, escola, turma e matrícula no momento da resposta, atividade, partida, sequência de recuperação, série, tema, habilidade principal, versão da questão, dificuldade, valor do dado, tipo de resposta, resposta enviada, resultado, quantidade de erros anteriores, pontos concedidos, data de apresentação, data de resposta e indicação de repetição da questão.

Tempo ativo e uso de áudio são dados auxiliares. **[P]** Pausas e perda de foco devem ser consideradas quando possível; tempo informado pelo cliente não será usado para pontuar, desempatar ou concluir dificuldade de aprendizagem.

### 12.2 Definições dos indicadores — [P]

| Indicador | Cálculo e interpretação |
| --- | --- |
| Participação | Ao menos uma resposta aceita na atividade |
| Cumprimento | Quantidade de respostas aceitas ≥ meta |
| Precisão em jogadas normais | Respostas corretas fora da recuperação / respostas aceitas fora da recuperação |
| Precisão em recuperação | Corretas em recuperação / respostas aceitas em recuperação |
| Precisão por habilidade e dificuldade | Corretas / respostas, no agrupamento e contexto selecionados |
| Exposição inédita | Primeira resposta do aluno à versão da questão; exibir separadamente das repetições |
| Dificuldade recorrente | Erros distribuídos por questões distintas da mesma habilidade, com quantidade suficiente de observações |
| Evolução | Comparação entre períodos com série, habilidade, dificuldade, contexto e repetição compatíveis |
| Cobertura | Quantidade de respostas e questões distintas por habilidade |
| Prática adicional | Respostas após atingir a meta da atividade |

Erro seguido de acerto em outra habilidade ou em dificuldade menor não comprova domínio da habilidade ou dificuldade anterior. A leitura em áudio é apoio de acesso e não deve ser rotulada automaticamente como ajuda matemática.

### 12.3 Painel do professor — [P]

- Filtros por escola, turma, atividade, período, habilidade e dificuldade.
- Participação e cumprimento da meta, com denominadores explícitos.
- Mapa de habilidades com quantidade de alunos avaliados, precisão e cobertura.
- Lista de alunos com necessidade de retomada, indicando evidências e dados insuficientes.
- Detalhe individual: respostas, habilidades, dificuldades, contextos, prática adicional e evolução.
- Análise das questões que concentram erros para investigar conteúdo, formulação ou gabarito.
- Separação entre pontos, quantidade de prática e desempenho.
- Ranking atual da turma, sem classificações históricas.

### 12.4 Escola e município — [P]

Coordenador acompanha sua escola; SEMED acompanha a rede. Exibir participação, cobertura e desempenho por série/habilidade/dificuldade. Não comparar séries diferentes pelo mesmo número de dificuldade.

Ao consolidar uma turma ou escola, mostrar tanto a taxa por respostas quanto a média das taxas individuais dos alunos com dados suficientes, com nomes claros. Não deixar que um aluno com muitas respostas represente sozinho o desempenho coletivo.

### 12.5 Feedbacks por regras — [P]

No MVP, gerar textos por regras explícitas, sem depender de IA generativa. Cada feedback terá observação, evidência, sugestão e acesso aos dados de origem.

Proposta de critério inicial: ao menos 5 respostas a questões distintas de uma habilidade e dificuldade no contexto analisado. Abaixo disso, mostrar “dados insuficientes”. Percentual abaixo de 50% pode sinalizar “sugestão de retomada”, sem diagnóstico ou classificação definitiva de domínio. Os limiares precisam de validação pedagógica no piloto.

Exemplo fictício: “Em subtração com reagrupamento, Ana acertou 3 de 8 questões distintas em jogadas normais de dificuldade 3. Sugestão: retomar essa habilidade com apoio visual.”

Propostas de alertas: baixa participação; meta ainda não cumprida; erros recorrentes por habilidade; habilidade pouco praticada; questão com concentração incomum de erros. Um alerta sobre uma questão não altera gabaritos ou pontos automaticamente.

## 13. Exportações — [D], formato proposto [P]

- **[D]** Disponibilizar PDF e planilha para os resultados.
- **[P]** Formato de planilha: XLSX. PDF: resumo de turma ou aluno, com filtros, período, data de geração, denominadores e notas de interpretação.
- **[P]** Exportar somente o escopo autorizado do solicitante; escola escolhida não substitui autorização.
- **[P]** Planilhas distinguem quantidade, precisão, dificuldade e pontos, sem misturá-los em uma nota única.
- **[P]** Não incluir senhas, hashes, tokens ou códigos de acesso em exportações pedagógicas.
- **[P]** Sanitizar entradas textuais para que nomes e enunciados não sejam executados como fórmulas na planilha.
- **[P]** A exportação usa os mesmos filtros e definições do painel. Preservar consistência entre PDF, XLSX e tela.
- **[P]** Não incluir históricos de rankings mensais nos relatórios.

## 14. Experiência, acessibilidade e áudio — [P]

- Interface em português do Brasil, legível em celular e computador.
- Uma questão por vez; botões grandes e estado de turno evidente.
- Identificar pinos por símbolos além das cores.
- Permitir teclado nos formulários e movimentos; foco claro e mensagens acessíveis.
- Permitir reduzir animações e desligar efeitos sonoros.
- O aluno aciona “Ouvir”; não exigir áudio automático para jogar.
- A leitura deve acompanhar a ordem real das alternativas e não revelar o gabarito.
- Textos, imagens e áudio devem corresponder à mesma versão da questão.
- Provedor de áudio ainda não escolhido. Comparar leitura pelo navegador e geração de arquivos, considerando qualidade em português, fórmulas, disponibilidade e custo.
- Falha de áudio deve mostrar opção de tentar novamente e preservar a questão e a resposta pendente.
- Em imagens essenciais, prever descrição ou instrução equivalente. Não presumir que ler apenas o enunciado torna uma questão visual acessível.
- Testar com alunos em alfabetização e com professores antes de padronizar a interface.

## 15. Arquitetura e dados para desenvolvimento por agentes

### 15.1 Stack e decisões técnicas

- **[D]** Next.js e Prisma ORM.
- **[D]** Implementação por Codex ou agente equivalente, com possibilidade de uso de Claude Code ou Copilot.
- **[P]** Next.js App Router com TypeScript; versões compatíveis definidas no início e fixadas em lockfile.
- **[P]** Banco relacional PostgreSQL. Provedor, hospedagem, autenticação, e-mail, áudio, armazenamento de mídia e bibliotecas de exportação ainda dependem de decisão de arquitetura.
- **[P]** Separar motor do Ludo, regras de pontos, autorização, consultas pedagógicas e apresentação. Não colocar regras de negócio somente em componentes React.
- **[P]** Server Actions ou Route Handlers chamam serviços protegidos. O mecanismo específico deve ser escolhido no plano; os dois não devem duplicar regras.

As orientações oficiais do Next.js destacam a necessidade de autorização nas operações de servidor e controle dos dados enviados ao cliente. A documentação do Prisma descreve transações, operações idempotentes e controle de concorrência; essas referências fundamentam os requisitos de integridade abaixo, sem fixar uma implementação específica.

### 15.2 Entidades conceituais — [P]

| Grupo | Entidades propostas |
| --- | --- |
| Identidade | User, Session, PasswordReset |
| Escola | School, SchoolMembership, AcademicYear, ClassGroup, Enrollment, TeacherClassAssignment |
| Conteúdo | Theme, Skill, Question, QuestionVersion, QuestionOption, QuestionSubmission, QuestionMedia |
| Atividades | Activity, ActivityQuestionVersion, ActivityParticipation |
| Jogo | GameSession, GameAction, Challenge, AnswerAttempt |
| Pontuação | PointEvent |
| Operação | AuditEvent, OperationalLog |

O esquema físico será derivado no plano técnico. Não usar somente User.schoolId, pois isso impediria os vínculos múltiplos do professor.

PointEvent registra origem, aluno, turma, data, quantidade e motivo. Award de resposta e bônus de vitória têm origens distintas e restrições de unicidade. GameSession guarda revisão do estado, turno, pinos, desafio pendente, erros acumulados, estado de saída e resultado.

### 15.3 Integridade e concorrência — [P]

- Dados do navegador, incluindo último schoolId, dado, pinos, resultado e pontos, não são autoridade.
- O servidor produz o lançamento e conhece as regras de movimento; o cliente anima um estado autorizado.
- Não enviar gabaritos no payload inicial da questão. Após resposta incorreta, enviar o feedback permitido.
- Correção, registro da resposta, prêmio, contagem da meta e avanço do estado devem ter consistência transacional.
- A movimentação vencedora e seu bônus devem ser confirmados de modo atômico.
- Identificar ações para que retries retornem o resultado original, sem novo dado ou novo prêmio.
- Usar revisão de estado para rejeitar ações de abas ou dispositivos desatualizados.
- Responder duas vezes ao mesmo desafio, mover duas vezes ou conceder vitória duas vezes deve ser impossível por restrições e validações persistidas.
- Adotar estratégia de disputa entre fechamento de atividade e respostas; documentar o que foi confirmado primeiro.
- Áudio, e-mail e outras chamadas externas não devem ficar dentro de transações longas do jogo.
- Proteger consultas e caches por usuário/escopo para não misturar escolas, turmas ou alunos.

### 15.4 Operação e capacidade — [P]

- Logs com identificador de correlação, tipo de erro, data e contexto técnico mínimo; sem credenciais e sem respostas individuais expostas ao desenvolvedor.
- Ambientes de desenvolvimento, teste e produção separados; fixtures sintéticas.
- Migrações versionadas, backup e restauração verificada antes do piloto.
- Definir carga-alvo após levantamento de escolas, alunos e acessos simultâneos. Proposta inicial de experiência: operações comuns de resposta e lançamento em até 2 segundos no percentil 95 sob a carga acordada; validar no plano de desempenho.
- Política municipal de privacidade, retenção, responsáveis e tratamento de solicitações ainda deve ser definida. Este PRD não declara conformidade jurídica já obtida.

## 16. Plano de implementação para Codex e agentes equivalentes — [P]

### 16.1 Documentos no repositório

```text
docs/fluencia-matematica/PRD.md
docs/fluencia-matematica/decisions.md
docs/fluencia-matematica/architecture.md
docs/fluencia-matematica/game-rules.md
docs/fluencia-matematica/data-model.md
docs/fluencia-matematica/analytics.md
docs/fluencia-matematica/test-plan.md
docs/fluencia-matematica/tasks.md
docs/fluencia-matematica/pilot-runbook.md
```

Esses caminhos são uma proposta para o futuro repositório; este documento não cria um repositório nem executa implementação.

### 16.2 Etapas recomendadas

| Etapa | Entrega | Evidência para avançar |
| --- | --- | --- |
| 0 | Revisar interpretações e propostas; levantar rede; definir fornecedores | Registro de decisões e escopo sem contradições |
| 1 | Autenticação, escolas, vínculos, turmas e cadastros | Testes de isolamento e seleção de escola |
| 2 | Banco, versões, respostas e áudio | Correção e privacidade de questões verificadas |
| 3 | Atividades e participação | Cobertura, abertura, fechamento e meta verificados |
| 4 | Motor do Ludo e pontuação | Matriz de regras, retomada, bônus e concorrência passando |
| 5 | Painéis, feedbacks, ranking e exportações | Indicadores conferidos contra fixtures conhecidas |
| 6 | Piloto, capacidade e operação | Revisão pedagógica, testes em dispositivos e restauração verificada |

### 16.3 Instruções aos agentes

- Ler o PRD e as decisões do repositório antes de editar código.
- Usar a regra vigente de pontos; não recuperar fórmulas antigas da conversa ou inventar multiplicadores por dificuldade.
- Se o repositório existir, inspecionar instruções e estado Git antes de escolher a branch. A branch base ainda não foi definida neste projeto.
- Documentar dependências e versões reais; não presumir APIs de outra versão de Next.js ou Prisma.
- Implementar entregas pequenas, com critérios de aceite e verificação das regras de negócio.
- Reportar arquivos alterados, comandos executados, resultados e limitações reais. Não declarar testes que não foram executados.
- Não inserir contas reais, credenciais, gabaritos particulares ou dados de alunos em fixtures públicas.
- Não ampliar o escopo para offline, outros games, IA generativa ou importação de cadastros.
- Não executar migrações destrutivas em produção ou publicar sem a autorização correspondente.

## 17. Critérios de aceite e testes

Os testes abaixo são requisitos propostos para verificar o produto. Os cenários ligados a propostas de regras devem ser ajustados caso elas mudem na revisão.

### 17.1 Matriz funcional

| ID | Cenário | Resultado esperado |
| --- | --- | --- |
| AUTH-01 | Aluno informa código e senha válidos | Acessa somente seus dados e atividades |
| AUTH-02 | Credencial inválida ou conta bloqueada | Acesso negado; mensagem sem exposição de senha ou dados |
| SCOPE-01 | Professor altera schoolId para escola sem vínculo | Servidor nega acesso, incluindo exportação |
| SCOPE-02 | Professor de duas escolas troca contexto | Turmas e filtros correspondem à escola selecionada |
| SCOPE-03 | Última escola salva está válida | Próximo login entra nela |
| SCOPE-04 | Preferência pertence a outra conta ou vínculo foi revogado | Não reutiliza contexto indevido; solicita seleção válida |
| SCOPE-05 | Coordenador tenta gerir professor de outra escola | Operação negada; vínculos externos não alterados |
| SCOPE-06 | Desenvolvedor tenta editar pontos ou ler respostas individuais | Operação negada |
| Q-01 | Autor usa questão particular | Uso imediato nas próprias turmas autorizadas |
| Q-02 | Outro professor tenta acessar questão particular | Operação negada |
| Q-03 | SEMED publica versão enviada | Banco da rede recebe cópia rastreável; original preservado |
| Q-04 | Questão respondida é editada | Histórico mantém a versão efetivamente respondida |
| Q-05 | Alternativas são reordenadas | Gabarito e áudio continuam associados à opção correta |
| Q-06 | Resposta numérica decimal equivalente | Correção segue os critérios definidos, incluindo vírgula/ponto |
| ACT-01 | Banco não cobre uma das dificuldades | Abertura bloqueada com indicação do conteúdo faltante |
| ACT-02 | Aluno responde 12 acertos e 8 erros em meta 20 | Meta cumprida com 20 respostas; contagens separadas |
| ACT-03 | Aluno joga após atingir a meta | Continua respondendo e recebendo pontos |
| ACT-04 | Atividade é fechada durante a partida | Nenhuma nova resposta aceita após o fechamento confirmado |
| LUDO-01 | Aluno não tem primeiro pino liberado e tira 1–5 | Sem questão; turno passa à máquina |
| LUDO-02 | Aluno tira primeiro 6 | Pino liberado sem questão e sem prêmio |
| LUDO-03 | Dado 6 com movimento após etapa inicial | Apresenta questão de dificuldade 6 |
| LUDO-04 | Aluno erra | Não move; recebe resposta correta; máquina aguarda |
| LUDO-05 | Aluno está na recuperação | Novos resultados somente de 1 a 4 |
| LUDO-06 | Aluno acerta com 6 e movimenta | Outra jogada com nova questão |
| LUDO-07 | Nenhum movimento existe | Nenhuma questão; turno passa à máquina |
| LUDO-08 | Captura fora de casa segura | Pino adversário retorna à base |
| LUDO-09 | Pino adversário em casa segura | Não é capturado |
| LUDO-10 | Todos os pinos jogáveis do aluno estão na base | Dado 1–6, sem questões até liberar um pino |
| LUDO-11 | Retorno à base durante sequência com erros | Não cria acerto nem apaga o contador de erros |
| LUDO-12 | Pino está perto da chegada | Somente resultado exato conclui o percurso |
| LUDO-13 | Conexão cai e depois retorna | Partida pausa e retoma o estado confirmado, sem duplicações |
| PTS-01 | Acerto com 0, 1, 2, 3 ou 10 erros anteriores | Concede respectivamente 10, 7, 4, 1 e 1 ponto |
| PTS-02 | Aluno erra tendo saldo anterior | Saldo anterior preservado; prêmio futuro reduzido |
| PTS-03 | Acerto de dificuldade 1 ou 6 sem erros | Ambos concedem 10 pontos |
| PTS-04 | Acerto que permite vencer com dois erros anteriores | 4 pontos pelo acerto + 30 pela vitória |
| PTS-05 | Atualização ou retry na tela de vitória | Nenhum segundo bônus |
| RANK-01 | Virada do mês | Novo ranking inicia em zero, sem apagar respostas |
| RANK-02 | Partida cruza a virada do mês | Cada prêmio entra no mês em que foi concedido |
| RANK-03 | Dois alunos empatam | Compartilham posição; velocidade não desempata |
| RANK-04 | Aluno muda de turma | Sem transporte ou reatribuição retroativa de pontos |
| DATA-01 | Há poucas respostas distintas | Mostra dados insuficientes |
| DATA-02 | Erro difícil seguido de acerto fácil em outra habilidade | Não afirma domínio ou recuperação da habilidade anterior |
| DATA-03 | Mesma questão é repetida | Identifica repetição e separa da exposição inédita |
| DATA-04 | Aluno usa leitura em áudio | Não penaliza pontos ou rotula ajuda matemática |
| EXPORT-01 | Exporta com filtros | PDF, XLSX e painel usam os mesmos recortes e contagens |
| EXPORT-02 | Nome contém conteúdo semelhante a fórmula | Texto não é executado como fórmula na planilha |
| AUDIO-01 | Solicita leitura de alternativas reordenadas | Áudio acompanha a ordem e não revela o gabarito |

### 17.2 Testes de integridade

- Enviar a mesma resposta simultaneamente: uma resposta, uma contagem e um prêmio.
- Responder ao mesmo desafio com respostas diferentes em duas abas: somente a primeira operação válida é confirmada.
- Repetir pedido de lançamento: devolver a ação confirmada, sem trocar o dado.
- Movimentar a partir de revisão antiga: rejeitar e recuperar o estado atual.
- Disputar fechamento com resposta: resultado compatível com a ordenação transacional, sem pontuação órfã.
- Simular falha após commit: retry recupera o resultado original.
- Concluir o último pino simultaneamente: uma vitória e um bônus.
- Consultar dados em outra escola após alterar a preferência local: autorização permanece correta.

### 17.3 Estratégia de testes

- **Unidade:** pontuação, limites do dado, movimentos, capturas, chegada, máquina, indicadores e normalização numérica. Usar sorteios controláveis em teste, sem depender da sorte.
- **Integração com banco:** versões, vínculos, transações, unicidade, meta, eventos e virada do mês. Testar com o mesmo mecanismo de banco escolhido para produção.
- **E2E:** cadastro, login, seleção de escola, criação de conteúdo, atividade, partida, feedback, ranking e exportação.
- **Responsividade e acessibilidade:** teclado, leitor de tela nos fluxos principais, distinção visual dos pinos, toque em celular e orientação do tabuleiro.
- **Revisão pedagógica:** validar dificuldade, enunciados, explicações, áudio e limiares dos feedbacks com a equipe responsável.
- **Operação:** migração em banco vazio e existente, restauração, carga acordada e falhas de fornecedores.

Não fixar uma porcentagem genérica de cobertura como substituta da matriz. Regras de pontuação, autorização, movimentação e concorrência exigem evidência específica. E2E ou testes ignorados devem ser reportados, nunca contados como aprovados.

## 18. Decisões pendentes antes da implementação

| Prioridade | Decisão |
| --- | --- |
| Alta | Confirmar a interpretação do desconto: reduz o próximo prêmio, não o saldo acumulado |
| Alta | Revisar regras complementares do Ludo: chegada exata, bônus de turno da máquina, convivência nas casas e estratégia |
| Alta | Confirmar preservação do contador de erros quando todos os pinos voltam à base |
| Alta | Validar matriz de conteúdos, dificuldade e critérios de feedback para cada série |
| Alta | Escolher banco, hospedagem, autenticação, e-mail, áudio e gestão de mídia |
| Alta | Definir responsável e política municipal para acesso, privacidade, retenção e exclusão |
| Média | Confirmar contagem de erros na meta e progressão entre partidas |
| Média | Confirmar fuso, empates e tratamento de transferência no ranking |
| Média | Confirmar permissões adicionais de escola/rede e recuperação de acesso |
| Média | Confirmar formato XLSX e campos das exportações |
| Média | Levantar número de escolas, usuários e acessos simultâneos para o piloto |
| Média | Definir identidade visual, nome de apresentação no ranking e validação em dispositivos |

As pendências não anulam as decisões já confirmadas. Servem para impedir que um agente invente detalhes de produto ou infraestrutura sem registrar a escolha.

## 19. Referências técnicas

Consultadas em 04/10/2026; verificar a documentação correspondente às versões efetivamente adotadas antes de implementar.

- [Next.js — Data Security](https://nextjs.org/docs/app/guides/data-security): autorização nas operações de servidor e proteção dos dados enviados ao cliente.
- [Prisma — Transactions](https://www.prisma.io/docs/orm/fundamentals/transactions): transações, idempotência e concorrência.

Nenhuma referência sobre funcionamento offline constitui requisito: o modo offline foi retirado do MVP. A seleção de tecnologias para áudio continua aberta.

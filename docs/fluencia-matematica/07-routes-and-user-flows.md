# Rotas e fluxos

Todas as rotas privadas revalidam sessão/escopo no servidor. Cabeçalho global contém conta e escola;
sidebar contém módulos; filtros de turma/período são locais e retornam via query string segura.

| Perfil/rota | Entrada e dados | Ações e destino | Estados obrigatórios |
| --- | --- | --- | --- |
| `/login` | pública | autenticar → `/selecionar-escola` ou dashboard/aluno | inválido, bloqueado, rate limit |
| `/selecionar-escola` | memberships permitidos | escolher → dashboard; grava preferência local por userId | vazio, vínculo revogado |
| `/admin` | SEMED | escolas, usuários, revisões, rede | loading/empty/error/forbidden |
| `/escola` | coordenador | turmas, pessoas, indicadores | escola atual, troca segura |
| `/professor` | professor | turmas, atividades, questões | seleção escola/turma persistente |
| `/professor/turmas/[id]` | turma atribuída | alunos, resultados, atividade | filtros e retorno preservados |
| `/questoes` | rede permitida + próprias | criar/editar versão, prévia, enviar | rascunho, validação, mídia/áudio |
| `/questoes/[id]` | ownership/SEMED | versionar; revisar em rota SEMED | histórico e acesso negado |
| `/atividades/nova` | turma atribuída | configurar → prévia → abrir | cobertura 1–6, meta, confirmação |
| `/atividades/[id]` | ator escopado | fechar, resultados, exportar | rascunho/aberta/fechada/conflito |
| `/aluno` | próprio aluno | atividade aberta → detalhe/jogo | não iniciou/em curso/meta atingida |
| `/aluno/atividades/[id]/jogo` | participação própria | lançar, responder, mover, retomar | turno, feedback, reconexão/suspensão |
| `/aluno/ranking` | matrícula atual | consultar mês atual | zero pontos, empate, privado |
| `/relatorios` | professor/coordenador/SEMED | filtros → detalhe/PDF/XLSX | dados insuficientes, exportando |
| `/operacao` | desenvolvedor | saúde/log técnico/versionamento | sem dados pedagógicos individuais |

No celular, sidebar vira navegação acessível; ações primárias não cobrem tabuleiro. Voltar de detalhe
preserva escola/turma/período quando válidos. Trocar escola invalida turma/filtros incompatíveis e
redireciona para um destino existente. Nenhum botão principal pode ser placeholder na tarefa dada.

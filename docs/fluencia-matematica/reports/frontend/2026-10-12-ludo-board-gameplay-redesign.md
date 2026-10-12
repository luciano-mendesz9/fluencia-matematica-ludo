# Redesenho do tabuleiro e da experiência do Ludo — 12/10/2026

## Identificação

- Branch: `codex/ludo-board-gameplay-redesign`.
- Base local: FM-025 em `c307739`; `origin/main` observado em `2a3a731`.
- Escopo: tabuleiro clássico, cores por partida, janelas de dado/desafio, escolha direta de pino,
  movimento progressivo e composição mobile sem rolagem da página.
- Referência visual: imagem de tabuleiro fornecida pelo responsável na conversa.

## Entrega

- Tabuleiro visual 15 × 15 com percurso compartilhado de 52 casas, oito casas seguras, quatro
  corredores finais, bases, pátios e chegada central.
- Embaralhamento determinístico das quatro cores por partida: a cor pode variar entre partidas sem
  mudar ao atualizar a página. O aluno fica sempre na base inferior esquerda e a máquina na superior
  direita.
- Sorteio do aluno em janela de primeiro plano por no mínimo três segundos. A pergunta, as opções ou
  o campo numérico e a confirmação aparecem em janela flutuante logo depois.
- Resposta incorreta abre feedback e oferece nova tentativa. Resposta correta fecha a pergunta e
  transforma somente os pinos válidos em alvos pulsantes e clicáveis.
- Movimentos visuais percorrem cada casa intermediária. Capturas, posição final, turno e pontuação
  continuam definidos e persistidos pelo servidor.
- Jogadas automáticas da máquina são devolvidas pelo serviço e apresentadas em sequência, cada dado
  também por três segundos.
- A rota do jogo ocupa `100dvh`, mantém o tabuleiro como foco e bloqueia rolagem horizontal e vertical
  da página em 390 × 844 px. Janelas podem conter reflow próprio para conteúdo excepcionalmente longo.
- O alvo de toque do pino permanece estável enquanto apenas sua aparência pulsa; nomes acessíveis
  refletem inclusive o estado offline.

## Persistência, autorização e migrations

O cliente não sorteia nem escolhe resultados válidos: dado, desafio, correção, movimentos legais,
turno da máquina, captura e pontuação continuam sendo calculados e autorizados no servidor. O valor
aleatório mostrado durante a animação é apenas visual; o resultado final exibido vem da resposta
persistida. Os eventos de ação receberam apenas metadados do movimento já confirmado para reproduzir
as animações sem conceder autoridade ao navegador.

Não houve alteração no schema Prisma nem migration nova. A rodada de integração usou o banco de
desenvolvimento marcado, dados sintéticos e limpeza ao final.

## Verificações executadas

| Gate | Resultado |
| --- | --- |
| `npm run typecheck` | aprovado |
| `npm run lint` | aprovado; relatórios gerados por Playwright passaram a ser ignorados pelo ESLint |
| `npm run test:unit` | 19 arquivos e 84 testes aprovados |
| `npm run test:integration` | 14 arquivos e 65 testes aprovados |
| `npm run build` | aprovado com Next.js 16.3.8 e webpack; 35 páginas coletadas |
| `npm run db:validate` / `npm run db:migrate:status` | schema válido; 17 migrations aplicadas e banco atualizado |
| Playwright Chromium focado | fluxo completo e tentativa incorreta aprovados em 390 × 844 px |
| Playwright cross-browser focado | 3 aprovados: Chromium, Firefox e WebKit |
| `git diff --check` | aprovado |

O cenário de navegador cobre animação mínima do dado, retomada da pergunta, resposta incorreta,
feedback com gabarito, nova tentativa, resposta correta com redução de pontos, pino pulsante, jogada
da máquina, concorrência em duas abas, bloqueio offline, reconexão e ausência de overflow horizontal
ou vertical da página. O fluxo principal passou nos três engines; a extensão de recuperação por erro
foi reexecutada no Chromium após a rodada cruzada.

## Estado e limites

- Implementada: sim.
- Verificada tecnicamente: sim nos gates e navegadores registrados acima.
- Validação humana visual e em dispositivos reais: pendente, conforme OD-010.
- Publicada, integrada ou em produção: não.
- Áudio e imagens de questões continuam fora deste piloto, conforme OD-005.
- A branch parte da FM-025 ainda não integrada em `origin/main`; não iniciar FM-026/027 sobre a main
  sem antes integrar as dependências na ordem correta.
- A atualização aprovada de `14-open-decisions.md`, já existente no diretório de trabalho antes deste
  redesenho, foi preservada sem descarte.

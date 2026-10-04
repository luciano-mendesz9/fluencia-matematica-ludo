# Design system branco e azul

## Tokens propostos

Superfície `#FFFFFF`; fundo `#F6F8FC`; texto `#172033`; secundário `#526077`; borda `#D9E1EC`;
azul marca `#1769E0`, hover `#1255B8`, foco `#75A7F7`. Verde `#178A55`, âmbar `#A66300` e vermelho
`#C73535` somente para estado. Confirmar contraste WCAG AA. Tipografia: sans legível (Geist do
bootstrap ou equivalente), 16px base; escala 12/14/16/20/24/32. Espaço 4/8/12/16/24/32/48;
raio 8/12; sombra discreta; conteúdo 1200px, formulários 720px.

## Componentes

Botões primário/secundário/perigo com `Aguarde...` e `aria-busy`; input/select/textarea com rótulo,
ajuda e erro; tabela responsiva; cards, badge sem depender só de cor, modal com foco preso e retorno,
toast também anunciado, breadcrumb, paginação/filtros, skeleton, empty/error/forbidden/reconnect,
gráficos com tabela/descrição alternativa. Alvos >=44px; foco visível; teclado completo.

## Shell e responsividade

Desktop: header + sidebar + conteúdo. Celular 320/390px: header compacto, navegação em drawer,
ações empilhadas, tabelas com alternativa em cards/scroll intencional. O tabuleiro é dominante,
controles laterais no desktop e abaixo no celular; pinos têm símbolo/forma/rótulo além da cor.
Respeitar `prefers-reduced-motion`; áudio é acionado pelo aluno e tem fallback textual.

Cada página demonstra loading, vazio, erro, sem acesso, sucesso e confirmação relevante. Design não
autoriza dados; escola/turma visíveis sempre correspondem ao DTO validado pelo servidor.

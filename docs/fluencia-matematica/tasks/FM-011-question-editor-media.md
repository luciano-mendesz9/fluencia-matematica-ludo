# FM-011 — Editor, correção, mídia e áudio

**Ordem/fase:** 11/Conteúdo | **Branch:** `task/FM-011-question-editor-media` | **Situação:** planejada

## Objetivo/escopo

Sobre FM-010, entregar editor de alternativa/numérica, prévia fiel, correção server-side e adapter de
áudio/mídia. Inclui fallback de leitura do navegador se aprovado; fornecedor de TTS/armazenamento
permanece atrás de interface (OD-005).

## Dados e contratos

Migration `QuestionOption`, `QuestionMedia` e campos de política numérica/explicação. Editor envia
conteúdo; serviço valida exatamente uma correta, IDs estáveis, ordem, decimal e limites. DTO de desafio
remove `isCorrect/expected`; `correctAnswer(challenge,response)` retorna resultado/feedback apenas após
aceite. Upload valida bytes/MIME/tamanho/altText e acesso; áudio referencia versão+opção por ID.

## Fluxo/segurança/bordas

`/questoes/nova`, editor, prévia e ouvir. Reordenar mantém gabarito/áudio; falha de áudio preserva
resposta pendente. Não avaliar expressão/código; vírgula/ponto conforme política; fração/tolerância só
se explicitamente suportada. Negar URL externa, SVG ativo, questão alheia e gabarito no payload.

## Testes/aceite/entrega

Unitários Q-05/06 e normalização; integração upload/DTO/correção; Playwright alternativas reordenadas,
numérica, preview, áudio/falha, teclado e mobile. Aceite: inspeção de rede prova ausência de gabarito e
prévia corresponde à versão. Relatório FM-011, migration e decisão/fake do fornecedor documentados.

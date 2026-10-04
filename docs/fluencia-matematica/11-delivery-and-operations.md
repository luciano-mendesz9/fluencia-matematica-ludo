# Entrega e operação

## Git e integração

Base efetiva observada: `main`; cada tarefa usa `task/FM-XXX-slug`. Buscar remoto, verificar SHA da
base e dependências integradas antes de criar/reutilizar branch. Commits focados incluem migration,
testes e relatório. Push sem force; PR revisável; merge somente com autorização/política. Publicada
não significa integrada; build local não significa deploy.

## Ambientes e release

Promoção: dev isolado → CI/teste → staging/piloto → produção autorizada. Cada estágio registra SHA,
migrations aplicadas, config sem segredos, smoke e rollback. Health checks não consultam dados
sensíveis. Logs estruturados, correlationId e alertas de erro/taxa/latência; acesso de desenvolvedor
é técnico e auditado.

## Operações

Runbooks: criar/revogar acesso, aplicar migration, restaurar backup, trocar secret, incidente de
auth, indisponibilidade Neon/e-mail/TTS/mídia, suspender atividade e exportar evidência. RPO/RTO,
retenção, privacidade e responsáveis municipais precisam de decisão antes do piloto. Meta inicial de
latência p95 <=2s para ações comuns é proposta a medir, não garantia.

## Piloto

Pré-condições: decisões pedagógicas/jurídicas fechadas, conteúdo validado, capacidade levantada,
restauração ensaiada, navegadores/dispositivos reais, acessibilidade e fluxos por papel aprovados.
Implantação gradual com escolas/turmas sintéticas antes de dados reais; critérios de interromper,
suporte, consentimento/comunicação e coleta mínima definidos. Pós-piloto separa evidência técnica,
pedagógica e humana.

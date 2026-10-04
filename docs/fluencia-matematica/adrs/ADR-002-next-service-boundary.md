# ADR-002 — App Router com serviços únicos protegidos

**Estado:** aceito tecnicamente; revisar ao mudar major do Next.

Server Components leem DTOs no servidor; Client Components apenas onde há interação/browser.
Server Actions são adaptadores de mutações de UI; Route Handlers atendem download, mídia e protocolo
do jogo. Ambos chamam os mesmos serviços, que autenticam, autorizam, validam e transacionam. Layout,
proxy e formulário oculto não são barreiras de segurança.

Consequência: reduz duplicação e exposição de dados, mas exige DTOs e políticas explícitas. Todas as
entradas continuam tratadas como chamadas públicas e testadas diretamente.

# AgriTech MVP

Documentação da entrega atual do marketplace B2C AgriTech. Nesta etapa, o produto mantém somente o fluxo vertical real de consumidor: cadastro, login, catálogo persistido, carrinho, checkout idempotente, reserva de estoque e consulta de pedidos.

> **Estado atual:** Next.js integrado à API NestJS/Prisma. O backend roda com SQLite persistente como adapter sandbox e o pagamento usa `fake-sandbox` aprovado. Não há cobrança real.

## Conteúdo

- [SETUP.md](./SETUP.md): execução local e comandos de validação.
- [API.md](./API.md): endpoints reais disponíveis.
- [UX/UI](./ux-ui.md): princípios visuais e decisões de experiência.

## Arquitetura atual

```text
frontend/                 Next.js App Router + React + TypeScript + Tailwind
    │ JSON + Bearer JWT
    ▼
backend/                  NestJS REST com prefixo /v1
    ├── Prisma + SQLite    persistência sandbox
    ├── Auth               cadastro, CPF, bcryptjs e JWT
    ├── Catalog            ofertas e estoque persistidos
    └── Cart/Checkout      carrinho, idempotência e reserva transacional
```

O catálogo, carrinho, checkout e pedidos não usam arrays locais. O seed fornece dados iniciais de desenvolvimento; não é um mock de resposta da API. As rotas de produtor, operações e assinaturas foram removidas até existir backend real para elas.

## Implementado

- Cadastro e login reais com CPF validado, hash bcrypt e Bearer JWT.
- Catálogo persistido com busca, categoria e estoque disponível.
- Carrinho persistido por usuário, adição e remoção de itens.
- Checkout idempotente com chave no header, pagamento fake sandbox aprovado, pedido persistido e reserva condicional de estoque.
- Lista e detalhe de pedidos persistidos.
- Estados de carregamento, erro e vazio no frontend; nenhuma tela do fluxo usa dados mockados.

## Limites conhecidos

O SQLite é um adapter de execução local e deverá ser substituído por PostgreSQL com migração revisada antes de produção. O pagamento fake deverá ser substituído por um adapter Mercado Pago sandbox/produção. Ainda não entram neste slice Redis, Mapbox, assinaturas, produtor, operações, e-mail, OpenAPI ou testes E2E automatizados.

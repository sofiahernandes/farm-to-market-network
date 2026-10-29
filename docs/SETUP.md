# Setup local

Os comandos abaixo executam o fluxo vertical real a partir de `/home/ubuntu/agritech`.

## Pré-requisitos

- Node.js 18+ (Node 20+ recomendado) e npm.
- Nenhum PostgreSQL, Redis ou provedor externo é necessário para o sandbox.

## Backend NestJS + SQLite sandbox

```bash
cd /home/ubuntu/agritech/backend
npm install
cp .env.example .env
npm run prisma:generate
npx prisma db push
npm run prisma:seed
npm test
npm run build
npm run start:dev
```

A API fica em `http://localhost:3001/v1`. O banco persistente de sandbox fica em `backend/prisma/dev.db`. O seed é idempotente e cria um produtor, uma zona, o slot `seed-slot` e três ofertas com estoque.

Teste rápido:

```bash
curl http://localhost:3001/v1/health
curl http://localhost:3001/v1/catalog
```

## Frontend Next.js

Em outro terminal:

```bash
cd /home/ubuntu/agritech/frontend
npm install
export NEXT_PUBLIC_API_URL=http://localhost:3001/v1
npm run dev
```

Abra `http://localhost:3000`. O fluxo de usuário é: `/criar-conta` → `/entrar` → `/catalogo` → detalhe do produto → `/app/carrinho` → `/app/checkout` → `/app/pedidos`.

Validação de produção do frontend:

```bash
npm run lint
npm run build
npm start
```

## Ambiente backend

| Variável | Uso sandbox |
|---|---|
| `NODE_ENV` | `development` |
| `PORT` | `3001` |
| `CORS_ORIGINS` | `http://localhost:3000` |
| `DATABASE_URL` | `file:./dev.db` |
| `JWT_SECRET` | segredo local de desenvolvimento |

Não commite tokens, senhas, CPF bruto ou dados de cartão.

## Próxima transição de produção

Antes de publicar, substituir o provider SQLite por PostgreSQL, criar migração revisada e configurar adapter de pagamento Mercado Pago. O gateway atual `fake-sandbox` não cobra, não armazena cartão e não representa uma integração financeira real.

# Setup do backend

```bash
cd backend
cp .env.example .env
npm install
npm run prisma:generate
npx prisma db push
npm run prisma:seed
npm test && npm run build
```

A base local é SQLite (`file:./dev.db`) por decisão deste sandbox. PostgreSQL é uma etapa de produção, exigindo trocar o provider e revisar a migração; não há PostgreSQL local nesta sessão.

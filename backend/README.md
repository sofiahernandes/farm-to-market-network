# AgriTech backend

API NestJS do fluxo vertical real em `/v1`: cadastro/login, catálogo persistido, carrinho por usuário, checkout idempotente e reserva transacional de estoque.

## Sandbox local (SQLite)

```bash
cp .env.example .env
npm install
npm run prisma:generate
npx prisma db push
npm run prisma:seed
npm test
npm run build
npm start
```

O sandbox usa **Prisma com provider SQLite** e `DATABASE_URL=file:./dev.db`; o arquivo é persistente no diretório do backend. A migração para PostgreSQL é uma etapa de produção futura: não é PostgreSQL local e não deve ser tratada como tal. Antes da produção, altere o provider, URL e execute uma migração revisada.

O seed de desenvolvimento é idempotente e cria um produtor, zona, slot e três ofertas com estoque. Não cria credenciais de usuário. Cadastros usam CPF logicamente válido, hash bcryptjs e papel `consumer`; login devolve Bearer JWT com expiração de 2h. O pagamento é fake sandbox aprovado, sem Mercado Pago real, Redis, Mapbox ou assinaturas neste slice.

Erros seguem `{ error: { statusCode, message, path, timestamp, correlationId } }`; validação rejeita campos desconhecidos e retorna 422.

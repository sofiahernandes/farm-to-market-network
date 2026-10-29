# ADR-001 — Localização da API

A API NestJS permanece em `backend/` nesta entrega, conforme o pedido de implementação e para não reorganizar o frontend existente. A separação futura de um worker pode reutilizar módulos de domínio e adapters, sem misturar credenciais no frontend. Prisma fica em `backend/prisma/` para manter instalação e migração reproduzíveis.

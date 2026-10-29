# API v1

- `POST /v1/auth/register` `{email, cpf, password}`; `POST /v1/auth/login` retorna `accessToken` Bearer por 2h.
- `GET /v1/catalog?search=&category=&limit=&offset=` e `GET /v1/catalog/:id` consultam ofertas e estoque disponível persistidos.
- Rotas privadas exigem `Authorization: Bearer <token>`: `GET /v1/cart`, `POST /v1/cart/items` `{productId,quantity}`, `DELETE /v1/cart/items/:productId`.
- `POST /v1/checkout` exige `x-idempotency-key` e `{address:{postalCode,street,number,complement?,city,state},deliverySlotId}`. A transação cria pedido confirmado, pagamento fake aprovado, entrega, histórico, auditoria e alocação de estoque. Repetição da chave devolve o mesmo pedido sem nova reserva.
- `GET /v1/orders` e `GET /v1/orders/:id` mostram apenas pedidos do usuário autenticado.
- `GET /v1/health` mantém o health check.

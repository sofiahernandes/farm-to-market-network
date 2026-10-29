# API AgriTech — fluxo vertical real

A API NestJS usa JSON e prefixo global `/v1`. O sandbox local usa SQLite persistente em `backend/prisma/dev.db`, Bearer JWT com expiração de duas horas e gateway de pagamento `fake-sandbox`. Não há Mercado Pago real nesta etapa.

## Convenções

- `Content-Type: application/json` em requisições com corpo.
- Rotas privadas exigem `Authorization: Bearer <accessToken>`.
- `x-correlation-id` é aceito; se ausente, a API gera um UUID no response header.
- Validação global remove campos desconhecidos e rejeita payload inválido com HTTP `422`.
- Erros seguem `{ "error": { "statusCode": number, "message": string|string[], "path": string, "timestamp": string, "correlationId": string|null } }`.

## Saúde

### `GET /v1/health`

Retorna o estado do processo.

## Cadastro e login

### `POST /v1/auth/register`

Cria e persiste um consumidor com CPF validado logicamente e senha com hash bcrypt.

```json
{"email":"pessoa@example.test","cpf":"529.982.247-25","password":"senha-local"}
```

A resposta contém `accessToken`, `tokenType`, `expiresIn` e o usuário público. Não devolve CPF, hash ou senha.

### `POST /v1/auth/login`

Valida email e senha persistidos e retorna o mesmo formato de sessão Bearer.

### `GET /v1/auth/config`

Retorna a configuração declarativa de sessão e papéis do sandbox.

## Catálogo persistido

### `GET /v1/catalog?search=&category=&limit=&offset=`

Consulta ofertas ativas persistidas e estoque disponível. O seed cria três ofertas de desenvolvimento. A resposta inclui `data`, `pagination`, produtor, preço em centavos e estoque calculado.

### `GET /v1/catalog/:id`

Consulta uma oferta ativa específica, incluindo produtor e estoque disponível.

## Carrinho persistido

Todas as rotas de carrinho são privadas e identificam o carrinho pelo usuário autenticado.

### `GET /v1/cart`

Retorna itens persistidos, subtotal em centavos e moeda `BRL`.

### `POST /v1/cart/items`

```json
{"productId":"seed-alface","quantity":1}
```

Cria ou atualiza a quantidade do produto no carrinho, validando produto ativo e disponibilidade atual.

### `DELETE /v1/cart/items/:productId`

Remove o produto do carrinho e retorna o novo resumo.

## Checkout idempotente e reserva

### `POST /v1/checkout`

Exige `x-idempotency-key` e sessão Bearer. O corpo contém endereço e slot persistido pelo seed:

```json
{"address":{"postalCode":"13201-000","street":"Rua das Flores","number":"42","complement":"Casa","city":"Jundiaí","state":"SP"},"deliverySlotId":"seed-slot"}
```

A transação Prisma: lê o carrinho, verifica disponibilidade, reserva estoque com condição atômica, cria pedido e itens, cria pagamento `fake-sandbox` aprovado, cria entrega, histórico e auditoria, e limpa o carrinho. O pedido retorna `status: confirmed`. Repetir a mesma chave para o mesmo usuário devolve o pedido existente sem nova reserva. Falhas de disponibilidade retornam conflito e não deixam pedido parcial.

## Pedidos

- `GET /v1/orders`: lista somente pedidos persistidos do usuário autenticado.
- `GET /v1/orders/:id`: consulta detalhes, itens, pagamento fake, entrega, endereço, slot e histórico; não permite acessar pedido de outro usuário.

## Fora deste slice

Mercado Pago real, webhooks assinados, PostgreSQL de produção, Redis/worker, Mapbox, assinaturas, produtor e operações ainda não estão conectados. Esses itens não devem ser interpretados como endpoints disponíveis.

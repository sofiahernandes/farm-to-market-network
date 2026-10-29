# TODO — slice AgriTech

## Concluído
- Cadastro de consumidor com email, CPF e senha via `POST /auth/register`, com mensagens de erro e sucesso.
- Login via `POST /auth/login`, sessão Bearer persistida no navegador e tratamento de sessão expirada.
- Catálogo e detalhe de oferta via `GET /catalog` e `GET /catalog/:id`, com busca, categoria, loading, erro e vazio.
- Carrinho persistido via `GET /cart`, `POST /cart/items` e `DELETE /cart/items/:productId`.
- Checkout real com endereço, `deliverySlotId` seed, chave `x-idempotency-key` estável por tentativa e confirmação do pedido.
- Histórico e detalhe de pedidos via `GET /orders` e `GET /orders/:id`.
- Remoção das áreas sem backend real e atualização do manifesto de rotas.

## Limites conhecidos do sandbox
- O gateway de pagamento é `fake-sandbox`; não há cobrança real nem integração Mercado Pago.
- O backend executa com SQLite sandbox e os slots disponíveis são os configurados pelo backend.
- Produtor, operações, assinaturas e demais integrações externas não fazem parte das rotas entregues neste slice.

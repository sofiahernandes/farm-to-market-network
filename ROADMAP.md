# Roadmap de Desenvolvimento — AgriTech MVP

**Versão:** 1.0  
**Data-base:** 28/10/2026  
**Fonte de escopo:** `PLAN.md`, repositório GitHub `sofiahernandes/farm-to-market-network` e artefatos de requisitos, sitemap, wireframe e UML.

## 1. Diagnóstico inicial e estado atual

Na análise inicial, o repositório continha apenas um scaffold de Next.js e `backend/empty.txt`. Nesta execução, o scaffold foi convertido em um slice vertical real: frontend Next.js conectado à API NestJS, cadastro/login JWT, catálogo persistido, carrinho, checkout idempotente, pagamento fake sandbox, reserva transacional de estoque, pedidos, auditoria, documentação e manifesto de rotas. O banco local usa SQLite; PostgreSQL, Mercado Pago, worker, mapas e notificações permanecem no backlog de produção.

Os documentos de produto já fornecem uma boa base de descoberta: sitemap para portal institucional, consumidor, produtor e operações; wireframes para login, vitrine, cestas, assinatura e painéis; e uma matriz de requisitos funcionais e não funcionais. Entretanto, parte da planilha contém requisitos herdados de outro domínio — pets, comunidades, prontuários e códigos de comunidade — que não deve entrar no backlog AgriTech.

O `PLAN.md` será tratado como a fonte de verdade do MVP. Portanto, a primeira versão será um marketplace B2C de uma cidade-piloto, com cestas de preço fixo recorrentes e compras avulsas, mais ferramentas de produtor e operações. B2B atacado, tickets de proposta, plantio preditivo e entrega por drones ficam fora do MVP.

## 2. Resultado esperado do MVP

Ao final do roadmap, uma pessoa consumidora deverá conseguir criar uma conta com CPF, escolher uma cesta fixa ou produto avulso, informar endereço e janela de entrega, pagar via Mercado Pago, acompanhar o pedido e confirmar a entrega. Uma pessoa produtora deverá conseguir concluir onboarding, cadastrar produtos e cestas, informar disponibilidade semanal, consultar a fila de separação e acompanhar repasses. A equipe de operações deverá conseguir configurar zonas e horários, consolidar pedidos, agrupar manualmente rotas, atualizar status e consultar exceções.

O sistema deverá preservar estoque por transações atômicas, reconciliar pagamentos por webhooks idempotentes, manter trilha de auditoria e operar com frontend Next.js/Vercel, API e worker NestJS/Render, PostgreSQL/Prisma, Redis para jobs, Mapbox para geocodificação/mapa e e-mail transacional.

## 3. Escopo priorizado

### Incluído no MVP

- Portal institucional em português do Brasil, mobile-first e de alto contraste.
- Cadastro, login, recuperação de senha, CPF validado, papéis consumidor/produtor/operações e autorização por papel.
- Catálogo paginado de produtos e cestas fixas, com produtor, origem, preço, unidade, sazonalidade, foto e disponibilidade.
- Carrinho e compra avulsa.
- Assinatura de cesta fixa semanal ou mensal, com pausa/cancelamento antes do cutoff configurado.
- Endereço, zona de atendimento, janela de entrega escolhida e checkout.
- Mercado Pago para pagamento avulso, recorrência, webhooks, idempotência e split 1:1 quando a conta e a aprovação comercial estiverem disponíveis.
- Painel do produtor para produtos, cestas, fotos/certificações, estoque semanal, pausa de oferta, fila de fulfillment e extrato.
- Painel de operações para zonas, calendário de slots, pedidos, mapa de endereços, agrupamento manual de rotas e status de entrega.
- Status de pedido: `pending_payment` → `confirmed` → `preparing` → `in_transit` → `delivered`, com confirmação pelo consumidor.
- Jobs Redis para ciclos de assinatura, processamento de webhooks, alertas de estoque, notificações e atualizações de entrega.
- E-mail transacional inicial; push e SMS apenas como adaptadores futuros.
- Solicitação rastreável de exclusão de dados conforme LGPD, logs de auditoria imutáveis, HTTPS, CORS estrito, sessão com expiração por inatividade e armazenamento seguro de segredos.
- Documentação OpenAPI, contrato TypeScript compartilhado, testes unitários, integração e fluxos E2E críticos.

### Explicitamente fora do MVP

- Catálogo e fluxo B2B/atacado, MOQ corporativo, boleto corporativo e conta empresarial.
- Tickets de proposta, negociação de preço, aceite/recusa e conversão automática do ticket em carrinho.
- Cestas totalmente customizáveis. Substituições de itens só entram se forem formalmente aprovadas como requisito do piloto.
- Roteirização automática/otimização algorítmica; no piloto o agrupamento é manual por zona.
- Plantio preditivo, BI avançado, drones, push e SMS.
- Aplicativo nativo; a primeira entrega é web responsiva.

## 4. Roadmap por fases

### Fase 0 — Alinhamento e decisões de produto (1 semana)

**Objetivo:** remover ambiguidades antes da implementação.

**Entregáveis:**

- Definição da cidade-piloto, CEPs/zonas atendidas, dias e janelas de entrega.
- Definição do cutoff para assinatura, política de pausa/cancelamento, reembolso e confirmação de entrega.
- Catálogo inicial de papéis: consumidor, produtor e operações; administrador técnico pode ser uma permissão interna de operações.
- Tabela de regras de preço, taxa da plataforma, unidade de medida, limites de compra e disponibilidade.
- Decisão formal sobre substituição de itens de cesta fixa.
- Termos de uso, política de privacidade, base legal e fluxo de exclusão LGPD.
- Backlog limpo, removendo requisitos de pets/comunidades e marcando B2B/tickets como pós-MVP.

**Gate:** produto, operação e responsável financeiro aprovam o escopo do piloto e as regras de negócio.

### Fase 1 — Fundação técnica e design system (1–2 semanas)

**Objetivo:** transformar o scaffold em uma base sustentável.

**Entregáveis:**

- Monorepo ou estrutura organizada para `frontend`, `api`, `worker`, `packages/contracts` e infraestrutura.
- Next.js configurado com metadata AgriTech, idioma `pt-BR`, rotas públicas e internas e `manus-routes.json` sincronizado.
- Design system mobile-first: tipografia legível, alto contraste, estados de carregamento/erro/vazio, navegação por papel, componentes de formulário e feedback.
- Contratos compartilhados com DTOs, validação, paginação por cursor, erros estruturados e estados de domínio.
- NestJS com `/v1`, OpenAPI, configuração por ambiente, logger estruturado, health check e CORS allowlist.
- Prisma, migrações iniciais, PostgreSQL local/de desenvolvimento e estratégia de seed.
- CI com lint, typecheck, build e execução de testes.

**Gate:** frontend vazio não depende mais do starter; API sobe com documentação; migração e seed executam de forma reproduzível.

### Fase 2 — Modelo de domínio, identidade e segurança (2 semanas)

**Objetivo:** criar a base de usuários e autorização.

**Entregáveis:**

- Entidades: `User`, `Role`, `Producer`, `Address`, `ServiceZone`, `AuditLog` e sessões/tokens.
- Cadastro de consumidor e produtor, login, recuperação de senha e validação lógica de CPF.
- JWT/session com expiração após duas horas de inatividade, senha com hash, rotação/revogação e proteção contra enumeração de usuários.
- Guards de papel e políticas de acesso para consumidor, produtor e operações.
- Cadastro de endereço com CEP, geocodificação via adapter Mapbox e associação à zona de serviço.
- Fluxo de solicitação de exclusão de conta e registro de auditoria.
- Testes de CPF, autenticação, autorização, expiração e LGPD.

**Gate:** cada papel só acessa seus recursos; ações sensíveis deixam auditoria; dados de pagamento não são armazenados.

### Fase 3 — Catálogo e experiência pública/consumidor (2 semanas)

**Objetivo:** colocar a oferta real no ar antes de cobrar.

**Entregáveis:**

- Portal institucional alinhado ao wireframe: proposta de valor, como funciona, produtores, consumidores, impacto e ajuda.
- Catálogo de produtos e cestas fixas com filtros por zona/categoria, paginação/lazy loading e busca.
- Detalhe de produto/cesta com foto comprimida, origem, produtor, unidade, preço, sazonalidade, itens e disponibilidade.
- Painel básico do consumidor: perfil, endereços, pedidos e navegação para assinatura.
- Componentes acessíveis para teclado, leitor de tela, contraste e textos alternativos.
- Telemetria de carregamento do catálogo e teste do alvo de 1,5 s no p95 com dados representativos.

**Gate:** consumidor anônimo explora a vitrine; consumidor autenticado vê apenas ofertas válidas para sua zona e o catálogo permanece utilizável em conexão móvel limitada.

### Fase 4 — Carrinho, estoque e compra avulsa (2 semanas)

**Objetivo:** entregar a primeira transação completa sem recorrência.

**Entregáveis:**

- Entidades: `Cart`, `Order`, `OrderItem`, `InventoryAllocation`, `Payment`, `Delivery` e histórico de status.
- Adição/remoção de produto, quantidade mínima/máxima e validação de disponibilidade.
- Reserva de estoque atômica no fechamento, com idempotência e rollback em falha de pagamento.
- Escolha de endereço, zona e janela de entrega mantida pela operação.
- Checkout Mercado Pago para compra avulsa, retorno seguro e webhook reconciliável.
- Máquina de estados de pedido e notificações de confirmação.
- Testes de concorrência contra overselling, duplicidade de checkout e transições inválidas.

**Gate:** dois checkouts concorrentes nunca vendem estoque acima do disponível; pagamento duplicado não cria dois pedidos; pedido só é confirmado após evento confiável de pagamento.

### Fase 5 — Assinaturas de cestas fixas (2 semanas)

**Objetivo:** viabilizar a proposta central do MVP.

**Entregáveis:**

- Entidades `Basket`, `BasketItem`, `Subscription` e ciclos de assinatura.
- Planos semanal/mensal com preço fixo, cesta, janela e endereço elegíveis.
- Criação agendada de pedidos antes do cutoff, com reserva de estoque e idempotência por ciclo.
- Mercado Pago Subscriptions, sincronização de estado por webhook e tratamento de falhas de cobrança.
- Pausar, reativar e cancelar respeitando o cutoff; exibir próxima cobrança e próxima entrega.
- Dashboard de assinaturas, histórico e notificações por e-mail.
- Testes de ciclo, cutoff, pausa, cancelamento, cobrança repetida e estoque insuficiente.

**Gate:** um ciclo gerado duas vezes não duplica pedido nem reserva; consumidor consegue pausar/cancelar dentro da regra publicada; falhas de cobrança são visíveis para consumidor e operações.

### Fase 6 — Ferramentas do produtor e split financeiro (2 semanas)

**Objetivo:** fechar o circuito de oferta e repasse.

**Entregáveis:**

- Onboarding do produtor e pré-requisito de conta Mercado Pago conectada.
- CRUD de produtos, cestas fixas, fotos, certificações, preço, unidade e sazonalidade.
- Entrada de estoque/disponibilidade semanal, pausa de oferta e alertas de baixo estoque.
- Fila de colheita/separação com volumes confirmados, status e eventual impressão/exportação de etiquetas.
- Extrato de pedidos, taxa, valor líquido e status de repasse.
- Split 1:1 parametrizado por ambiente e feature flag até aprovação comercial de produção.
- Auditoria de alterações de preço, estoque, produto, status e repasse.

**Gate:** produtor publica uma oferta válida, altera disponibilidade sem produzir estoque negativo e consulta o valor líquido de cada venda; produção só habilita split após credenciais/aprovação.

### Fase 7 — Operações, entregas e suporte ao piloto (2 semanas)

**Objetivo:** permitir que uma pequena equipe opere a cidade-piloto.

**Entregáveis:**

- CRUD de zonas de serviço e calendário de slots.
- Visão consolidada de pedidos, ciclos, exceções, endereços e necessidades de coleta.
- Mapa Mapbox para visualização de endereços e agrupamento manual por zona/rota.
- Atribuição de rota, atualização de `preparing`, `in_transit` e `delivered`.
- Confirmação de entrega pelo consumidor e tratamento de exceções/reembolsos conforme política aprovada.
- Worker Redis para webhooks, e-mails, alertas, ciclos e atualizações assíncronas.
- Relatório/romaneio operacional diário com paginação e exportação simples.

**Gate:** operações consegue transformar pedidos confirmados em fila de coleta/entrega, acompanhar exceções e fechar uma rota sem editar diretamente o banco.

### Fase 8 — Qualidade, segurança, performance e lançamento controlado (2 semanas)

**Objetivo:** reduzir risco antes do piloto real.

**Entregáveis:**

- E2E dos fluxos: cadastro, compra avulsa, assinatura, pausa/cancelamento, produtor e operação.
- Testes de integração PostgreSQL com transações, webhooks duplicados/falhos, jobs e auditoria.
- Auditoria de acessibilidade, navegação por teclado, leitor de tela, contraste e responsividade.
- Teste de carga com 1.000 usuários simultâneos no cenário definido e catálogo p95 de 1,5 s.
- Verificação de HTTPS, CORS, cookies/sessões, headers, rate limiting, segredos, backups e restauração.
- Deploy do frontend na Vercel; API, worker e PostgreSQL/Redis no Render ou serviços equivalentes aprovados.
- Monitoramento de erros, logs, jobs atrasados, pagamentos e métricas de negócio.
- Seed de demonstração, runbook de operação e treinamento da equipe do piloto.

**Gate de lançamento:** checklist de go/no-go aprovado; pagamentos de teste reconciliam; rollback e restauração foram exercitados; suporte sabe tratar pedido, pagamento, estoque e entrega.

## 5. Arquitetura-alvo

```text
Next.js / Vercel
  ├─ portal institucional
  ├─ marketplace consumidor
  ├─ painel produtor
  └─ painel operações
          │ HTTPS / JSON /v1
          ▼
NestJS API / Render ───── OpenAPI + contratos TypeScript
  ├─ auth e autorização
  ├─ catálogo, carrinho e checkout
  ├─ assinaturas e pedidos
  ├─ inventário e fulfillment
  ├─ zonas, slots, rotas e entregas
  ├─ pagamentos e webhooks
  └─ auditoria e notificações
          │
          ├─ PostgreSQL + Prisma (fonte transacional)
          ├─ Redis (jobs e idempotência operacional)
          ├─ Mercado Pago (pagamento/recorrência/split)
          ├─ Mapbox (geocodificação/mapa)
          ├─ e-mail transacional
          └─ object storage (fotos/documentos)

Worker NestJS / Render
  ├─ ciclos de assinatura
  ├─ webhooks e reconciliação
  ├─ notificações
  ├─ alertas de inventário
  └─ atualizações assíncronas de entrega
```

## 6. Estrutura de código recomendada

```text
/
├── frontend/                 # Next.js App Router, UI e páginas por papel
├── apps/
│   ├── api/                  # NestJS REST API /v1
│   └── worker/               # Jobs assíncronos e consumidores Redis
├── packages/
│   ├── contracts/            # DTOs, schemas, enums e erros compartilhados
│   ├── domain/               # Regras puras: preço, cutoff, estoque, status
│   └── config/               # Configuração tipada e adapters por ambiente
├── prisma/                   # Schema, migrações e seeds
├── infra/                    # Render, Vercel, Redis, observabilidade e runbooks
├── docs/                     # OpenAPI, ADRs, LGPD e operação
└── tests/                    # Fixtures, integração e E2E
```

Se a equipe preferir manter `backend/` em vez de `apps/api`, deve preservar a mesma separação entre API, worker, contratos e domínio; a decisão deve ser tomada na Fase 1 para evitar migração posterior.

## 7. Dependências críticas e riscos

| Dependência/risco | Mitigação | Critério de desbloqueio |
|---|---|---|
| Aprovação comercial do Mercado Pago Split 1:1 | Implementar adapter e modo de simulação; bloquear split de produção por feature flag | Conta produtora onboarded e aprovação para produção |
| Definição da cidade-piloto e slots | Modelar zonas/slots configuráveis, sem hardcode | CEPs, dias, cutoff e capacidade aprovados |
| Ambiguidade entre B2C MVP e escopo B2B do README | Usar `PLAN.md` como fonte de verdade e manter B2B em roadmap posterior | Decisão registrada no backlog |
| Requisitos herdados de pets/comunidades | Remover da matriz AgriTech e não implementar | Backlog revisado |
| Estoque de perecíveis | Reserva transacional, cutoff e política de substituição/reembolso | Teste de concorrência aprovado |
| Dados pessoais e pagamentos | Não armazenar cartão; criptografar/segregar CPF; logs sem dados sensíveis | Revisão de segurança e LGPD concluída |
| Operação manual no piloto | Rotas por zona, calendário e runbook simples antes de otimização automática | Simulação de um dia de entrega concluída |
| Fotos/certificações e storage | Adapter de object storage, compressão client-side e limites de arquivo | Upload e leitura autorizada funcionando |

## 8. Indicadores do piloto

O lançamento deve acompanhar, no mínimo: conversão da vitrine para checkout; taxa de pagamento aprovado; pedidos confirmados por ciclo; taxa de entrega no slot; cancelamentos antes do cutoff; divergências de estoque; tempo de reconciliação de webhook; valor bruto, taxa e repasse líquido por produtor; percentual de ofertas pausadas por falta de estoque; chamados por pedido; tempo p95 do catálogo; falhas de jobs; e solicitações LGPD concluídas.

Não se deve prometer redução de perdas ou aumento de renda antes de estabelecer uma linha de base com os primeiros ciclos. O piloto deve medir esses impactos por produtor, cesta e período, com definições consistentes.

## 9. Decisões necessárias antes do primeiro sprint

1. Qual é o município e qual capacidade diária de entregas será suportada?
2. O MVP aceita somente cestas fixas e produtos avulsos, ou permitirá substituição de itens dentro da cesta?
3. Qual política vale para falta de estoque em uma assinatura: substituição, crédito, reembolso parcial ou cancelamento do ciclo?
4. Qual é a taxa da plataforma e quando ocorre o repasse ao produtor?
5. Mercado Pago será o único meio de pagamento no piloto, ou PIX manual também será aceito?
6. Quem é o responsável operacional por aprovar produtores, produtos, certificações e reembolsos?
7. Quais dados são obrigatórios para o onboarding do produtor e qual periodicidade de renovação das certificações?
8. Qual nível de acessibilidade e quais navegadores/dispositivos serão usados como matriz oficial de suporte?

## 10. Definição de pronto do MVP

O MVP só deve ser considerado pronto quando houver um fluxo demonstrável de ponta a ponta — produtor aprovado publica oferta, consumidor compra ou assina, estoque é reservado, pagamento é reconciliado, operação prepara e despacha, consumidor confirma entrega e produtor visualiza o repasse — com auditoria, tratamento de falha, testes automatizados dos caminhos críticos, documentação operacional e capacidade de restaurar a base de dados.

A expansão para B2B, tickets de proposta, inteligência de plantio e drones deve acontecer somente depois que o piloto comprovar liquidez de oferta/demanda, confiabilidade operacional e qualidade dos dados transacionais.

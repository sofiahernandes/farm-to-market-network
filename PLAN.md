# AgriTech MVP — Plano de implementação

**Status:** slice vertical real de consumidor implementado; restante do MVP operacional ainda aberto
**Data-base:** 28/10/2026
**Fontes de verdade:** `PLAN.md` e `ROADMAP.md`
**Contexto:** marketplace B2C para uma cidade-piloto, com consumidor, produtor e operações.

## 1. Direção do produto

O MVP será uma aplicação web responsiva, em português do Brasil, para vender produtos avulsos e cestas fixas de preço definido, com assinatura semanal ou mensal. O slice vertical entregue nesta etapa é real e cobre cadastro, login, catálogo persistido, carrinho, checkout idempotente, reserva de estoque e pedidos. O fluxo completo alvo é: produtor aprovado publica oferta; consumidor cria conta, escolhe endereço e janela, compra ou assina; estoque é reservado de forma atômica; Mercado Pago confirma o pagamento por webhook idempotente; operações prepara e despacha; consumidor confirma a entrega; produtor consulta o repasse.

`PLAN.md` prevalece sobre o README e sobre requisitos herdados da matriz. O README descreve B2B, cestas customizáveis, tickets, BI e roteirização automática; esses itens não entram nesta versão. O README também identifica o pacote como `amigo-do-bairro`; isso deve ser corrigido na fundação para a identidade AgriTech, sem assumir que qualquer integração externa esteja configurada.

## 2. Diagnóstico do scaffold e estado atual

- Existe um starter Next.js com App Router, React, TypeScript e Tailwind em `frontend/`.
- `frontend/package.json` ainda usa o nome `amigo-do-bairro` e contém apenas dependências de frontend do starter.
- A página inicial padrão foi substituída por landing e fluxo de consumidor real: catálogo, detalhe, carrinho, checkout e pedidos; as telas de assinaturas/produtor/operações foram removidas até existir backend correspondente.
- `backend/` contém NestJS/TypeScript com prefixo `/v1`, Prisma + SQLite sandbox, autenticação JWT, catálogo, carrinho, checkout transacional, reserva de estoque, auditoria e seed.
- Mercado Pago, PostgreSQL de produção, Mapbox, Redis, armazenamento de imagens, worker, OpenAPI e testes E2E ainda não estão conectados.
- Os artefatos de requisitos (`Levantamento de Requisitos.xlsx`, sitemap, wireframe e UML) são insumos de descoberta, não evidência de funcionalidades já implementadas.

## 3. Decisões de arquitetura

### 3.1 Topologia

Adotar a separação recomendada no roadmap:

```text
/
├── frontend/                 # Next.js App Router, UI e páginas por papel
├── apps/
│   ├── api/                  # NestJS REST API versionada em /v1
│   └── worker/               # Worker NestJS para jobs Redis
├── packages/
│   ├── contracts/            # DTOs, schemas, enums e erros compartilhados
│   ├── domain/               # Regras puras e testáveis
│   └── config/               # Configuração tipada e adapters por ambiente
├── prisma/                   # schema.prisma, migrações e seeds
├── infra/                    # deploy, observabilidade, backup e runbooks
├── docs/                     # OpenAPI, ADRs, LGPD e operação
└── tests/                    # fixtures, integração e E2E
```

A decisão padrão é migrar o conteúdo futuro de `backend/` para `apps/api/`, mantendo `backend/` intacto até a Fase 1 para não apagar mudanças existentes. Se a equipe optar por manter `backend/`, ele deverá preservar a mesma separação API/worker/domínio/contratos e registrar uma ADR antes do primeiro sprint.

### 3.2 Frontend

- Next.js App Router, TypeScript e Tailwind; `pt-BR` como idioma e metadados AgriTech.
- Rotas públicas para landing, catálogo e detalhe; rotas protegidas separadas por consumidor, produtor e operações.
- UI mobile-first, alto contraste, tipografia legível, estados de carregamento/erro/vazio, feedback de validação e navegação por teclado/leitor de tela.
- O frontend nunca recebe segredos de provedores. Comunicação de domínio ocorre pela API REST `/v1`.
- Catálogo usa paginação por cursor ou carregamento incremental; imagens são comprimidas no cliente antes do upload.

### 3.3 API e domínio

- NestJS REST JSON versionado em `/v1`, OpenAPI, logger estruturado, health check, validação de DTOs e erros estruturados.
- Pacote `contracts` compartilhado pelo frontend e backend com DTOs, enums de estados e schemas de validação.
- Pacote `domain` concentra preço, limites, elegibilidade de cutoff, reserva/liberação de estoque, máquina de estados e cálculo de taxa.
- Autorização por papel: consumidor, produtor e operações; administrador técnico é uma permissão interna de operações, não um quarto produto.
- Sessão/JWT com expiração após duas horas de inatividade, hash de senha, rotação/revogação, proteção contra enumeração e rate limiting.

### 3.4 Dados e consistência

Entidades iniciais: `User`, `Role`, `Producer`, `Address`, `ServiceZone`, `DeliverySlot`, `Product`, `Basket`, `BasketItem`, `InventoryAllocation`, `Cart`, `Order`, `OrderItem`, `Subscription`, `SubscriptionCycle`, `Delivery`, `Route`, `Payment`, `Payout`, `Notification` e `AuditLog`.

PostgreSQL é a fonte transacional e Prisma gerencia schema/migrações. Fechamento de pedido e geração de ciclo usam transação ACID, bloqueio/atualização condicional de estoque, chave de idempotência e rollback quando o pagamento não é confirmado. `AuditLog` é append-only/imutável no domínio, com timestamp, ator, recurso, ação, correlation ID e payload minimizado, sem dados de cartão.

### 3.5 Provedores e adapters

Criar interfaces e implementações por ambiente para Mercado Pago, Mapbox, e-mail, object storage, Redis e PostgreSQL. O ambiente local deve possuir adapters fake/sandbox e seeds; nenhuma credencial real deve ser adicionada ao repositório.

- **Mercado Pago:** checkout avulso, recorrência, webhooks, idempotência e split 1:1 condicionado à aprovação comercial e feature flag. Nunca persistir dados brutos de cartão.
- **Mapbox:** geocodificação de endereço e mapa operacional; agrupamento de rota continua manual por zona.
- **Redis:** fila para ciclos de assinatura, webhooks/reconciliação, notificações, alertas de estoque e atualizações de entrega.
- **E-mail:** primeiro canal transacional. Push e SMS ficam atrás da interface de notificação e fora do MVP.
- **Object storage:** fotos/certificações com compressão, limite de tamanho, acesso autorizado e URLs temporárias quando aplicável.

## 4. Dependências técnicas previstas

As dependências serão adicionadas somente durante a implementação e fixadas por lockfile. O conjunto esperado inclui:

- Frontend: Next.js, React, TypeScript, Tailwind, cliente HTTP/cache, biblioteca de formulários e validação, testes de componentes e Playwright.
- API/worker: NestJS, validação/configuração, Swagger/OpenAPI, Prisma Client, cliente PostgreSQL, Redis/BullMQ ou equivalente aprovado, JWT/sessões e logger.
- Compartilhado: TypeScript, schemas/DTOs, enums de domínio e utilitários de erro/paginação.
- Qualidade: ESLint, formatter, typecheck, Vitest/Jest, Supertest, Playwright e ferramenta de teste de carga aprovada.
- Integrações: SDK/adapters oficiais ou HTTP clients para Mercado Pago, Mapbox, e-mail e object storage, isolados em `packages/config`/módulos de infraestrutura.

A escolha final de bibliotecas deve ser registrada na ADR de fundação e não pode introduzir dependência que exija credenciais reais para rodar testes locais.

## 5. Milestones e gates

### Fase 0 — Alinhamento (1 semana)

Definir município, CEPs/zonas, capacidade diária, slots, cutoff, pausa/cancelamento, falta de estoque, reembolso, confirmação de entrega, taxa e repasse, meios de pagamento, aprovação de produtores, certificações, suporte e matriz oficial de navegadores/dispositivos. Revisar a matriz removendo pets/comunidades e marcar B2B/tickets como pós-MVP.

**Gate:** produto, operações e financeiro aprovam as regras do piloto.

### Fase 1 — Fundação e design system (1–2 semanas)

Organizar estrutura de apps/packages, renomear identidade do starter, configurar rotas, design system, contratos, API `/v1`, OpenAPI, configuração por ambiente, health check, Prisma, migração/seed e CI de lint/typecheck/build/testes.

**Gate:** frontend não é mais starter; API documenta e sobe; seed e migração são reproduzíveis.

### Fase 2 — Domínio, identidade e segurança (2 semanas)

Implementar usuários/papéis, cadastro consumidor/produtor, login, recuperação, CPF, endereços, zonas, Mapbox adapter, sessões, guards, LGPD e auditoria.

**Gate:** isolamento por papel, ações sensíveis auditadas, sem armazenamento de cartão e testes de segurança básicos aprovados.

### Fase 3 — Catálogo e experiência pública (2 semanas)

Landing, catálogo paginado de produtos/cestas, filtros, detalhe, fotos, disponibilidade, perfil/endereço/pedidos básicos e acessibilidade/performance.

**Gate:** visitante explora; usuário vê ofertas elegíveis para sua zona; catálogo alcança p95 de 1,5 s com dados representativos.

### Fase 4 — Carrinho, estoque e compra avulsa (2 semanas)

Carrinho, limites, endereço/slot, reserva atômica, pedido, entrega, checkout Mercado Pago, webhook idempotente, estados e notificações.

**Gate:** concorrência não gera overselling; duplicidade não cria pedido; confirmação depende de evento confiável de pagamento.

### Fase 5 — Assinaturas (2 semanas)

Cestas fixas, planos semanal/mensal, ciclos, cutoff, criação antecipada, reserva, Mercado Pago recorrente, pausa/reativação/cancelamento e falhas de cobrança.

**Gate:** ciclo é idempotente; regras são exibidas; estoque insuficiente e falha de cobrança são visíveis.

### Fase 6 — Produtor e repasse (2 semanas)

Onboarding, produtos/cestas, fotos/certificações, disponibilidade semanal, pausa de oferta, fila de fulfillment, extrato e split feature-flagged.

**Gate:** produtor publica oferta válida, não cria estoque negativo e vê valor líquido; split produtivo só após aprovação.

### Fase 7 — Operações e entregas (2 semanas)

Zonas/slots, visão de pedidos/exceções, mapa, rotas manuais, status, confirmação, romaneio/exportação simples e worker Redis.

**Gate:** operações fecha uma rota sem editar banco diretamente e trata exceções pelo produto/runbook.

### Fase 8 — Hardening e lançamento (2 semanas)

E2E, integração, carga, acessibilidade, segurança, backups/restauração, deploy, monitoramento, seed de demonstração, runbook, treinamento e checklist go/no-go.

**Gate de lançamento:** fluxo ponta a ponta demonstrável, pagamentos de teste reconciliados, rollback/restauração exercitados e equipe treinada.

## 6. Regras de escopo

### Incluído

Cadastro/login/recuperação com CPF; papéis consumidor/produtor/operações; catálogo de produtos e cestas fixas; compra avulsa; assinatura semanal/mensal; endereço, zona e slot; estoque atômico; Mercado Pago condicionado a sandbox/aprovação; painel de produtor; operação manual por zona; status `pending_payment → confirmed → preparing → in_transit → delivered`; e-mail; Redis jobs; auditoria; LGPD; OpenAPI; testes; deploy planejado.

### Explicitamente fora

B2B/atacado/MOQ corporativo; tickets de proposta e negociação; cesta totalmente customizável e substituição de itens salvo aprovação formal; roteirização automática; plantio preditivo/BI avançado; drones; push/SMS; aplicativo nativo; promessa de redução de perdas ou aumento de renda sem baseline.

Requisitos da planilha sobre pets, comunidades, códigos de comunidade, prontuários, histórico de saúde, animais e autenticação social Google não serão implementados. Requisitos de cartão/PIX só valem dentro do contrato aprovado do Mercado Pago; PIX manual não é assumido.

## 7. Critérios de aceite transversais

1. Regras críticas possuem testes unitários e integração; concorrência de estoque e webhooks duplicados são casos obrigatórios.
2. Cada endpoint protegido valida autenticação, papel, escopo do recurso, payload e erros estruturados.
3. Toda mudança financeira, de estoque, status, oferta e repasse gera auditoria sem segredos ou dados de cartão.
4. Nenhuma integração é declarada ativa sem configuração de ambiente, credenciais de sandbox e teste de contrato; sem isso, usa-se adapter fake e estado explícito de indisponibilidade.
5. Aplicação é responsiva, acessível por teclado/leitor de tela, tem alt text, contraste adequado e feedback de erro/sucesso.
6. Catálogo usa paginação/lazy loading, imagens comprimidas e mede p95 de 1,5 s; mapa atende o limite aprovado de 10 s em 4G.
7. Deploy mantém HTTPS, CORS allowlist, segredos fora do frontend, backups e procedimento de restauração testado.
8. O slice vertical já possui implementação; este arquivo e `TODO.md` mantêm o planejamento do restante do MVP e seus critérios de produção.

## 8. Indicadores do piloto

Acompanhar conversão vitrine→checkout, aprovação de pagamento, pedidos confirmados por ciclo, entrega no slot, cancelamentos antes do cutoff, divergências de estoque, tempo de reconciliação de webhook, bruto/taxa/líquido por produtor, ofertas pausadas por falta de estoque, chamados por pedido, p95 do catálogo, falhas de jobs e solicitações LGPD concluídas. Impactos de desperdício e renda só podem ser comunicados após linha de base consistente.

## 9. Riscos e desbloqueios

| Risco                           | Mitigação                                                  | Desbloqueio                               |
| ------------------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| Split Mercado Pago não aprovado | Adapter sandbox e feature flag desligada                   | Conta conectada e aprovação comercial     |
| Cidade/slots indefinidos        | Modelo configurável, sem hardcode                          | CEPs, dias, cutoff e capacidade aprovados |
| README conflita com B2C         | `PLAN.md` como fonte de verdade e ADR                      | Backlog revisado                          |
| Requisitos herdados             | Excluir pets/comunidades e registrar decisão               | Revisão de requisitos concluída           |
| Perecíveis/overselling          | Transação, cutoff, política de falta e testes concorrentes | Teste de concorrência aprovado            |
| Dados pessoais/pagamento        | Minimização, criptografia/segregação, logs redigidos       | Revisão LGPD/segurança                    |
| Operação manual                 | Zonas, slots e runbook antes de otimização                 | Simulação de dia de entrega               |
| Fotos/certificados              | Adapter de storage, compressão e limites                   | Upload autorizado funcionando             |

## 10. Decisões abertas antes do primeiro sprint

Município e capacidade; substituição de itens; política de falta de estoque; taxa e momento do repasse; Mercado Pago e meios de pagamento; responsável por aprovar produtores/produtos/certificações/reembolsos; dados e renovação de certificações; navegadores/dispositivos oficiais; e decisão final sobre `apps/api` versus preservação de `backend/` como diretório da API.

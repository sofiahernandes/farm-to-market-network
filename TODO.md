# AgriTech MVP — TODO de outcomes

**Escopo:** B2C, uma cidade-piloto, consumidor/produtor/operações.  
**Fonte de verdade:** `PLAN.md` e `ROADMAP.md`.  
**Legenda:** `[ ]` aberto; `[x]` já constatado no diagnóstico; `[?]` depende de decisão; `[fora]` explicitamente fora do MVP.

## 0. Alinhamento e governança

- [ ] Aprovar município da cidade-piloto, CEPs, zonas, capacidade diária e dias de entrega.
- [ ] Aprovar calendário de slots, capacidade por slot e cutoff de compra/assinatura.
- [ ] Definir política para pausa, cancelamento, reembolso e confirmação de entrega.
- [ ] Definir política de falta de estoque em ciclo: substituição, crédito, reembolso parcial ou cancelamento.
- [ ] Definir taxa da plataforma, momento e regras de repasse ao produtor.
- [ ] Confirmar Mercado Pago como gateway do piloto e quais meios estarão habilitados; não assumir PIX manual.
- [ ] Definir responsável por aprovar produtores, produtos, certificações e reembolsos.
- [ ] Definir dados obrigatórios do produtor e validade/renovação de certificações.
- [ ] Aprovar navegadores, dispositivos e nível de acessibilidade da matriz oficial.
- [x] Registrar `PLAN.md` como fonte de verdade sobre README e requisitos conflitantes.
- [x] Remover do backlog mental requisitos herdados de pets, comunidades, códigos de comunidade e prontuários.

## 1. Fundação técnica

- [x] Confirmar scaffold atual: Next.js App Router + React + TypeScript + Tailwind em `frontend/`.
- [x] Substituir o placeholder por uma fundação NestJS/Prisma transacional para o slice consumidor, usando SQLite sandbox e adapter de pagamento fake.
- [ ] Escolher e registrar ADR para `apps/api` versus manutenção de `backend/`, preservando separação API/worker.
- [ ] Organizar `frontend/`, `apps/api/`, `apps/worker/`, `packages/contracts/`, `packages/domain/`, `packages/config/`, `prisma/`, `infra/`, `docs/` e `tests/`.
- [x] Corrigir nome/metadata do starter para AgriTech, registrar logo e remover conteúdo default das telas entregues.
- [ ] Configurar workspace, TypeScript, lint, formatter, typecheck, build e execução de testes no CI.
- [x] Configurar variáveis por ambiente, CORS sandbox e garantir que segredos não sejam enviados ao frontend.
- [x] Criar health check, correlation ID e CORS allowlist; logger estruturado permanece como hardening futuro.
- [x] Expor API REST JSON em `/v1` com erros estruturados; [ ] publicar especificação OpenAPI.
- [ ] Criar contratos compartilhados com DTOs, schemas, enums, paginação por cursor e erros.
- [ ] Criar pacote de domínio para preço, limites, cutoff, estoque e máquina de estados.
- [x] Definir adapters fake/sandbox para pagamento e banco do slice; [ ] conectar Mapbox, e-mail, storage e Redis.

## 2. Domínio, identidade e LGPD

- [ ] Criar entidades e migrações para usuário, papel, produtor, endereço, zona de serviço e auditoria.
- [x] Implementar cadastro de consumidor com CPF validado logicamente; [ ] implementar cadastro de produtor.
- [x] Implementar login de consumidor com hash bcrypt e JWT; [ ] implementar logout, recuperação, rotação/revogação e proteção contra enumeração.
- [x] Implementar sessão JWT com expiração de duas horas no sandbox; [ ] adicionar inatividade deslizante e revogação.
- [ ] Implementar guards e policies para consumidor, produtor e operações.
- [ ] Implementar endereço com CEP, geocodificação via adapter Mapbox e associação à zona.
- [ ] Implementar solicitação rastreável de exclusão de dados conforme LGPD.
- [x] Garantir CPF armazenado como hash e ausência de dados brutos de cartão no slice.
- [ ] Tornar `AuditLog` append-only, com ator, ação, recurso, timestamp e correlation ID.
- [ ] Testar CPF, autenticação, autorização, expiração, exclusão e auditoria.

## 3. Portal e catálogo

- [x] Criar landing institucional em pt-BR com proposta de valor, como funciona, ajuda e entrada para ofertas.
- [x] Criar catálogo público de ofertas persistidas; [ ] completar catálogo de cestas fixas.
- [x] Implementar filtros por categoria e busca contra a API; [ ] adicionar filtro por zona e paginação/lazy loading.
- [ ] Criar detalhe com foto, origem, produtor, unidade, preço, sazonalidade, itens e disponibilidade.
- [ ] Implementar compressão client-side, limites e acesso autorizado a fotos/certificações.
- [x] Criar área do consumidor, endereço no checkout e histórico/detalhe de pedidos; [ ] adicionar assinaturas.
- [x] Implementar estados de loading, vazio, erro, sucesso e validação de formulários do slice.
- [ ] Validar teclado, leitor de tela, alt text, contraste e layout mobile-first.
- [ ] Instrumentar p95 do catálogo e validar alvo de 1,5 s com dados representativos.

## 4. Carrinho, estoque e compra avulsa

- [x] Criar e usar `Cart`, `Order`, `OrderItem`, `InventoryAllocation`, `Payment`, `Delivery` e histórico de status.
- [x] Implementar adicionar/remover itens persistidos; [ ] adicionar limites mínimo/máximo configuráveis.
- [ ] Validar disponibilidade por produto, cesta, zona e slot.
- [x] Reservar estoque atomicamente no fechamento e reverter a transação em falha; [ ] implementar liberação por expiração de pagamento.
- [x] Usar chave de idempotência no checkout; [ ] implementar idempotência de webhook real.
- [x] Implementar escolha de endereço e slot seed mantido pelo backend; [ ] painel de operações para manutenção.
- [x] Integrar checkout ao adapter `fake-sandbox`, sem credenciais reais; [ ] conectar Mercado Pago por adapter de ambiente.
- [ ] Processar webhooks com assinatura/validação disponível, deduplicação e reconciliação.
- [ ] Implementar estados `pending_payment`, `confirmed`, `preparing`, `in_transit`, `delivered`.
- [ ] Enviar notificação de confirmação por e-mail via interface.
- [ ] Testar concorrência contra overselling, checkout duplicado, rollback e transições inválidas.

## 5. Assinaturas de cestas fixas

- [ ] Criar `Basket`, `BasketItem`, `Subscription` e `SubscriptionCycle`.
- [ ] Implementar planos semanal/mensal, preço fixo, cesta, endereço e janela elegíveis.
- [ ] Agendar criação de ciclos antes do cutoff configurado.
- [ ] Reservar estoque por ciclo com idempotência e política aprovada para insuficiência.
- [ ] Integrar recorrência Mercado Pago via adapter e reconciliar estado por webhook.
- [ ] Implementar pausa, reativação e cancelamento respeitando cutoff.
- [ ] Exibir próxima cobrança, próxima entrega, status e histórico.
- [ ] Criar jobs Redis para ciclo, cobrança, falha e notificações.
- [ ] Testar ciclo duplicado, cutoff, pausa/cancelamento, cobrança repetida e estoque insuficiente.

## 6. Ferramentas do produtor

- [ ] Implementar onboarding e aprovação de produtor.
- [ ] Exigir conta Mercado Pago conectada antes de habilitar venda/repasse produtivo.
- [ ] Implementar CRUD de produtos e cestas fixas com foto, certificação, preço, unidade e sazonalidade.
- [ ] Implementar estoque/disponibilidade semanal e pausa de oferta.
- [ ] Alertar baixo estoque por job assíncrono.
- [ ] Criar fila de colheita/separação com volumes e status confirmados.
- [ ] Implementar extrato por pedido com bruto, taxa, líquido e status de repasse.
- [ ] Implementar split 1:1 apenas com feature flag e aprovação comercial de produção.
- [ ] Auditar alterações de preço, estoque, oferta, status e repasse.
- [ ] Testar publicação válida, estoque não negativo, fila e cálculo líquido.

## 7. Operações, entregas e suporte

- [ ] Implementar CRUD de zonas de serviço.
- [ ] Implementar calendário de slots e capacidade.
- [ ] Criar visão consolidada de pedidos, ciclos, exceções, endereços e coleta.
- [ ] Integrar mapa Mapbox para visualização/geocodificação; medir limite aprovado de carregamento.
- [ ] Permitir agrupamento manual por zona/rota e atribuição de rota.
- [ ] Permitir atualização operacional para `preparing`, `in_transit` e `delivered`.
- [ ] Permitir confirmação de entrega pelo consumidor.
- [ ] Implementar tratamento de exceções/reembolsos conforme política aprovada.
- [ ] Criar worker Redis para webhooks, e-mails, ciclos, alertas e atualizações.
- [ ] Gerar romaneio/relatório operacional diário paginado e exportação simples.
- [ ] Criar runbook de um dia de entrega e impedir edição direta do banco pela operação.

## 8. Qualidade, segurança e lançamento

- [ ] Cobrir regras puras com testes unitários: preço, cutoff, CPF, estoque, permissões e estados.
- [ ] Cobrir API com integração PostgreSQL, autorização, transações, auditoria, jobs e adapters.
- [ ] Criar E2E para cadastro, compra avulsa, assinatura, pausa/cancelamento, produtor e operação.
- [ ] Testar webhooks duplicados, falhos e fora de ordem.
- [ ] Executar auditoria de acessibilidade, responsividade e suporte a navegadores/dispositivos aprovados.
- [ ] Executar teste de carga com 1.000 usuários simultâneos no cenário definido.
- [ ] Validar p95 de catálogo em 1,5 s e relatório/romaneio de até 10.000 itens em menos de 5 s, se esse requisito for mantido pelo piloto.
- [ ] Revisar HTTPS, CORS, cookies/sessões, headers, rate limiting, logs e segredos.
- [ ] Configurar backups automáticos e exercitar restauração antes do go/no-go.
- [ ] Preparar deploy do frontend na Vercel e API/worker/banco/Redis no Render ou equivalente aprovado.
- [ ] Configurar monitoramento de erros, jobs atrasados, pagamentos e métricas do piloto.
- [ ] Preparar seed de demonstração, documentação OpenAPI, runbook e treinamento.
- [ ] Aprovar checklist de lançamento e rollback.

## 9. Fora do MVP — não implementar

- [fora] Catálogo, checkout e regras B2B/atacado, MOQ corporativo, boleto corporativo e conta empresarial.
- [fora] Tickets de proposta, negociação de preço, aceite/recusa, mensagem de ticket e conversão de ticket em carrinho.
- [fora] Cestas totalmente customizáveis e substituição de itens, salvo decisão formal futura do piloto.
- [fora] Roteirização automática/otimização algorítmica; usar agrupamento manual por zona.
- [fora] Plantio preditivo, BI avançado, alertas preditivos e drones.
- [fora] Push, SMS e aplicativo nativo.
- [fora] Requisitos herdados de pets, comunidades, códigos alfanuméricos de comunidade, prontuários, saúde animal e histórico de animais.
- [fora] Login social Google, salvo decisão posterior explicitamente aprovada.

## 10. Abertos e bloqueadores de aceite

- [?] Município, zonas, capacidade, slots e cutoff não definidos.
- [?] Política de falta de estoque/substituição/reembolso não definida.
- [?] Taxa, momento do repasse e aprovação do split Mercado Pago não definidos.
- [?] Meios de pagamento efetivos do piloto não confirmados.
- [?] Responsáveis por aprovação de produtores, ofertas, certificações e reembolsos não nomeados.
- [?] Dados/validade de certificações e matriz de suporte não definidos.
- [x] Escolha final `backend/` registrada em `backend/ADR-001-backend-location.md`; worker permanece como separação futura.
- [?] Credenciais e contas externas não configuradas; até configuração explícita, usar somente fake/sandbox e não alegar integração ativa.
- [x] O slice vertical real está entregue: frontend conectado ao backend, persistência Prisma/SQLite, autenticação JWT, catálogo, carrinho, checkout idempotente, reserva de estoque e pedidos.
- [ ] Integrar PostgreSQL/Mercado Pago e concluir produtor, operações, assinaturas, worker, integrações externas e testes E2E de produção.

## 11. Definição de pronto

O MVP só sai do backlog quando o fluxo ponta a ponta funciona em ambiente aprovado, com estoque atômico, pagamento de teste reconciliado, ciclo idempotente, operação manual, confirmação de entrega, repasse visível, auditoria, falhas tratadas, testes automatizados, documentação operacional e restauração de backup exercitada.

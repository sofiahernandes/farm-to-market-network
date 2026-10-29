# AgriTech MVP — Especificação de UX/UI

**Status:** referência de design para implementação frontend  
**Idioma da interface:** português do Brasil (`pt-BR`)  
**Escopo:** B2C em uma cidade-piloto, com consumidor, produtor e operações  
**Fontes:** `PLAN.md`, `ROADMAP.md`, `plan.md`, `TODO.md`, `README.md`, sitemap, wireframe e requisitos legados revisados em 28/10/2026.

> Este documento define experiência, arquitetura de informação e critérios visuais. Não representa funcionalidades já implementadas nem confirma integrações externas. Até que existam configuração, credenciais de sandbox e teste de contrato, Mercado Pago, Mapbox, e-mail e demais provedores devem aparecer como estados de ambiente não configurado/fake, nunca como integração ativa.

## 1. Princípios de experiência

1. **Do campo à porta, sem ambiguidade:** em cada etapa, a pessoa deve saber o que está comprando, de quem vem, quanto custa, qual janela escolheu e qual é o próximo passo.
2. **Oferta honesta:** preço, unidade, itens da cesta, disponibilidade, prazo de cutoff e taxa devem estar visíveis antes da confirmação.
3. **Operável ao ar livre:** alto contraste, tipografia grande, alvos de toque amplos e leitura rápida para produtor e operação sob luz solar direta.
4. **Progressive disclosure:** mostrar primeiro a decisão essencial; detalhes de auditoria, histórico, repasse e exceções ficam acessíveis sem poluir a tarefa principal.
5. **Recuperação antes de punição:** erros de estoque, pagamento, endereço ou conexão explicam o problema e oferecem uma ação segura, sem apagar dados preenchidos.
6. **Estado é conteúdo:** pedido, assinatura, oferta e pagamento sempre exibem estado, última atualização e ação possível.
7. **Privacidade por padrão:** não exibir CPF completo, dados de cartão ou informações pessoais desnecessárias; solicitar exclusão de conta por fluxo rastreável.
8. **Não prometer o que está fora do MVP:** não usar telas, links ou copy de atacado/B2B, tickets de proposta, cesta customizável, BI avançado, plantio preditivo, drones, push ou SMS.

## 2. Arquitetura de informação

### 2.1 Camadas do produto

- **Público (`/`):** explica a proposta, mostra como funciona, apresenta produtores/ofertas e encaminha para explorar, criar conta ou vender.
- **Consumidor (`/app`):** descobre produtos e cestas fixas, monta carrinho, escolhe endereço e janela, paga, acompanha pedidos e gerencia assinaturas.
- **Produtor (`/produtor`):** conclui onboarding/aprovação, publica produtos e cestas fixas, informa estoque/disponibilidade, atende pedidos e consulta repasses.
- **Operações (`/admin`):** configura zonas e slots, consolida pedidos, trata exceções, agrupa manualmente por zona/rota, atualiza entregas e exporta romaneio.

Administrador técnico não é uma experiência separada: é uma permissão interna dentro de Operações.

### 2.2 Rotas do MVP

| Rota | Acesso | Objetivo e conteúdo mínimo |
|---|---|---|
| `/` | Público | Hero, proposta “Do campo à porta”, como funciona, produtores/ofertas, chamada para consumidor e produtor, ajuda, termos e privacidade. |
| `/catalogo` | Público; zona pode ser solicitada | Lista paginada de produtos e cestas fixas, busca, categoria, zona e disponibilidade. Visitante pode explorar; ação de comprar pede login. |
| `/produto/[id]` | Público | Foto, nome, produtor/origem, unidade, preço, sazonalidade, itens (se cesta), disponibilidade, zona e CTA. |
| `/cestas` | Público/consumidor | Cestas fixas com preço e frequência elegível; não oferecer construtor livre ou substituição sem decisão formal do piloto. |
| `/entrar` | Público | Login por CPF e senha, recuperação de senha e link para cadastro. Mensagem de erro não revela se CPF existe. |
| `/criar-conta` | Público | Escolha Consumidor ou Produtor e formulário correspondente. Não oferecer login Google. |
| `/app` | Consumidor | Início/explorar com resumo do carrinho, próxima entrega/assinatura e atalhos para catálogo, cestas e pedidos. |
| `/app/carrinho` | Consumidor | Itens, quantidades dentro de limites, estoque, subtotal, taxa quando definida e CTA para checkout. |
| `/app/checkout` | Consumidor | Endereço, zona elegível, janela disponível, resumo, pagamento via adapter/checkout Mercado Pago e confirmação. |
| `/app/assinaturas` | Consumidor | Assinaturas ativas/inativas, próxima cobrança, próxima entrega, plano, endereço/janela, pausar, reativar e cancelar conforme cutoff. |
| `/app/pedidos` | Consumidor | Histórico e detalhes com linha do tempo `Pagamento pendente → Confirmado → Em preparação → A caminho → Entregue`. |
| `/app/pedidos/[id]` | Consumidor | Status, itens, valor, endereço resumido, janela, última atualização e confirmar entrega quando elegível. |
| `/app/conta` | Consumidor | Perfil, endereços, dados de pagamento apresentados pelo provedor sem armazenar cartão, privacidade e solicitação LGPD. |
| `/produtor` | Produtor aprovado ou em onboarding | Painel com vendas, pedidos a atender, disponibilidade e alertas de estoque/oferta. |
| `/produtor/onboarding` | Produtor | Dados da propriedade, contato, documentos/certificações exigidos e status “Em análise/Aprovado/Pendência”. |
| `/produtor/catalogo` | Produtor | Produtos e cestas fixas, publicar/editar/pausar oferta, foto, unidade, preço, sazonalidade e certificação. |
| `/produtor/catalogo/novo` | Produtor | Cadastro guiado de oferta com pré-visualização e validações. |
| `/produtor/estoque` | Produtor | Disponibilidade semanal, quantidades, limites e alertas; nunca permitir saldo negativo. |
| `/produtor/pedidos` | Produtor | Fila de separação/colheita com pedidos confirmados, volumes, janela e status operacional. |
| `/produtor/financeiro` | Produtor | Extrato por pedido/ciclo: bruto, taxa, líquido, status e data prevista do repasse. Split só se aprovado e configurado; caso contrário, mostrar estado explícito. |
| `/produtor/conta` | Produtor | Perfil, propriedade, certificações, documentos e segurança. |
| `/admin` | Operações | Visão geral: pedidos do dia, entregas, exceções, capacidade por slot e alertas acionáveis. |
| `/admin/pedidos` | Operações | Filtros, consolidação de pedidos/ciclos, exceções, reembolsos conforme política e detalhe operacional. |
| `/admin/zonas-slots` | Operações | Zonas de serviço, CEPs, capacidade, dias, janelas e cutoff. |
| `/admin/rotas` | Operações | Mapa/endereços e agrupamento manual por zona/rota; o mapa não deve sugerir roteirização automática. |
| `/admin/entregas` | Operações | Atualizar `preparing`, `in_transit`, `delivered`, acompanhar confirmação do consumidor e exceções. |
| `/admin/romaneio` | Operações | Relatório diário paginado e exportação simples. |

Rotas fora do MVP não devem existir no menu nem como placeholders: `/atacado`, `/tickets`, `/bi`, `/plantio-preditivo`, `/drones` e `/cesta-customizada`.

## 3. Navegação por papel

### 3.1 Cabeçalho público

Desktop: marca AgriTech à esquerda; links “Como funciona”, “Para produtores”, “Para consumidores”, “Ajuda”; ações “Entrar” e “Criar conta”. CTA primário “Explorar ofertas”. Mobile: marca, botão de menu acessível e CTA “Entrar”; menu em drawer com foco preso.

Rodapé: “Como funciona”, “Ajuda e contato”, “Termos de uso”, “Privacidade e LGPD”. Não publicar métricas de impacto como fato medido sem baseline; quando usadas, rotular como proposta/medição do piloto.

### 3.2 Consumidor

Desktop: cabeçalho com “Explorar”, “Cestas”, “Assinaturas”, “Pedidos”, contador de carrinho e “Conta”. Mobile: barra inferior fixa com “Explorar”, “Cestas”, “Pedidos” e “Conta”; carrinho permanece como ação persistente no cabeçalho. A aba ativa precisa ter texto e indicador visual, não apenas cor.

A primeira visita deve levar a pessoa a escolher a zona/endereço somente quando isso for necessário para filtrar disponibilidade. Não bloquear exploração pública sem motivo; explicar: “Informe seu CEP para ver o que entregamos na sua região”.

### 3.3 Produtor

Menu lateral no desktop e drawer/bottom navigation no mobile: “Painel”, “Produtos e estoque”, “Pedidos a atender”, “Financeiro”, “Propriedade”. O item com pendência deve ter badge textual, por exemplo “2 pendências”, e não apenas um ponto colorido.

Produtor não aprovado vê banner persistente de onboarding com ação “Ver pendências”. Não mostrar “publique e venda” enquanto aprovação ou conexão de pagamento forem pré-requisitos não cumpridos.

### 3.4 Operações

Menu lateral denso e orientado a tarefas: “Visão geral”, “Pedidos e assinaturas”, “Zonas e slots”, “Rotas”, “Entregas”, “Romaneio”. Filtros persistem na URL para permitir recarregar/compartilhar o contexto. Ações de status exigem confirmação quando irreversíveis e mostram registro de última atualização.

## 4. Fluxos críticos

### 4.1 Compra avulsa

1. Explorar catálogo → selecionar produto/cesta → consultar detalhe.
2. Adicionar ao carrinho → validar zona, disponibilidade e limites.
3. Carrinho → escolher endereço salvo ou cadastrar novo → selecionar janela.
4. Checkout → revisar itens, subtotal, taxa se definida, total e política de entrega → iniciar pagamento no adapter disponível.
5. `pending_payment` não é “pedido confirmado”. Exibir “Aguardando confirmação do pagamento”.
6. Somente evento confiável confirmado muda para “Pedido confirmado”; depois, a linha do tempo avança por operação.

Copy de CTA: “Adicionar ao carrinho”, “Continuar para entrega”, “Revisar pedido”, “Ir para pagamento”, “Acompanhar pedido”. Evitar “Comprar agora” se ainda houver endereço/janela/pagamento.

### 4.2 Assinatura de cesta fixa

A página deve mostrar: nome da cesta, foto, itens fixos, preço por ciclo, frequência semanal/mensal, próxima cobrança, próxima entrega, endereço, janela e cutoff. O botão é “Assinar cesta” somente quando todos os dados estão válidos.

Pausa/cancelamento exibem modal de confirmação com a regra concreta do piloto: “Você pode pausar/cancelar até [cutoff configurado]. Este ciclo já está fora do prazo” quando aplicável. Como cutoff e política de falta ainda estão abertos, o frontend deve renderizar os valores fornecidos pela API; não hardcode “7 dias”.

### 4.3 Produto/estoque do produtor

Formulário em etapas curtas: “Informações”, “Preço e unidade”, “Disponibilidade”, “Foto e certificação”, “Revisar e publicar”. Preview usa o mesmo card do catálogo. Mostrar claramente “Salvar rascunho”, “Publicar oferta” e “Pausar oferta”.

Ações de estoque mostram saldo atual, nova disponibilidade e impacto previsto. Erro de concorrência: “A disponibilidade mudou enquanto você editava. Atualize os dados antes de salvar”; nunca mascarar como sucesso.

### 4.4 Operação de entrega

Visão de pedidos confirmados por zona e slot → agrupar manualmente → atribuir rota → atualizar “Em preparação” → “A caminho” → “Entregue” → consumidor confirma. Exceções ficam em fila separada com motivo, pedido, zona, impacto e próxima ação.

## 5. Sistema visual

O wireframe usa uma linguagem editorial simples: cabeçalho verde escuro, cards brancos, blocos de métricas, tabelas operacionais e CTAs largos. A implementação deve preservar essa hierarquia, refinando contraste, espaçamento e responsividade.

### 5.1 Tokens recomendados

- **Verde floresta / marca:** `#0B3D24` para cabeçalhos, navegação e títulos de alto destaque.
- **Verde ação:** `#146B3A` para botão primário; verificar contraste com texto branco.
- **Verde claro de apoio:** `#E7F3EA` para superfícies informativas, nunca como único indicador de sucesso.
- **Areia/fundo:** `#F7F5EF` para áreas públicas e separação suave.
- **Texto:** `#152019`; texto secundário `#46534B`.
- **Borda:** `#B8C4BC`; foco visível `#0B5FFF` ou outro token aprovado com contraste mínimo.
- **Sucesso:** `#176B3A`; **atenção:** `#8A5700`; **erro:** `#B42318`; **informação:** `#075985`. Cada estado usa ícone + texto + cor.

As cores devem atingir WCAG 2.2 AA: 4,5:1 para texto normal, 3:1 para texto grande e componentes essenciais. Não usar texto verde claro sobre branco, nem texto branco sobre verde claro.

### 5.2 Tipografia e layout

Usar uma sans-serif do sistema ou fonte web otimizada, com corpo mínimo de 16px, altura de linha entre 1,4 e 1,6 e títulos sem caixa alta integral. Escala sugerida: 14px auxiliar, 16px corpo, 18px lead, 24px título de seção, 32–40px hero. Permitir zoom de 200% sem perda de conteúdo.

Grid: container máximo de 1200px, padding lateral 16px no celular, 24px no tablet e 32px no desktop. Espaçamento baseado em múltiplos de 4px; cards com 16–24px de padding e raio moderado (8–12px). Sombras discretas; bordas devem manter separação em telas externas muito iluminadas.

### 5.3 Componentes essenciais

- `Header`, `Footer`, `Breadcrumbs`, navegação lateral e barra inferior mobile.
- `Button` primário/secundário/perigo, com estados default, hover, pressed, focus, disabled e loading.
- `Input`, `Select`, `Combobox`, máscara de CPF/CEP/telefone, `Textarea`, upload com compressão e mensagem de erro associada.
- `ProductCard`, `BasketCard`, `ProducerBadge`, `Price`, `AvailabilityBadge`, `QuantityStepper`.
- `FilterBar`, `SearchField`, `Pagination`/“Carregar mais”, `CartSummary`, `CheckoutStepper`.
- `StatusBadge` e `OrderTimeline` com estados textuais.
- `MetricCard`, `DataTable` responsiva, `EmptyState`, `Alert`, `Toast`, `Modal`, `Drawer`, `Skeleton`.
- `AddressCard`, `DeliverySlotCard`, `SubscriptionCard`, `ExceptionRow`, `RouteGroup` e `MapPanel` com alternativa em lista.

Todo componente deve ter API para `aria-label`, estado de erro, texto de ajuda e conteúdo de loading. Ícones nunca substituem o rótulo de uma ação.

## 6. Copy e terminologia em pt-BR

### 6.1 Tom

Claro, direto, acolhedor e sem jargão técnico. Falar “janela de entrega”, não “slot” para consumidor; “janela” pode aparecer internamente entre parênteses se necessário. Falar “cesta fixa” para deixar explícito que itens e preço são definidos. Evitar promessas de “zero desperdício”, “renda garantida” ou “tempo real” quando o dado não estiver confirmado.

### 6.2 Glossário obrigatório

- `Produto`: item avulso vendido com unidade e disponibilidade.
- `Cesta fixa`: conjunto definido de itens e preço por ciclo.
- `Assinatura`: recorrência semanal ou mensal de uma cesta fixa.
- `Disponibilidade`: quantidade/oferta elegível para venda; não confundir com estoque já reservado.
- `Pagamento pendente`: pagamento iniciado, ainda sem confirmação confiável.
- `Pedido confirmado`: pagamento confirmado e reserva concluída.
- `Em preparação`: pedido em separação/colheita.
- `A caminho`: operação despachou o pedido.
- `Entregue`: operação marcou entrega; consumidor ainda pode confirmar recebimento.
- `Repasse`: valor devido ao produtor conforme regra financeira aprovada.

### 6.3 Exemplos de mensagens

- Empty catálogo: **“Ainda não há ofertas disponíveis para esta região.”** CTA: “Trocar endereço” / “Ver todas as regiões”.
- Empty pedidos: **“Você ainda não tem pedidos.”** CTA: “Explorar ofertas”.
- Empty assinaturas: **“Nenhuma assinatura ativa.”** CTA: “Conhecer cestas”.
- Estoque insuficiente: **“A quantidade disponível mudou. Ajuste o item para continuar.”**
- Pagamento pendente: **“Estamos aguardando a confirmação do pagamento. Você pode acompanhar o pedido nesta página.”**
- Integração indisponível: **“O pagamento está temporariamente indisponível neste ambiente. Tente novamente mais tarde.”** Não exibir “Mercado Pago conectado” sem configuração.
- Mapa indisponível: **“Não foi possível carregar o mapa. Consulte a lista por zona enquanto isso.”**
- Sessão expirada: **“Sua sessão expirou por segurança. Entre novamente para continuar.”** Preservar destino pós-login quando possível.
- Sucesso de publicação: **“Oferta publicada. Ela aparecerá para consumidores elegíveis após a atualização do catálogo.”**
- LGPD: **“Solicitar exclusão dos meus dados”** com explicação de que a solicitação é registrada e tratada conforme política aplicável.

## 7. Estados obrigatórios

### Loading

Usar skeleton que preserve a forma do conteúdo, não spinner isolado em páginas inteiras. Botão em submissão vira “Salvando…”/“Processando…” e fica desabilitado para impedir duplicidade. Em tabelas, manter cabeçalho e filtros visíveis. Para mapa, mostrar placeholder e alternativa em lista.

### Vazio

Cada vazio explica por que está vazio e oferece próxima ação. Diferenciar “ainda não há dados” de “nenhum resultado para este filtro”. Não usar ilustração como único significado.

### Erro

Erro de campo fica junto do campo e em `aria-describedby`; erro global aparece no topo do contexto com ação de retry. Mostrar referência/correlation ID apenas para Operações ou suporte, nunca exigir que consumidor entenda logs. Em falha de checkout, manter carrinho, endereço e janela quando seguros.

### Sucesso

Confirmar o resultado e o próximo passo: número do pedido, estado e CTA para acompanhar. Toast sozinho não é suficiente para ações financeiras, publicação, cancelamento ou exclusão.

### Offline/conexão instável

Para leitura, mostrar última atualização e botão “Tentar novamente”. Para ações de estoque, pagamento e status, não simular sucesso offline. Desabilitar envio enquanto a requisição estiver sem conexão e explicar o motivo.

## 8. Responsividade e acessibilidade

- Mobile-first a partir de 320px; validar 360, 390, 768, 1024 e 1440px.
- Não depender de hover; toda ação disponível por toque e teclado.
- Alvos de toque de pelo menos 44×44px, espaçados para evitar acionamento acidental.
- Foco sempre visível, ordem de tabulação lógica, skip link “Ir para o conteúdo”.
- Modal com foco preso, Escape para fechar quando seguro, título e descrição associados.
- HTML semântico: um `h1` por tela, headings hierárquicos, `nav`, `main`, `section`, `table` real quando tabular.
- Leitores de tela: status assíncrono em `aria-live="polite"`; erros críticos em região assertiva sem repetir conteúdo.
- Contraste não depende de cor; status usa texto, ícone e forma/posição.
- Imagens de produtor/produto têm alt descritivo; imagens decorativas têm alt vazio. Upload exige descrição/alt quando necessário.
- Formulários informam obrigatório, formato, exemplo e erro sem apagar o valor digitado. CPF e dados sensíveis nunca aparecem completos após salvos.
- Tabelas no celular viram cards com rótulo/valor ou rolagem horizontal controlada, sem cortar ações essenciais.
- Respeitar `prefers-reduced-motion`; nenhuma informação essencial depende de animação.
- Testar com teclado, NVDA/VoiceOver/TalkBack, zoom 200%, alto contraste do sistema e luz/simulação externa.

## 9. Critérios visuais de aceite para implementação frontend

### Fundação

- [ ] Metadados, linguagem e identidade são AgriTech; não há vestígio visual do starter ou de “amigo-do-bairro”.
- [ ] Tokens de cor, tipografia, espaçamento, foco e estados estão centralizados e reutilizáveis.
- [ ] Não existem links ou menus para escopo explicitamente fora do MVP.

### Público e consumidor

- [ ] Visitante explora catálogo e detalhe sem autenticação; compra/assinatura solicita login no momento apropriado.
- [ ] Card informa foto/alt, nome, produtor/origem, unidade, preço e disponibilidade sem depender de hover.
- [ ] Catálogo usa paginação/carregamento incremental e exibe erro/vazio/loading.
- [ ] Checkout diferencia pagamento pendente de pedido confirmado e não duplica ação por double click.
- [ ] Assinatura exibe frequência, preço por ciclo, próxima cobrança, próxima entrega, endereço, janela e regra de pausa/cancelamento.
- [ ] Histórico e rastreio exibem a máquina de estados em linguagem de consumidor.

### Produtor

- [ ] Onboarding informa aprovação e pendências; publicação só aparece quando pré-requisitos forem atendidos.
- [ ] Cadastro de oferta mostra unidade, preço, sazonalidade, estoque, limites e preview.
- [ ] Alterações de estoque e oferta têm confirmação, feedback de sucesso/erro e não permitem saldo negativo.
- [ ] Fila mostra volumes e janelas legíveis no celular; financeiro separa bruto, taxa, líquido e status de repasse.
- [ ] Qualquer indisponibilidade de Mercado Pago/split é explícita, sem simular repasse confirmado.

### Operações

- [ ] Dashboard prioriza pedidos do dia, exceções e capacidade; métricas têm período e última atualização.
- [ ] Pedidos filtram por zona, janela e estado; filtros persistem sem perder o contexto.
- [ ] Mapa sempre possui lista alternativa e informa quando está indisponível; agrupamento é claramente manual.
- [ ] Mudanças para preparação, trânsito e entrega mostram autor/horário no detalhe e confirmação quando necessário.
- [ ] Romaneio é legível, paginado e oferece exportação sem bloquear a navegação.

### Qualidade transversal

- [ ] Todos os fluxos têm loading, vazio, erro, sucesso e estado de sessão expirada.
- [ ] Contraste WCAG AA, foco visível, teclado, leitor de tela, zoom 200% e toque foram validados.
- [ ] Nenhum segredo, dado bruto de cartão ou credencial de provedor aparece no frontend.
- [ ] Alt text, mensagens e labels estão em pt-BR e usam terminologia deste documento.
- [ ] Alvo de performance visual: catálogo com p95 de carregamento de até 1,5s conforme dados representativos; imagens comprimidas e lazy loading sem layout shift evitável.

## 10. Decisões abertas que o design deve parametrizar

Município e CEPs/zones; dias, capacidade e janelas; cutoff; política de pausa, cancelamento, falta e substituição; taxa e momento do repasse; meios efetivos do Mercado Pago; responsáveis por aprovar produtor/oferta/certificação/reembolso; dados e validade de certificações; navegadores/dispositivos oficiais; e disponibilidade real de provedores.

Até essas decisões serem aprovadas, telas devem usar labels parametrizados como `[cidade-piloto]`, `[cutoff configurado]`, `[janela disponível]` e `[política de falta]`, evitando valores inventados. A implementação deve preferir ocultar uma ação não habilitada a apresentá-la como disponível.

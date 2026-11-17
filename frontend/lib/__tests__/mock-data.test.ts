import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_CPF,
  DEMO_CREDENTIALS,
  DEMO_OPERATIONS_CREDENTIALS,
  DEMO_PRODUCER_CREDENTIALS,
  MOCK_DELIVERY_SLOTS,
  calculatePlatformFeeCents,
  canTransitionOrder,
  isBeforeCutoff,
  isValidCpf,
  maskCpf,
  mockApi,
  resetMockState,
} from '../mock-data.ts';
import {
  PointerVelocityTracker,
  nearestSnapPoint,
  project,
  relativeVelocity,
  rubberband,
} from '../apple-fluid.ts';
import {
  USE_MOCK_DATA,
  api,
  type AccountProfile,
  type AdminDashboardData,
  type AuthResponse,
  type Basket,
  type Cart,
  type CatalogResponse,
  type DeliverySlotOption,
  type LgpdDeletionRequest,
  type Order,
  type ProducerDashboardData,
  type Product,
  type SavedAddress,
  type Subscription,
} from '../api.ts';

describe('Manà Mock API & Consumer/Producer Domain Rules', () => {
  beforeEach(() => {
    resetMockState();
  });

  describe('Apple Design Fluid Physics & Gesture Primitives', () => {
    it('projects momentum endpoint using Apple exponential-decay formula and finds nearest snap point', () => {
      // Zero velocity -> 0 projection
      assert.equal(project(0), 0);
      // Positive flick velocity -> projects forward proportionally
      const projected = project(1000, 0.99);
      assert.equal(Math.round(projected), 99);
      assert.equal(nearestSnapPoint(50 + projected, [0, 200]), 200);
      assert.equal(nearestSnapPoint(20, [0, 200]), 0);
    });

    it('calculates normalized relative velocity and progressive rubber-band resistance at boundaries', () => {
      assert.equal(relativeVelocity(50, 50, 150), 0.5);
      assert.equal(relativeVelocity(50, 100, 100), 0);

      const damped = rubberband(100, 400, 0.55);
      assert.ok(damped > 0 && damped < 100);
      assert.equal(rubberband(-100, 400, 0.55), -damped);
      assert.equal(rubberband(0, 400), 0);
    });

    it('tracks pointer samples and computes release velocity', () => {
      const tracker = new PointerVelocityTracker();
      tracker.record(0, 0, 100);
      tracker.record(50, 120, 150);
      const { vx, vy } = tracker.getVelocity();
      assert.equal(Math.round(vx), 1000);
      assert.equal(Math.round(vy), 2400);
    });
  });

  describe('CPF Validation & Masking', () => {
    it('validates mathematically valid CPFs, rejects invalid ones, and masks CPF', () => {
      assert.equal(isValidCpf(DEMO_CPF), true);
      assert.equal(isValidCpf('52998224725'), true);
      assert.equal(isValidCpf('111.111.111-11'), false);
      assert.equal(isValidCpf('123.456.789-00'), false);
      assert.equal(isValidCpf('123'), false);
      assert.equal(maskCpf(DEMO_CPF), '***.982.247-25');
    });
  });

  describe('Catalog & Product Detail', () => {
    it('lists all mock products (including 3 fixed baskets) with stock and producer metadata', async () => {
      const res = (await mockApi('/catalog')) as CatalogResponse;
      assert.equal(res.data.length, 8);
      assert.equal(res.pagination.count, 8);
      assert.ok(res.data.some((p) => p.category === 'Frutas'));
      const cesta = res.data.find((p) => p.id === 'mock-cesta');
      assert.ok(cesta?.basketItems && cesta.basketItems.length === 7);
    });

    it('filters catalog by category (including Frutas and Cestas) and search query', async () => {
      const frutas = (await mockApi(
        '/catalog?category=Frutas'
      )) as CatalogResponse;
      assert.equal(frutas.data.length, 1);
      assert.equal(frutas.data[0].id, 'mock-morango');

      const cestas = (await mockApi(
        '/catalog?category=Cestas'
      )) as CatalogResponse;
      assert.equal(cestas.data.length, 3);

      const search = (await mockApi(
        '/catalog?search=sítio verde'
      )) as CatalogResponse;
      assert.equal(search.data.length, 2);
    });

    it('fetches individual product detail and throws on unknown id', async () => {
      const product = (await mockApi('/catalog/mock-cesta')) as Product;
      assert.equal(product.name, 'Cesta da semana');
      assert.equal(product.priceCents, 6490);

      await assert.rejects(
        () => mockApi('/catalog/inexistente'),
        /Oferta não encontrada/
      );
    });
  });

  describe('Authentication & Registration', () => {
    it('logs in with demo consumer or producer credentials and rejects wrong password', async () => {
      const authConsumer = (await mockApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(DEMO_CREDENTIALS),
      })) as AuthResponse;
      assert.equal(authConsumer.user.email, DEMO_CREDENTIALS.email);
      assert.equal(authConsumer.user.role, 'consumer');

      const authProducer = (await mockApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(DEMO_PRODUCER_CREDENTIALS),
      })) as AuthResponse;
      assert.equal(authProducer.user.email, DEMO_PRODUCER_CREDENTIALS.email);
      assert.equal(authProducer.user.role, 'producer');

      await assert.rejects(
        () =>
          mockApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify({
              email: DEMO_CREDENTIALS.email,
              password: 'errada',
            }),
          }),
        /Credenciais inválidas/
      );
    });

    it('registers a new account with valid CPF and allows subsequent login', async () => {
      const registered = (await mockApi('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: 'novo@mana.local',
          cpf: DEMO_CPF,
          password: 'password123',
        }),
      })) as AuthResponse;
      assert.equal(registered.user.email, 'novo@mana.local');

      const loggedIn = (await mockApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'novo@mana.local',
          password: 'password123',
        }),
      })) as AuthResponse;
      assert.equal(loggedIn.user.id, registered.user.id);
    });

    it('rejects registration with invalid CPF or duplicate email', async () => {
      await assert.rejects(
        () =>
          mockApi('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              email: 'invalido@mana.local',
              cpf: '111.111.111-11',
              password: 'password123',
            }),
          }),
        /CPF inválido/
      );

      await assert.rejects(
        () =>
          mockApi('/auth/register', {
            method: 'POST',
            body: JSON.stringify({
              email: DEMO_CREDENTIALS.email,
              cpf: DEMO_CPF,
              password: 'password123',
            }),
          }),
        /já cadastrado/
      );
    });
  });

  describe('Cart & Stock Limits', () => {
    it('adds, updates, and removes cart items while respecting stock limits', async () => {
      const initial = (await mockApi('/cart')) as Cart;
      assert.equal(initial.data.length, 2);

      const afterAdd = (await mockApi('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId: 'mock-morango', quantity: 2 }),
      })) as Cart;
      assert.equal(afterAdd.data.length, 3);

      const afterPatch = (await mockApi('/cart/items/mock-morango', {
        method: 'PATCH',
        body: JSON.stringify({ quantity: 5 }),
      })) as Cart;
      const morango = afterPatch.data.find(
        (i) => i.productId === 'mock-morango'
      );
      assert.equal(morango?.quantity, 5);
      assert.equal(morango?.subtotalCents, 5 * 1290);

      await assert.rejects(
        () =>
          mockApi('/cart/items/mock-morango', {
            method: 'PATCH',
            body: JSON.stringify({ quantity: 25 }),
          }),
        /Quantidade máxima disponível/
      );

      const afterDelete = (await mockApi('/cart/items/mock-morango', {
        method: 'DELETE',
      })) as Cart;
      assert.equal(afterDelete.data.length, 2);
    });
  });

  describe('Checkout, Idempotency & Order Delivery Confirmation', () => {
    it('creates order, deducts stock, clears cart, and enforces idempotency key', async () => {
      const beforeProduct = (await mockApi('/catalog/mock-cesta')) as Product;
      assert.equal(beforeProduct.stock.available, 12);

      const address = {
        postalCode: '01310-100',
        street: 'Avenida Paulista',
        number: '1500',
        complement: 'Conjunto 10',
        city: 'São Paulo',
        state: 'SP',
      };

      const order1 = (await mockApi('/checkout', {
        method: 'POST',
        headers: { 'x-idempotency-key': 'idem-key-123' },
        body: JSON.stringify({
          address,
          deliverySlotId: MOCK_DELIVERY_SLOTS[1].id,
        }),
      })) as Order;

      assert.ok(order1.id.startsWith('AG-'));
      assert.equal(order1.deliverySlot.id, MOCK_DELIVERY_SLOTS[1].id);
      assert.equal(order1.totalCents, 6490 + 2 * 1490);

      const afterProduct = (await mockApi('/catalog/mock-cesta')) as Product;
      assert.equal(afterProduct.stock.available, 11);

      const emptyCart = (await mockApi('/cart')) as Cart;
      assert.equal(emptyCart.data.length, 0);

      const orderDuplicate = (await mockApi('/checkout', {
        method: 'POST',
        headers: { 'x-idempotency-key': 'idem-key-123' },
        body: JSON.stringify({ address }),
      })) as Order;
      assert.equal(orderDuplicate.id, order1.id);

      const confirmed = (await mockApi(
        `/orders/${order1.id}/confirm-delivery`,
        {
          method: 'POST',
        }
      )) as Order;
      assert.equal(confirmed.status, 'Entregue');
      assert.equal(confirmed.delivery.status, 'delivered');
      assert.ok(
        confirmed.statusHistory.some((h) =>
          h.toStatus.includes('confirmado pelo consumidor')
        )
      );
    });
  });

  describe('Fixed Baskets & Subscriptions (Weekly/Monthly, Cutoff, Idempotent Cycles)', () => {
    it('lists fixed baskets with items, frequencies, and cutoff hours', async () => {
      const res = (await mockApi('/baskets')) as { data: Basket[] };
      assert.equal(res.data.length, 3);
      const compacta = (await mockApi('/baskets/basket-compacta')) as Basket;
      assert.equal(compacta.priceCents, 4290);
      assert.equal(compacta.items.length, 5);
      assert.deepEqual(compacta.frequencies, ['weekly', 'monthly']);
    });

    it('creates a subscription, reserves stock, and generates an initial order', async () => {
      const before = (await mockApi('/baskets/basket-pomar')) as Basket;
      assert.equal(before.stock.available, 10);

      const created = (await mockApi('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          basketId: 'basket-pomar',
          frequency: 'monthly',
          deliverySlotId: MOCK_DELIVERY_SLOTS[2].id,
          address: {
            postalCode: '01310-100',
            street: 'Rua Augusta',
            number: '500',
            city: 'São Paulo',
            state: 'SP',
          },
        }),
      })) as Subscription;

      assert.equal(created.basketId, 'basket-pomar');
      assert.equal(created.frequency, 'monthly');
      assert.equal(created.status, 'active');
      assert.equal(created.cycles.length, 1);
      assert.ok(created.cycles[0].orderId);

      const after = (await mockApi('/baskets/basket-pomar')) as Basket;
      assert.equal(after.stock.available, 9);
    });

    it('pauses, resumes, and cancels subscriptions within the cutoff window', async () => {
      assert.equal(
        isBeforeCutoff(
          new Date('2026-11-10T10:00:00Z'),
          new Date('2026-11-12T10:00:00Z'),
          36
        ),
        true
      );
      assert.equal(
        isBeforeCutoff(
          new Date('2026-11-11T10:00:00Z'),
          new Date('2026-11-12T10:00:00Z'),
          36
        ),
        false
      );

      const paused = (await mockApi('/subscriptions/SUB-2041/pause', {
        method: 'POST',
      })) as Subscription;
      assert.equal(paused.status, 'paused');

      const resumed = (await mockApi('/subscriptions/SUB-2041/resume', {
        method: 'POST',
      })) as Subscription;
      assert.equal(resumed.status, 'active');

      const cancelled = (await mockApi('/subscriptions/SUB-2041/cancel', {
        method: 'POST',
      })) as Subscription;
      assert.equal(cancelled.status, 'cancelled');

      await assert.rejects(
        () =>
          mockApi('/subscriptions/SUB-2041/resume', {
            method: 'POST',
          }),
        /Assinatura cancelada não pode ser reativada/
      );
    });

    it('generates cycles idempotently and handles payment failures cleanly', async () => {
      const cycle1 = (await mockApi('/subscriptions/SUB-2041/generate-cycle', {
        method: 'POST',
        body: JSON.stringify({ cycleKey: '2026-11-17' }),
      })) as Subscription;
      assert.equal(cycle1.cycles.length, 2);
      assert.equal(cycle1.cycles[0].cycleKey, '2026-11-17');
      assert.equal(cycle1.cycles[0].status, 'confirmed');

      const stockAfterFirst = (await mockApi(
        '/baskets/basket-familiar'
      )) as Basket;
      assert.equal(stockAfterFirst.stock.available, 11);

      const cycleDuplicate = (await mockApi(
        '/subscriptions/SUB-2041/generate-cycle',
        {
          method: 'POST',
          body: JSON.stringify({ cycleKey: '2026-11-17' }),
        }
      )) as Subscription;
      assert.equal(cycleDuplicate.cycles.length, 2);
      const stockAfterDuplicate = (await mockApi(
        '/baskets/basket-familiar'
      )) as Basket;
      assert.equal(stockAfterDuplicate.stock.available, 11);

      const failed = (await mockApi('/subscriptions/SUB-2041/generate-cycle', {
        method: 'POST',
        body: JSON.stringify({
          cycleKey: '2026-11-24',
          simulatePaymentFailure: true,
        }),
      })) as Subscription;
      assert.equal(failed.status, 'payment_failed');
      assert.equal(failed.cycles[0].status, 'payment_failed');
    });
  });

  describe('Consumer Account Profile, Saved Addresses & LGPD Requests', () => {
    it('returns masked CPF, zero stored card data, manages addresses, and logs LGPD deletion requests', async () => {
      const profile = (await mockApi('/account/profile')) as AccountProfile;
      assert.equal(profile.maskedCpf, '***.982.247-25');
      assert.equal(profile.paymentGatewayStatus.storesCardData, false);
      assert.equal(profile.addresses.length, 1);

      const addedAddr = (await mockApi('/account/addresses', {
        method: 'POST',
        body: JSON.stringify({
          label: 'Escritório',
          postalCode: '04538-132',
          street: 'Av. Faria Lima',
          number: '3000',
          city: 'São Paulo',
          state: 'SP',
        }),
      })) as { data: SavedAddress[] };
      assert.equal(addedAddr.data.length, 2);

      const lgpd = (await mockApi('/account/lgpd-deletion-request', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Encerrar conta de teste' }),
      })) as LgpdDeletionRequest;
      assert.ok(lgpd.protocol.startsWith('LGPD-2026-'));
      assert.equal(lgpd.status, 'pending_review');

      await assert.rejects(
        () =>
          mockApi('/account/lgpd-deletion-request', {
            method: 'POST',
            body: JSON.stringify({ reason: 'Duplicada' }),
          }),
        /Já existe uma solicitação LGPD em análise/
      );
    });
  });

  describe('Producer Panel (Onboarding, Offers CRUD, Weekly Stock, Fulfillment & Net Payouts)', () => {
    it('publishes valid offer, syncs with consumer catalog, and pauses offer', async () => {
      const created = (await mockApi('/producer/offers', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Mel silvestre orgânico',
          description: 'Mel puro de florada silvestre.',
          category: 'Granja',
          unit: 'pote 500 g',
          priceCents: 2890,
          available: 14,
          seasonality: 'Safra de Primavera',
          certification: 'Orgânico Brasil (SISORG)',
          active: true,
        }),
      })) as Product;

      assert.equal(created.name, 'Mel silvestre orgânico');
      assert.equal(created.active, true);

      const publicCatalog = (await mockApi('/catalog')) as CatalogResponse;
      assert.ok(publicCatalog.data.some((p) => p.id === created.id));

      // Pause the offer and verify it disappears from public consumer catalog
      await mockApi(`/producer/offers/${created.id}/toggle-status`, {
        method: 'POST',
      });
      const afterPause = (await mockApi('/catalog')) as CatalogResponse;
      assert.equal(
        afterPause.data.some((p) => p.id === created.id),
        false
      );
    });

    it('blocks publishing offers when onboarding is not approved or payment account is disconnected', async () => {
      await mockApi('/producer/onboarding', {
        method: 'PATCH',
        body: JSON.stringify({
          onboardingStatus: 'pending_review',
          paymentAccountConnected: false,
        }),
      });

      await assert.rejects(
        () =>
          mockApi('/producer/offers', {
            method: 'POST',
            body: JSON.stringify({
              name: 'Rúcula hidropônica',
              unit: 'maço',
              priceCents: 650,
              available: 10,
              active: true,
            }),
          }),
        /Conclua a aprovação do onboarding e conecte a conta de recebimento/
      );

      // Saving as draft (active: false) is still permitted
      const draft = (await mockApi('/producer/offers', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Rúcula hidropônica',
          unit: 'maço',
          priceCents: 650,
          available: 10,
          active: false,
        }),
      })) as Product;
      assert.equal(draft.active, false);
    });

    it('enforces non-negative stock and optimistic concurrency on weekly inventory updates', async () => {
      await assert.rejects(
        () =>
          mockApi('/producer/inventory/mock-cesta', {
            method: 'PATCH',
            body: JSON.stringify({ available: -5 }),
          }),
        /O estoque disponível não pode ser negativo/
      );

      await assert.rejects(
        () =>
          mockApi('/producer/inventory/mock-cesta', {
            method: 'PATCH',
            body: JSON.stringify({
              available: 20,
              expectedAvailable: 999,
            }),
          }),
        /A disponibilidade mudou enquanto você editava/
      );

      const dash = (await mockApi('/producer/inventory/mock-cesta', {
        method: 'PATCH',
        body: JSON.stringify({
          available: 25,
          expectedAvailable: 12,
        }),
      })) as ProducerDashboardData;

      const updatedCesta = dash.offers.find((o) => o.id === 'mock-cesta');
      assert.equal(updatedCesta?.stock.available, 25);
      assert.ok(
        dash.auditLogs.some((l) => l.action === 'inventory.updated')
      );
    });

    it('marks order separation in fulfillment queue and calculates gross, fee, and net payout', async () => {
      assert.equal(calculatePlatformFeeCents(10000, 10), 1000);

      const before = (await mockApi(
        '/producer/dashboard'
      )) as ProducerDashboardData;
      assert.equal(before.metrics.pendingFulfillmentCount, 1);

      const after = (await mockApi(
        '/producer/orders/AG-1048/mark-separated',
        { method: 'POST' }
      )) as ProducerDashboardData;
      assert.equal(after.metrics.pendingFulfillmentCount, 0);

      for (const payout of after.payouts) {
        const expectedFee = calculatePlatformFeeCents(payout.grossCents, 10);
        assert.equal(payout.feeCents, expectedFee);
        assert.equal(payout.netCents, payout.grossCents - expectedFee);
      }
    });
  });

  describe('Operations Panel (ServiceZones, DeliverySlots, Manual Routes, Order Progression & Exceptions)', () => {
    it('logs in with demo operations credentials', async () => {
      const res = (await mockApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(DEMO_OPERATIONS_CREDENTIALS),
      })) as AuthResponse;
      assert.equal(res.user.role, 'operations');
      assert.equal(res.user.email, DEMO_OPERATIONS_CREDENTIALS.email);
    });

    it('creates service zones and delivery slots and syncs active slots with consumer checkout', async () => {
      const afterZone = (await mockApi('/admin/zones', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Zona Sul · Vila Mariana',
          postalCodePrefix: '04010',
          city: 'São Paulo',
          cutoffHours: 36,
        }),
      })) as AdminDashboardData;

      const createdZone = afterZone.zones.find(
        (z) => z.name === 'Zona Sul · Vila Mariana'
      );
      assert.ok(createdZone);

      const afterSlot = (await mockApi('/admin/slots', {
        method: 'POST',
        body: JSON.stringify({
          zoneId: createdZone.id,
          label: 'Sexta-feira · 09h às 12h',
          capacity: 40,
        }),
      })) as AdminDashboardData;

      assert.ok(
        afterSlot.slots.some((s) => s.label === 'Sexta-feira · 09h às 12h')
      );

      const consumerSlots = (await mockApi('/delivery-slots')) as {
        data: DeliverySlotOption[];
      };
      assert.ok(
        consumerSlots.data.some((s) => s.label === 'Sexta-feira · 09h às 12h')
      );
    });

    it('creates manual route and assigns order to route', async () => {
      const afterRoute = (await mockApi('/admin/routes', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Rota 02 · Centro-Sul Tarde',
          zoneId: 'zone-centro-sul',
          slotId: MOCK_DELIVERY_SLOTS[0].id,
          driverName: 'Juliana Costa · Fiorino Isotérmica',
        }),
      })) as AdminDashboardData;

      const createdRoute = afterRoute.routes.find(
        (r) => r.name === 'Rota 02 · Centro-Sul Tarde'
      );
      assert.ok(createdRoute);

      const afterAssign = (await mockApi(
        '/admin/orders/AG-1048/assign-route',
        {
          method: 'POST',
          body: JSON.stringify({ routeId: createdRoute.id }),
        }
      )) as AdminDashboardData;

      const assignedOrder = afterAssign.orders.find((o) => o.id === 'AG-1048');
      assert.equal(assignedOrder?.routeId, createdRoute.id);
      assert.equal(assignedOrder?.routeName, 'Rota 02 · Centro-Sul Tarde');
    });

    it('enforces sequential order status progression and rejects invalid jumps', async () => {
      assert.equal(canTransitionOrder('preparing', 'in_transit'), true);
      assert.equal(canTransitionOrder('preparing', 'delivered'), false);

      await assert.rejects(
        () =>
          mockApi('/admin/orders/AG-1048/status', {
            method: 'POST',
            body: JSON.stringify({ stage: 'delivered' }),
          }),
        /Transição inválida/
      );

      const afterTransit = (await mockApi('/admin/orders/AG-1048/status', {
        method: 'POST',
        body: JSON.stringify({ stage: 'in_transit' }),
      })) as AdminDashboardData;
      const inTransitOrder = afterTransit.orders.find(
        (o) => o.id === 'AG-1048'
      );
      assert.equal(inTransitOrder?.status, 'A caminho');
      assert.equal(inTransitOrder?.operationalStage, 'in_transit');

      const afterDelivered = (await mockApi('/admin/orders/AG-1048/status', {
        method: 'POST',
        body: JSON.stringify({ stage: 'delivered' }),
      })) as AdminDashboardData;
      const deliveredOrder = afterDelivered.orders.find(
        (o) => o.id === 'AG-1048'
      );
      assert.equal(deliveredOrder?.status, 'Entregue');
      assert.equal(deliveredOrder?.operationalStage, 'delivered');
      assert.equal(deliveredOrder?.delivery.status, 'delivered');
    });

    it('resolves operational exceptions including LGPD requests and logs audit entry', async () => {
      const lgpd = (await mockApi('/account/lgpd-deletion-request', {
        method: 'POST',
        body: JSON.stringify({ reason: 'Solicitação de anonimização' }),
      })) as LgpdDeletionRequest;

      const before = (await mockApi('/admin/dashboard')) as AdminDashboardData;
      const lgpdExc = before.exceptions.find(
        (e) => e.referenceId === lgpd.protocol
      );
      assert.ok(lgpdExc);
      assert.equal(lgpdExc.status, 'open');

      const after = (await mockApi(
        `/admin/exceptions/${lgpdExc.id}/resolve`,
        {
          method: 'POST',
          body: JSON.stringify({
            resolutionNote: 'Dados anonimizados conforme protocolo LGPD.',
          }),
        }
      )) as AdminDashboardData;

      const resolvedExc = after.exceptions.find((e) => e.id === lgpdExc.id);
      assert.equal(resolvedExc?.status, 'resolved');

      const profile = (await mockApi('/account/profile')) as AccountProfile;
      assert.equal(profile.lgpdRequests[0].status, 'completed');
    });
  });

  describe('API Client Backend-First with Mock-Data Fallback', () => {
    it('defaults USE_MOCK_DATA to false, returns backend data when reachable, and falls back to mock-data when unreachable', async () => {
      assert.equal(USE_MOCK_DATA, false);

      const originalFetch = globalThis.fetch;
      try {
        // 1. When backend is reachable, returns actual backend data
        globalThis.fetch = async () =>
          new Response(
            JSON.stringify({
              data: [{ id: 'backend-prod-1', name: 'Produto Real do Backend' }],
              pagination: { limit: 20, offset: 0, count: 1, nextOffset: null },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );

        const backendRes = await api<CatalogResponse>('/catalog');
        assert.equal(backendRes.data.length, 1);
        assert.equal(backendRes.data[0].id, 'backend-prod-1');

        // 2. When backend is unreachable (network error), falls back to mock-data
        globalThis.fetch = async () => {
          throw new TypeError('fetch failed');
        };

        const fallbackRes = await api<CatalogResponse>('/catalog');
        assert.equal(fallbackRes.data.length, 8);
        assert.ok(fallbackRes.data.some((p) => p.id === 'mock-cesta'));
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});

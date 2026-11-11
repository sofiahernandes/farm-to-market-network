import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_CPF,
  DEMO_CREDENTIALS,
  MOCK_DELIVERY_SLOTS,
  isBeforeCutoff,
  isValidCpf,
  maskCpf,
  mockApi,
  resetMockState,
} from '../mock-data.ts';
import type {
  AccountProfile,
  AuthResponse,
  Basket,
  Cart,
  CatalogResponse,
  LgpdDeletionRequest,
  Order,
  Product,
  SavedAddress,
  Subscription,
} from '../api.ts';

describe('AgriTech Mock API & Consumer Slice Domain Rules', () => {
  beforeEach(() => {
    resetMockState();
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
    it('logs in with demo credentials and rejects wrong password', async () => {
      const auth = (await mockApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify(DEMO_CREDENTIALS),
      })) as AuthResponse;
      assert.equal(auth.user.email, DEMO_CREDENTIALS.email);
      assert.equal(auth.user.role, 'consumer');

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
          email: 'novo@agritech.local',
          cpf: DEMO_CPF,
          password: 'password123',
        }),
      })) as AuthResponse;
      assert.equal(registered.user.email, 'novo@agritech.local');

      const loggedIn = (await mockApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: 'novo@agritech.local',
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
              email: 'invalido@agritech.local',
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

      // Calling generate-cycle with the same cycleKey is idempotent
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

      // Simulate billing failure
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
});

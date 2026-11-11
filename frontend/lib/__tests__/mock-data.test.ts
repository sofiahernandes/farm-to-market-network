import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  DEMO_CPF,
  DEMO_CREDENTIALS,
  MOCK_DELIVERY_SLOTS,
  isValidCpf,
  mockApi,
  resetMockState,
} from '../mock-data.ts';
import type {
  AuthResponse,
  Cart,
  CatalogResponse,
  Order,
  Product,
} from '../api.ts';

describe('AgriTech Mock API & Consumer Slice Domain Rules', () => {
  beforeEach(() => {
    resetMockState();
  });

  describe('CPF Validation', () => {
    it('validates mathematically valid CPFs and rejects invalid ones', () => {
      assert.equal(isValidCpf(DEMO_CPF), true);
      assert.equal(isValidCpf('52998224725'), true);
      assert.equal(isValidCpf('111.111.111-11'), false);
      assert.equal(isValidCpf('123.456.789-00'), false);
      assert.equal(isValidCpf('123'), false);
    });
  });

  describe('Catalog & Product Detail', () => {
    it('lists all mock products with stock and producer metadata', async () => {
      const res = (await mockApi('/catalog')) as CatalogResponse;
      assert.equal(res.data.length, 6);
      assert.equal(res.pagination.count, 6);
      assert.ok(res.data.some((p) => p.category === 'Frutas'));
    });

    it('filters catalog by category (including Frutas) and search query', async () => {
      const frutas = (await mockApi(
        '/catalog?category=Frutas'
      )) as CatalogResponse;
      assert.equal(frutas.data.length, 1);
      assert.equal(frutas.data[0].id, 'mock-morango');

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

      // Add 2 more of mock-morango (stock = 9)
      const afterAdd = (await mockApi('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId: 'mock-morango', quantity: 2 }),
      })) as Cart;
      assert.equal(afterAdd.data.length, 3);

      // Update quantity via PATCH
      const afterPatch = (await mockApi('/cart/items/mock-morango', {
        method: 'PATCH',
        body: JSON.stringify({ quantity: 5 }),
      })) as Cart;
      const morango = afterPatch.data.find(
        (i) => i.productId === 'mock-morango'
      );
      assert.equal(morango?.quantity, 5);
      assert.equal(morango?.subtotalCents, 5 * 1290);

      // Exceeding stock (9 available) throws error
      await assert.rejects(
        () =>
          mockApi('/cart/items/mock-morango', {
            method: 'PATCH',
            body: JSON.stringify({ quantity: 25 }),
          }),
        /Quantidade máxima disponível/
      );

      // Remove item
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

      // Stock of mock-cesta should be decremented from 12 to 11
      const afterProduct = (await mockApi('/catalog/mock-cesta')) as Product;
      assert.equal(afterProduct.stock.available, 11);

      // Cart should now be empty
      const emptyCart = (await mockApi('/cart')) as Cart;
      assert.equal(emptyCart.data.length, 0);

      // Repeating checkout with same idempotency key returns identical order without error
      const orderDuplicate = (await mockApi('/checkout', {
        method: 'POST',
        headers: { 'x-idempotency-key': 'idem-key-123' },
        body: JSON.stringify({ address }),
      })) as Order;
      assert.equal(orderDuplicate.id, order1.id);

      // Confirming delivery transitions order status to Entregue
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
});

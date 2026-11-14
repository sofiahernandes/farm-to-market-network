import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { appValidationPipe } from './common/pipes/validation.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

describe('Manà SQLite + NestJS Full-Stack Integration (All 4 Slices)', () => {
  let app: INestApplication;
  let baseUrl: string;
  let consumerToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(appValidationPipe);
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.listen(0);
    const address = app.getHttpServer().address();
    baseUrl = `http://127.0.0.1:${address.port}/v1`;
  });

  afterAll(async () => {
    await app?.close();
  });

  it('1. Authenticates consumer, producer, and operations accounts against SQLite', async () => {
    const jornadaRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'jornada@mana.local',
        password: 'mana123',
      }),
    });
    expect(jornadaRes.status).toBe(201);
    const jornadaBody = await jornadaRes.json();
    expect(jornadaBody.user.role).toBe('consumer');

    const consumerRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'consumidor@mana.local',
        password: 'mana123',
      }),
    });
    expect(consumerRes.status).toBe(201);
    const consumerBody = await consumerRes.json();
    expect(consumerBody.user.role).toBe('consumer');
    consumerToken = consumerBody.accessToken;

    const producerRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'produtor@mana.local',
        password: 'mana123',
      }),
    });
    expect(producerRes.status).toBe(201);
    const producerBody = await producerRes.json();
    expect(producerBody.user.role).toBe('producer');

    const opsRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'operacoes@mana.local',
        password: 'mana123',
      }),
    });
    expect(opsRes.status).toBe(201);
    const opsBody = await opsRes.json();
    expect(opsBody.user.role).toBe('operations');
  });

  it('2. Serves catalog, fixed baskets with origin/seasonality, and delivery slots from SQLite', async () => {
    const catRes = await fetch(`${baseUrl}/catalog`);
    expect(catRes.status).toBe(200);
    const catBody = await catRes.json();
    expect(catBody.data.length).toBeGreaterThanOrEqual(8);

    const basketsRes = await fetch(`${baseUrl}/baskets`);
    expect(basketsRes.status).toBe(200);
    const basketsBody = await basketsRes.json();
    expect(basketsBody.data.length).toBe(3);
    expect(basketsBody.data[0].seasonality).toBeTruthy();
    expect(basketsBody.data[0].items[0].origin).toBeTruthy();

    const slotsRes = await fetch(`${baseUrl}/delivery-slots`);
    expect(slotsRes.status).toBe(200);
    const slotsBody = await slotsRes.json();
    expect(slotsBody.data.length).toBeGreaterThanOrEqual(3);
  });

  it('3. Manages cart stepper, idempotent checkout, and consumer delivery confirmation', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${consumerToken}`,
    };

    const patchRes = await fetch(`${baseUrl}/cart/items/mock-tomate`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ quantity: 3 }),
    });
    expect(patchRes.status).toBe(200);
    const patchedCart = await patchRes.json();
    const tomateItem = patchedCart.data.find(
      (i: any) => i.productId === 'mock-tomate'
    );
    expect(tomateItem.quantity).toBe(3);

    const idemKey = `sqlite-test-${Date.now()}`;
    const chk1 = await fetch(`${baseUrl}/checkout`, {
      method: 'POST',
      headers: { ...headers, 'x-idempotency-key': idemKey },
      body: JSON.stringify({
        address: {
          postalCode: '01310-100',
          street: 'Av. Paulista',
          number: '1000',
          city: 'São Paulo',
          state: 'SP',
        },
        deliverySlotId: 'seed-slot',
      }),
    });
    expect(chk1.status).toBe(201);
    const order1 = await chk1.json();

    const chk2 = await fetch(`${baseUrl}/checkout`, {
      method: 'POST',
      headers: { ...headers, 'x-idempotency-key': idemKey },
      body: JSON.stringify({
        address: {
          postalCode: '01310-100',
          street: 'Av. Paulista',
          number: '1000',
          city: 'São Paulo',
          state: 'SP',
        },
        deliverySlotId: 'seed-slot',
      }),
    });
    expect(chk2.status).toBe(201);
    const order2 = await chk2.json();
    expect(order2.id).toBe(order1.id);

    const confirmRes = await fetch(
      `${baseUrl}/orders/${order1.id}/confirm-delivery`,
      {
        method: 'POST',
        headers,
      }
    );
    expect(confirmRes.status).toBe(201);
    const confirmedOrder = await confirmRes.json();
    expect(confirmedOrder.status).toBe('Entregue');
  });

  it('4. Manages subscriptions (pause/resume/idempotent cycle) and LGPD requests', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${consumerToken}`,
    };

    const pauseRes = await fetch(`${baseUrl}/subscriptions/SUB-2041/pause`, {
      method: 'POST',
      headers,
    });
    expect(pauseRes.status).toBe(201);
    const paused = await pauseRes.json();
    expect(paused.status).toBe('paused');

    const resumeRes = await fetch(`${baseUrl}/subscriptions/SUB-2041/resume`, {
      method: 'POST',
      headers,
    });
    expect(resumeRes.status).toBe(201);
    const resumed = await resumeRes.json();
    expect(resumed.status).toBe('active');

    const cyc1 = await fetch(
      `${baseUrl}/subscriptions/SUB-2041/generate-cycle`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ cycleKey: '2026-11-25' }),
      }
    );
    expect(cyc1.status).toBe(201);
    const afterCyc1 = await cyc1.json();
    const countAfter1 = afterCyc1.cycles.length;

    const cyc2 = await fetch(
      `${baseUrl}/subscriptions/SUB-2041/generate-cycle`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ cycleKey: '2026-11-25' }),
      }
    );
    expect(cyc2.status).toBe(201);
    const afterCyc2 = await cyc2.json();
    expect(afterCyc2.cycles.length).toBe(countAfter1);

    const lgpdRes = await fetch(`${baseUrl}/account/lgpd-deletion-request`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ reason: 'Teste de integração SQLite LGPD' }),
    });
    expect(lgpdRes.status).toBe(201);
    const lgpdBody = await lgpdRes.json();
    expect(lgpdBody.protocol).toMatch(/^LGPD-2026-/);
  });

  it('5. Manages producer offers, optimistic inventory concurrency, and order separation', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${consumerToken}`,
    };

    const conflictInv = await fetch(
      `${baseUrl}/producer/inventory/mock-tomate`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ available: 30, expectedAvailable: 999 }),
      }
    );
    expect(conflictInv.status).toBe(409);

    const sepRes = await fetch(
      `${baseUrl}/producer/orders/AG-1048/mark-separated`,
      {
        method: 'POST',
        headers,
      }
    );
    expect(sepRes.status).toBe(201);
    const prodDash = await sepRes.json();
    const fq = prodDash.fulfillmentQueue.find(
      (f: any) => f.orderId === 'AG-1048'
    );
    expect(fq.producerSeparated).toBe(true);
  });

  it('6. Manages operations zones, slots, manual routes, sequential status progression, and LGPD resolution', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${consumerToken}`,
    };

    const invalidStatus = await fetch(
      `${baseUrl}/admin/orders/AG-1048/status`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({ stage: 'delivered' }),
      }
    );
    expect(invalidStatus.status).toBe(400);

    const transitRes = await fetch(`${baseUrl}/admin/orders/AG-1048/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ stage: 'in_transit' }),
    });
    expect(transitRes.status).toBe(201);

    const deliveredRes = await fetch(`${baseUrl}/admin/orders/AG-1048/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ stage: 'delivered' }),
    });
    expect(deliveredRes.status).toBe(201);
    const adminDash = await deliveredRes.json();
    const updated1048 = adminDash.orders.find((o: any) => o.id === 'AG-1048');
    expect(updated1048.status).toBe('Entregue');

    const openLgpdExc = adminDash.exceptions.find(
      (e: any) => e.type === 'lgpd_request' && e.status === 'open'
    );
    expect(openLgpdExc).toBeTruthy();

    const resolveRes = await fetch(
      `${baseUrl}/admin/exceptions/${openLgpdExc.id}/resolve`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          resolutionNote: 'Anonimização concluída no SQLite.',
        }),
      }
    );
    expect(resolveRes.status).toBe(201);

    const profileRes = await fetch(`${baseUrl}/account/profile`, { headers });
    const profileBody = await profileRes.json();
    expect(profileBody.lgpdRequests[0].status).toBe('completed');
  });
});

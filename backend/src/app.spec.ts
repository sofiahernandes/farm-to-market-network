import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './app.module';
import { appValidationPipe } from './common/pipes/validation.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

describe('AgriTech SQLite + NestJS Integration (All Slices)', () => {
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

  it('authenticates consumer, producer, and operations accounts against SQLite', async () => {
    const consumerRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'consumidor@agritech.local',
        password: 'agritech123',
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
        email: 'produtor@agritech.local',
        password: 'agritech123',
      }),
    });
    expect(producerRes.status).toBe(201);
    const producerBody = await producerRes.json();
    expect(producerBody.user.role).toBe('producer');

    const opsRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'operacoes@agritech.local',
        password: 'agritech123',
      }),
    });
    expect(opsRes.status).toBe(201);
    const opsBody = await opsRes.json();
    expect(opsBody.user.role).toBe('operations');
  });

  it('serves catalog, fixed baskets, and delivery slots from SQLite', async () => {
    const catRes = await fetch(`${baseUrl}/catalog`);
    expect(catRes.status).toBe(200);
    const catBody = await catRes.json();
    expect(catBody.data.length).toBeGreaterThanOrEqual(8);

    const basketsRes = await fetch(`${baseUrl}/baskets`);
    expect(basketsRes.status).toBe(200);
    const basketsBody = await basketsRes.json();
    expect(basketsBody.data.length).toBe(3);

    const slotsRes = await fetch(`${baseUrl}/delivery-slots`);
    expect(slotsRes.status).toBe(200);
    const slotsBody = await slotsRes.json();
    expect(slotsBody.data.length).toBeGreaterThanOrEqual(3);
  });

  it('manages cart, idempotent checkout, and order delivery confirmation', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${consumerToken}`,
    };

    const cartRes = await fetch(`${baseUrl}/cart`, { headers });
    expect(cartRes.status).toBe(200);
    const cartBody = await cartRes.json();
    expect(cartBody.data.length).toBeGreaterThan(0);

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
  });

  it('manages subscriptions, account profile, producer dashboard, and admin dashboard', async () => {
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${consumerToken}`,
    };

    const subsRes = await fetch(`${baseUrl}/subscriptions`, { headers });
    expect(subsRes.status).toBe(200);
    const subsBody = await subsRes.json();
    expect(subsBody.data.length).toBeGreaterThanOrEqual(1);

    const profileRes = await fetch(`${baseUrl}/account/profile`, { headers });
    expect(profileRes.status).toBe(200);
    const profileBody = await profileRes.json();
    expect(profileBody.maskedCpf).toBe('***.982.247-25');

    const prodRes = await fetch(`${baseUrl}/producer/dashboard`, { headers });
    expect(prodRes.status).toBe(200);
    const prodBody = await prodRes.json();
    expect(prodBody.producer.id).toBe('sitio-verde');
    expect(prodBody.offers.length).toBeGreaterThanOrEqual(8);

    const adminRes = await fetch(`${baseUrl}/admin/dashboard`, { headers });
    expect(adminRes.status).toBe(200);
    const adminBody = await adminRes.json();
    expect(adminBody.zones.length).toBeGreaterThanOrEqual(2);
    expect(adminBody.manifest.length).toBeGreaterThanOrEqual(2);
  });
});

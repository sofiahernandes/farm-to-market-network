import type { AuthResponse, Cart, CartItem, CatalogResponse, Order, Product } from './api';

export const DEMO_CREDENTIALS = {
  email: 'jornada@agritech.local',
  password: 'agritech123',
};

const products: Product[] = [
  { id: 'mock-cesta', name: 'Cesta da semana', description: 'Seleção variada de folhas, legumes e frutas da colheita desta semana.', category: 'Cestas', unit: 'cesta', priceCents: 6490, producer: { id: 'sitio-verde', name: 'Sítio Verde' }, stock: { available: 12, deliveryDate: '2026-11-03T11:00:00.000Z' } },
  { id: 'mock-tomate', name: 'Tomate italiano orgânico', description: 'Tomates maduros, cultivados sem agrotóxicos abusivos e colhidos no dia.', category: 'Hortaliças', unit: 'kg', priceCents: 1490, producer: { id: 'vale-sol', name: 'Vale do Sol' }, stock: { available: 24, deliveryDate: '2026-11-03T11:00:00.000Z' } },
  { id: 'mock-alface', name: 'Alface crespa', description: 'Folhas crocantes e frescas para as refeições da semana.', category: 'Hortaliças', unit: 'unidade', priceCents: 590, producer: { id: 'horta-irmaos', name: 'Horta dos Irmãos' }, stock: { available: 36, deliveryDate: '2026-11-03T11:00:00.000Z' } },
  { id: 'mock-cenoura', name: 'Cenoura baby', description: 'Cenouras doces, recém-colhidas e lavadas na propriedade.', category: 'Hortaliças', unit: '500 g', priceCents: 890, producer: { id: 'sitio-verde', name: 'Sítio Verde' }, stock: { available: 18, deliveryDate: '2026-11-05T11:00:00.000Z' } },
  { id: 'mock-ovos', name: 'Ovos caipiras', description: 'Dúzia de ovos de galinhas criadas soltas, de pequenos produtores locais.', category: 'Granja', unit: 'dúzia', priceCents: 1890, producer: { id: 'granja-feliz', name: 'Granja Feliz' }, stock: { available: 20, deliveryDate: '2026-11-05T11:00:00.000Z' } },
  { id: 'mock-morango', name: 'Morango da estação', description: 'Morangos doces e perfumados, selecionados à mão.', category: 'Frutas', unit: 'bandeja', priceCents: 1290, producer: { id: 'pomar-serra', name: 'Pomar da Serra' }, stock: { available: 9, deliveryDate: '2026-11-05T11:00:00.000Z' } },
];

function makeCartItem(productId: string, quantity: number): CartItem {
  const product = products.find((item) => item.id === productId);
  if (!product) throw new Error('Oferta não encontrada.');
  return { productId, name: product.name, quantity, unitPriceCents: product.priceCents, subtotalCents: product.priceCents * quantity, available: product.stock.available };
}

const defaultCart: CartItem[] = [makeCartItem('mock-cesta', 1), makeCartItem('mock-tomate', 2)];
const defaultAddress = { postalCode: '01310-100', street: 'Avenida Paulista', number: '1000', complement: 'Apto. 42', city: 'São Paulo', state: 'SP' };

function makeOrder(id: string, status: string, itemIds: Array<[string, number]>, createdAt: string): Order {
  const items = itemIds.map(([productId, quantity]) => makeCartItem(productId, quantity));
  const totalCents = items.reduce((total, item) => total + item.subtotalCents, 0);
  return {
    id, status, totalCents, idempotencyKey: `mock-${id}`,
    items: items.map(({ productId, name, quantity, unitPriceCents }) => ({ productId, name, quantity, unitPriceCents })),
    payment: { provider: 'Pagamento sandbox', status: 'approved' },
    delivery: { status: status === 'Entregue' ? 'delivered' : 'scheduled', confirmedAt: createdAt }, address: defaultAddress,
    deliverySlot: { id: 'seed-slot', startsAt: '2026-11-03T11:00:00.000Z', endsAt: '2026-11-03T15:00:00.000Z' },
    statusHistory: [{ toStatus: 'Pedido confirmado', createdAt }, { toStatus: status, createdAt: new Date(new Date(createdAt).getTime() + 60 * 60 * 1000).toISOString() }],
  };
}

const defaultOrders = [makeOrder('AG-1048', 'Em preparação', [['mock-ovos', 1], ['mock-alface', 2]], '2026-10-28T13:00:00.000Z'), makeOrder('AG-1037', 'Entregue', [['mock-cesta', 1], ['mock-morango', 1]], '2026-10-21T13:00:00.000Z')];
const storageKeys = { cart: 'agritech_mock_cart', orders: 'agritech_mock_orders' };

function storage() { return typeof window === 'undefined' ? null : window.localStorage; }
function read<T>(key: string, fallback: T): T { try { const value = storage()?.getItem(key); return value ? JSON.parse(value) as T : fallback; } catch { return fallback; } }
function write<T>(key: string, value: T) { storage()?.setItem(key, JSON.stringify(value)); }
function cart(): Cart { const data = read<CartItem[]>(storageKeys.cart, defaultCart); return { data, totalCents: data.reduce((total, item) => total + item.subtotalCents, 0), currency: 'BRL' }; }
function orders() { return read<Order[]>(storageKeys.orders, defaultOrders); }
function authResponse(email = DEMO_CREDENTIALS.email): AuthResponse { return { accessToken: 'mock-local-session', tokenType: 'Bearer', expiresIn: 7200, user: { id: 'mock-consumer', email, role: 'consumer' } }; }

function createOrder(body: { address: Order['address'] }): Order {
  const currentCart = cart();
  if (!currentCart.data.length) throw new Error('Sua sacola está vazia.');
  const now = new Date().toISOString();
  const order = makeOrder(`AG-${Math.floor(1000 + Math.random() * 9000)}`, 'Em preparação', currentCart.data.map((item) => [item.productId, item.quantity]), now);
  order.address = body.address;
  write(storageKeys.orders, [order, ...orders()]);
  write<CartItem[]>(storageKeys.cart, []);
  return order;
}

/** Browser-only API simulator used when NEXT_PUBLIC_USE_MOCK_DATA is not "false". */
export async function mockApi(path: string, options: RequestInit = {}): Promise<unknown> {
  await new Promise((resolve) => setTimeout(resolve, 120));
  const method = (options.method ?? 'GET').toUpperCase();
  const [pathname, queryString] = path.split('?');
  const body = options.body ? JSON.parse(String(options.body)) : undefined;

  if (pathname === '/auth/login' && method === 'POST') {
    if (body.email?.trim().toLowerCase() !== DEMO_CREDENTIALS.email || body.password !== DEMO_CREDENTIALS.password) throw new Error('Use as credenciais de demonstração para entrar.');
    return authResponse();
  }
  if (pathname === '/auth/register' && method === 'POST') return authResponse(body.email);
  if (pathname === '/catalog' && method === 'GET') {
    const query = new URLSearchParams(queryString);
    const search = query.get('search')?.toLocaleLowerCase('pt-BR') ?? '';
    const category = query.get('category') ?? '';
    const data = products.filter((product) => (!category || product.category === category) && (!search || `${product.name} ${product.description} ${product.producer.name}`.toLocaleLowerCase('pt-BR').includes(search)));
    const response: CatalogResponse = { data, pagination: { limit: 20, offset: 0, count: data.length, nextOffset: null } };
    return response;
  }
  if (pathname.startsWith('/catalog/') && method === 'GET') { const product = products.find((item) => item.id === pathname.replace('/catalog/', '')); if (!product) throw new Error('Oferta não encontrada.'); return product; }
  if (pathname === '/cart' && method === 'GET') return cart();
  if (pathname === '/cart/items' && method === 'POST') {
    const current = cart().data; const index = current.findIndex((item) => item.productId === body.productId);
    if (index >= 0) current[index] = makeCartItem(body.productId, current[index].quantity + body.quantity); else current.push(makeCartItem(body.productId, body.quantity));
    write(storageKeys.cart, current); return cart();
  }
  if (pathname.startsWith('/cart/items/') && method === 'DELETE') { write(storageKeys.cart, cart().data.filter((item) => item.productId !== pathname.replace('/cart/items/', ''))); return cart(); }
  if (pathname === '/orders' && method === 'GET') return { data: orders() };
  if (pathname.startsWith('/orders/') && method === 'GET') { const order = orders().find((item) => item.id === pathname.replace('/orders/', '')); if (!order) throw new Error('Pedido não encontrado.'); return order; }
  if (pathname === '/checkout' && method === 'POST') return createOrder(body);
  throw new Error(`Rota mock não implementada: ${method} ${pathname}`);
}

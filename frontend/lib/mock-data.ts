import type {
  AuthResponse,
  Cart,
  CartItem,
  CatalogResponse,
  DeliverySlotOption,
  Order,
  Product,
} from './api';

export const DEMO_CREDENTIALS = {
  email: 'jornada@agritech.local',
  password: 'agritech123',
};

export const DEMO_CPF = '529.982.247-25';

export const MOCK_DELIVERY_SLOTS: DeliverySlotOption[] = [
  {
    id: 'seed-slot',
    label: 'Terça-feira, 08h–12h · Rota Manhã (Confirmada pelo produtor)',
    startsAt: '2026-11-03T11:00:00.000Z',
    endsAt: '2026-11-03T15:00:00.000Z',
  },
  {
    id: 'seed-slot-tarde',
    label: 'Terça-feira, 14h–18h · Rota Tarde (Confirmada pelo produtor)',
    startsAt: '2026-11-03T17:00:00.000Z',
    endsAt: '2026-11-03T21:00:00.000Z',
  },
  {
    id: 'seed-slot-quinta',
    label: 'Quinta-feira, 08h–12h · Colheita de Meio de Semana',
    startsAt: '2026-11-05T11:00:00.000Z',
    endsAt: '2026-11-05T15:00:00.000Z',
  },
];

export function isValidCpf(input: string): boolean {
  const cpf = (input ?? '').replace(/\D/g, '');
  if (cpf.length !== 11 || /^([0-9])\1+$/.test(cpf)) return false;
  const digit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

const baseProducts: Product[] = [
  {
    id: 'mock-cesta',
    name: 'Cesta da semana',
    description:
      'Seleção variada de folhas, legumes e frutas da colheita desta semana.',
    category: 'Cestas',
    unit: 'cesta',
    priceCents: 6490,
    producer: { id: 'sitio-verde', name: 'Sítio Verde' },
    stock: { available: 12, deliveryDate: '2026-11-03T11:00:00.000Z' },
  },
  {
    id: 'mock-tomate',
    name: 'Tomate italiano orgânico',
    description:
      'Tomates maduros, cultivados sem agrotóxicos abusivos e colhidos no dia.',
    category: 'Hortaliças',
    unit: 'kg',
    priceCents: 1490,
    producer: { id: 'vale-sol', name: 'Vale do Sol' },
    stock: { available: 24, deliveryDate: '2026-11-03T11:00:00.000Z' },
  },
  {
    id: 'mock-alface',
    name: 'Alface crespa',
    description: 'Folhas crocantes e frescas para as refeições da semana.',
    category: 'Hortaliças',
    unit: 'unidade',
    priceCents: 590,
    producer: { id: 'horta-irmaos', name: 'Horta dos Irmãos' },
    stock: { available: 36, deliveryDate: '2026-11-03T11:00:00.000Z' },
  },
  {
    id: 'mock-cenoura',
    name: 'Cenoura baby',
    description: 'Cenouras doces, recém-colhidas e lavadas na propriedade.',
    category: 'Hortaliças',
    unit: '500 g',
    priceCents: 890,
    producer: { id: 'sitio-verde', name: 'Sítio Verde' },
    stock: { available: 18, deliveryDate: '2026-11-05T11:00:00.000Z' },
  },
  {
    id: 'mock-ovos',
    name: 'Ovos caipiras',
    description:
      'Dúzia de ovos de galinhas criadas soltas, de pequenos produtores locais.',
    category: 'Granja',
    unit: 'dúzia',
    priceCents: 1890,
    producer: { id: 'granja-feliz', name: 'Granja Feliz' },
    stock: { available: 20, deliveryDate: '2026-11-05T11:00:00.000Z' },
  },
  {
    id: 'mock-morango',
    name: 'Morango da estação',
    description: 'Morangos doces e perfumados, selecionados à mão.',
    category: 'Frutas',
    unit: 'bandeja',
    priceCents: 1290,
    producer: { id: 'pomar-serra', name: 'Pomar da Serra' },
    stock: { available: 9, deliveryDate: '2026-11-05T11:00:00.000Z' },
  },
];

type StoredUser = {
  id: string;
  email: string;
  cpf: string;
  password: string;
  role: string;
};

const storageKeys = {
  cart: 'agritech_mock_cart',
  orders: 'agritech_mock_orders',
  stock: 'agritech_mock_stock',
  users: 'agritech_mock_users',
};

const memoryStore = new Map<string, string>();

function getStore(): {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
} {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return {
    getItem: (key) => memoryStore.get(key) ?? null,
    setItem: (key, value) => {
      memoryStore.set(key, value);
    },
    removeItem: (key) => {
      memoryStore.delete(key);
    },
  };
}

function read<T>(key: string, fallback: T): T {
  try {
    const value = getStore().getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  getStore().setItem(key, JSON.stringify(value));
}

export function resetMockState() {
  const store = getStore();
  Object.values(storageKeys).forEach((key) => store.removeItem(key));
  memoryStore.clear();
}

function stockMap(): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const product of baseProducts) {
    defaults[product.id] = product.stock.available;
  }
  return { ...defaults, ...read<Record<string, number>>(storageKeys.stock, {}) };
}

function currentProducts(): Product[] {
  const stocks = stockMap();
  return baseProducts.map((product) => ({
    ...product,
    stock: {
      ...product.stock,
      available: Math.max(0, stocks[product.id] ?? product.stock.available),
    },
  }));
}

function makeCartItem(productId: string, quantity: number): CartItem {
  const product = currentProducts().find((item) => item.id === productId);
  if (!product) throw new Error('Oferta não encontrada.');
  return {
    productId,
    name: product.name,
    quantity,
    unitPriceCents: product.priceCents,
    subtotalCents: product.priceCents * quantity,
    available: product.stock.available,
  };
}

const defaultAddress = {
  postalCode: '01310-100',
  street: 'Avenida Paulista',
  number: '1000',
  complement: 'Apto. 42',
  city: 'São Paulo',
  state: 'SP',
};

function makeOrder(
  id: string,
  status: string,
  itemIds: Array<[string, number]>,
  createdAt: string,
  slotId = 'seed-slot',
  idempotencyKey = `mock-${id}`
): Order {
  const items = itemIds.map(([productId, quantity]) =>
    makeCartItem(productId, quantity)
  );
  const totalCents = items.reduce((total, item) => total + item.subtotalCents, 0);
  const slot =
    MOCK_DELIVERY_SLOTS.find((s) => s.id === slotId) ?? MOCK_DELIVERY_SLOTS[0];
  return {
    id,
    status,
    totalCents,
    idempotencyKey,
    items: items.map(({ productId, name, quantity, unitPriceCents }) => ({
      productId,
      name,
      quantity,
      unitPriceCents,
    })),
    payment: { provider: 'Pagamento sandbox', status: 'approved' },
    delivery: {
      status: status === 'Entregue' ? 'delivered' : 'scheduled',
      confirmedAt: createdAt,
    },
    address: defaultAddress,
    deliverySlot: { id: slot.id, startsAt: slot.startsAt, endsAt: slot.endsAt },
    statusHistory: [
      { toStatus: 'Pedido confirmado', createdAt },
      {
        toStatus: status,
        createdAt: new Date(
          new Date(createdAt).getTime() + 60 * 60 * 1000
        ).toISOString(),
      },
    ],
  };
}

function defaultCartItems(): CartItem[] {
  return [makeCartItem('mock-cesta', 1), makeCartItem('mock-tomate', 2)];
}

function defaultOrdersList(): Order[] {
  return [
    makeOrder(
      'AG-1048',
      'Em preparação',
      [
        ['mock-ovos', 1],
        ['mock-alface', 2],
      ],
      '2026-10-28T13:00:00.000Z'
    ),
    makeOrder(
      'AG-1037',
      'Entregue',
      [
        ['mock-cesta', 1],
        ['mock-morango', 1],
      ],
      '2026-10-21T13:00:00.000Z'
    ),
  ];
}

function cart(): Cart {
  const raw = read<CartItem[]>(storageKeys.cart, defaultCartItems());
  const stocks = stockMap();
  const data = raw.map((item) => ({
    ...item,
    subtotalCents: item.unitPriceCents * item.quantity,
    available: Math.max(0, stocks[item.productId] ?? item.available),
  }));
  return {
    data,
    totalCents: data.reduce((total, item) => total + item.subtotalCents, 0),
    currency: 'BRL',
  };
}

function orders(): Order[] {
  return read<Order[]>(storageKeys.orders, defaultOrdersList());
}

function authResponse(
  email = DEMO_CREDENTIALS.email,
  role = 'consumer',
  id = 'mock-consumer'
): AuthResponse {
  return {
    accessToken: `mock-local-session-${id}`,
    tokenType: 'Bearer',
    expiresIn: 7200,
    user: { id, email, role },
  };
}

function extractHeader(
  headers: HeadersInit | undefined,
  name: string
): string | undefined {
  if (!headers) return undefined;
  const target = name.toLowerCase();
  if (headers instanceof Headers) return headers.get(name) ?? undefined;
  if (Array.isArray(headers)) {
    const found = headers.find(([k]) => k.toLowerCase() === target);
    return found?.[1];
  }
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === target) return v;
  }
  return undefined;
}

function createOrder(
  body: { address: Order['address']; deliverySlotId?: string },
  idempotencyKey?: string
): Order {
  if (idempotencyKey) {
    const existing = orders().find((o) => o.idempotencyKey === idempotencyKey);
    if (existing) return existing;
  }

  const currentCart = cart();
  if (!currentCart.data.length) throw new Error('Sua sacola está vazia.');

  const addr = body?.address;
  if (
    !addr?.postalCode?.trim() ||
    !addr?.street?.trim() ||
    !addr?.number?.trim() ||
    !addr?.city?.trim() ||
    !addr?.state?.trim()
  ) {
    throw new Error('Preencha todos os campos obrigatórios do endereço.');
  }

  const stocks = stockMap();
  for (const item of currentCart.data) {
    const available = stocks[item.productId] ?? 0;
    if (item.quantity > available) {
      throw new Error(
        `Estoque insuficiente para ${item.name}. Disponível no lote: ${available}.`
      );
    }
  }

  for (const item of currentCart.data) {
    stocks[item.productId] = Math.max(
      0,
      (stocks[item.productId] ?? 0) - item.quantity
    );
  }
  write(storageKeys.stock, stocks);

  const now = new Date().toISOString();
  const orderId = `AG-${Math.floor(1000 + Math.random() * 9000)}`;
  const order = makeOrder(
    orderId,
    'Em preparação',
    currentCart.data.map((item) => [item.productId, item.quantity]),
    now,
    body.deliverySlotId || 'seed-slot',
    idempotencyKey || `mock-${orderId}`
  );
  order.address = {
    postalCode: addr.postalCode.trim(),
    street: addr.street.trim(),
    number: addr.number.trim(),
    complement: addr.complement?.trim() || undefined,
    city: addr.city.trim(),
    state: addr.state.trim().toUpperCase(),
  };
  write(storageKeys.orders, [order, ...orders()]);
  write<CartItem[]>(storageKeys.cart, []);
  return order;
}

/** Browser & local test API simulator used when NEXT_PUBLIC_USE_MOCK_DATA is not "false". */
export async function mockApi(
  path: string,
  options: RequestInit = {}
): Promise<unknown> {
  if (typeof window !== 'undefined') {
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  const method = (options.method ?? 'GET').toUpperCase();
  const [pathname, queryString] = path.split('?');
  const body = options.body ? JSON.parse(String(options.body)) : undefined;

  if (pathname === '/auth/login' && method === 'POST') {
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;
    if (
      email === DEMO_CREDENTIALS.email &&
      password === DEMO_CREDENTIALS.password
    ) {
      return authResponse();
    }
    const users = read<StoredUser[]>(storageKeys.users, []);
    const matched = users.find(
      (u) => u.email === email && u.password === password
    );
    if (matched) {
      return authResponse(matched.email, matched.role, matched.id);
    }
    throw new Error(
      'Credenciais inválidas. Use a conta de demonstração ou uma conta cadastrada.'
    );
  }

  if (pathname === '/auth/register' && method === 'POST') {
    const email = body?.email?.trim().toLowerCase();
    const cpf = (body?.cpf ?? '').replace(/\D/g, '');
    const password = body?.password ?? '';

    if (!email || !email.includes('@')) {
      throw new Error('Informe um email válido.');
    }
    if (!isValidCpf(cpf)) {
      throw new Error('CPF inválido. Informe um CPF válido de 11 dígitos.');
    }
    if (password.length < 8) {
      throw new Error('A senha deve ter pelo menos 8 caracteres.');
    }

    const users = read<StoredUser[]>(storageKeys.users, []);
    if (
      email === DEMO_CREDENTIALS.email ||
      users.some((u) => u.email === email || u.cpf === cpf)
    ) {
      throw new Error('Email ou CPF já cadastrado neste ambiente.');
    }

    const newUser: StoredUser = {
      id: `user-${ users.length + 1 }`,
      email,
      cpf,
      password,
      role: 'consumer',
    };
    write(storageKeys.users, [...users, newUser]);
    return authResponse(newUser.email, newUser.role, newUser.id);
  }

  if (pathname === '/delivery-slots' && method === 'GET') {
    return { data: MOCK_DELIVERY_SLOTS };
  }

  if (pathname === '/catalog' && method === 'GET') {
    const query = new URLSearchParams(queryString);
    const search = query.get('search')?.toLocaleLowerCase('pt-BR') ?? '';
    const category = query.get('category') ?? '';
    const all = currentProducts();
    const data = all.filter(
      (product) =>
        (!category || product.category === category) &&
        (!search ||
          `${product.name} ${product.description} ${product.producer.name}`
            .toLocaleLowerCase('pt-BR')
            .includes(search))
    );
    const response: CatalogResponse = {
      data,
      pagination: {
        limit: 20,
        offset: 0,
        count: data.length,
        nextOffset: null,
      },
    };
    return response;
  }

  if (pathname.startsWith('/catalog/') && method === 'GET') {
    const product = currentProducts().find(
      (item) => item.id === pathname.replace('/catalog/', '')
    );
    if (!product) throw new Error('Oferta não encontrada.');
    return product;
  }

  if (pathname === '/cart' && method === 'GET') return cart();

  if (pathname === '/cart/items' && method === 'POST') {
    const quantityToAdd = Number(body?.quantity ?? 0);
    if (!Number.isInteger(quantityToAdd) || quantityToAdd < 1) {
      throw new Error('A quantidade deve ser de pelo menos 1 unidade.');
    }
    const product = currentProducts().find((p) => p.id === body?.productId);
    if (!product) throw new Error('Oferta não encontrada.');

    const current = cart().data;
    const index = current.findIndex((item) => item.productId === body.productId);
    const nextQty =
      index >= 0 ? current[index].quantity + quantityToAdd : quantityToAdd;

    if (nextQty > product.stock.available) {
      throw new Error(
        `Quantidade indisponível. O lote de ${product.name} possui ${product.stock.available} disponível(is).`
      );
    }

    if (index >= 0) {
      current[index] = makeCartItem(body.productId, nextQty);
    } else {
      current.push(makeCartItem(body.productId, nextQty));
    }
    write(storageKeys.cart, current);
    return cart();
  }

  if (pathname.startsWith('/cart/items/') && method === 'PATCH') {
    const productId = pathname.replace('/cart/items/', '');
    const nextQty = Number(body?.quantity ?? 0);
    if (!Number.isInteger(nextQty)) {
      throw new Error('Quantidade inválida.');
    }
    if (nextQty <= 0) {
      write(
        storageKeys.cart,
        cart().data.filter((item) => item.productId !== productId)
      );
      return cart();
    }
    const product = currentProducts().find((p) => p.id === productId);
    if (!product) throw new Error('Oferta não encontrada.');
    if (nextQty > product.stock.available) {
      throw new Error(
        `Quantidade máxima disponível no lote: ${product.stock.available}.`
      );
    }
    const current = cart().data;
    const index = current.findIndex((item) => item.productId === productId);
    if (index >= 0) {
      current[index] = makeCartItem(productId, nextQty);
    } else {
      current.push(makeCartItem(productId, nextQty));
    }
    write(storageKeys.cart, current);
    return cart();
  }

  if (pathname.startsWith('/cart/items/') && method === 'DELETE') {
    write(
      storageKeys.cart,
      cart().data.filter(
        (item) => item.productId !== pathname.replace('/cart/items/', '')
      )
    );
    return cart();
  }

  if (pathname === '/orders' && method === 'GET') return { data: orders() };

  if (
    pathname.startsWith('/orders/') &&
    pathname.endsWith('/confirm-delivery') &&
    method === 'POST'
  ) {
    const orderId = pathname
      .replace('/orders/', '')
      .replace('/confirm-delivery', '');
    const list = orders();
    const index = list.findIndex((item) => item.id === orderId);
    if (index < 0) throw new Error('Pedido não encontrado.');
    const target = list[index];
    if (target.status !== 'Entregue') {
      const now = new Date().toISOString();
      target.status = 'Entregue';
      target.delivery = { status: 'delivered', confirmedAt: now };
      target.statusHistory = [
        ...target.statusHistory,
        { toStatus: 'Entregue (confirmado pelo consumidor)', createdAt: now },
      ];
      list[index] = target;
      write(storageKeys.orders, list);
    }
    return target;
  }

  if (pathname.startsWith('/orders/') && method === 'GET') {
    const order = orders().find(
      (item) => item.id === pathname.replace('/orders/', '')
    );
    if (!order) throw new Error('Pedido não encontrado.');
    return order;
  }

  if (pathname === '/checkout' && method === 'POST') {
    const idempotencyKey = extractHeader(options.headers, 'x-idempotency-key');
    return createOrder(body, idempotencyKey);
  }

  throw new Error(`Rota mock não implementada: ${method} ${pathname}`);
}

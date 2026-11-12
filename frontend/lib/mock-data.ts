import type {
  AccountProfile,
  AdminDashboardData,
  AdminDeliverySlot,
  AdminExceptionItem,
  AdminManifestEntry,
  AdminManualRoute,
  AdminServiceZone,
  AuthResponse,
  Basket,
  Cart,
  CartItem,
  CatalogResponse,
  DeliverySlotOption,
  LgpdDeletionRequest,
  Order,
  ProducerAuditEntry,
  ProducerCertification,
  ProducerDashboardData,
  ProducerFulfillmentItem,
  ProducerHarvestSummary,
  ProducerPayoutItem,
  Product,
  SavedAddress,
  Subscription,
  SubscriptionCycle,
} from './api';

export const DEMO_CREDENTIALS = {
  email: 'jornada@agritech.local',
  password: 'agritech123',
};

export const DEMO_PRODUCER_CREDENTIALS = {
  email: 'produtor@agritech.local',
  password: 'agritech123',
};

export const DEMO_OPERATIONS_CREDENTIALS = {
  email: 'operacoes@agritech.local',
  password: 'agritech123',
};

export type OrderStage =
  | 'pending_payment'
  | 'confirmed'
  | 'preparing'
  | 'in_transit'
  | 'delivered';

export const ORDER_STATUS_FLOW: OrderStage[] = [
  'pending_payment',
  'confirmed',
  'preparing',
  'in_transit',
  'delivered',
];

export function canTransitionOrder(from: OrderStage, to: OrderStage): boolean {
  return ORDER_STATUS_FLOW.indexOf(to) === ORDER_STATUS_FLOW.indexOf(from) + 1;
}

export function stageToConsumerLabel(stage: OrderStage): string {
  switch (stage) {
    case 'pending_payment':
      return 'Pagamento pendente';
    case 'confirmed':
      return 'Pedido confirmado';
    case 'preparing':
      return 'Em preparação';
    case 'in_transit':
      return 'A caminho';
    case 'delivered':
      return 'Entregue';
  }
}

export function consumerLabelToStage(status: string): OrderStage {
  const lower = status.toLowerCase();
  if (lower.includes('pendente')) return 'pending_payment';
  if (lower.includes('confirmado') || lower === 'confirmed') return 'confirmed';
  if (lower.includes('prepar') || lower === 'preparing') return 'preparing';
  if (lower.includes('caminho') || lower === 'in_transit') return 'in_transit';
  if (lower.includes('entregue') || lower === 'delivered') return 'delivered';
  return 'preparing';
}

export const DEMO_CPF = '529.982.247-25';

export const MOCK_DELIVERY_SLOTS: DeliverySlotOption[] = [
  {
    id: 'seed-slot',
    label: 'Terça-feira, 08h–12h · Rota Manhã (Confirmada pelo produtor)',
    startsAt: '2026-11-17T11:00:00.000Z',
    endsAt: '2026-11-17T15:00:00.000Z',
  },
  {
    id: 'seed-slot-tarde',
    label: 'Terça-feira, 14h–18h · Rota Tarde (Confirmada pelo produtor)',
    startsAt: '2026-11-17T17:00:00.000Z',
    endsAt: '2026-11-17T21:00:00.000Z',
  },
  {
    id: 'seed-slot-quinta',
    label: 'Quinta-feira, 08h–12h · Colheita de Meio de Semana',
    startsAt: '2026-11-19T11:00:00.000Z',
    endsAt: '2026-11-19T15:00:00.000Z',
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

export function calculatePlatformFeeCents(
  grossCents: number,
  percent: number
): number {
  if (grossCents < 0 || percent < 0 || percent > 100)
    throw new Error('Invalid pricing input');
  return Math.round((grossCents * percent) / 100);
}

export function isBeforeCutoff(
  now: Date,
  deliveryAt: Date,
  cutoffHours: number
): boolean {
  return deliveryAt.getTime() - now.getTime() >= cutoffHours * 3600000;
}

export function maskCpf(cpf: string): string {
  const digits = (cpf ?? '').replace(/\D/g, '');
  if (digits.length !== 11) return '***.***.***-**';
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

const baseBaskets: Basket[] = [
  {
    id: 'basket-familiar',
    productId: 'mock-cesta',
    name: 'Cesta da semana (Familiar)',
    description:
      'Cesta fixa agroecológica com 7 itens variados da colheita semanal para famílias de 3 a 4 pessoas. Preço e composição definidos pelo produtor antes de cada ciclo.',
    priceCents: 6490,
    producer: { id: 'sitio-verde', name: 'Sítio Verde' },
    frequencies: ['weekly', 'monthly'],
    cutoffHours: 36,
    stock: { available: 12, deliveryDate: '2026-11-17T11:00:00.000Z' },
    seasonality: 'Safra de Primavera · Colheita na véspera',
    items: [
      {
        productId: 'mock-alface',
        name: 'Alface crespa hidropônica de solo',
        quantity: '2 maços',
        origin: 'Sítio Verde',
      },
      {
        productId: 'mock-tomate',
        name: 'Tomate italiano orgânico',
        quantity: '1 kg',
        origin: 'Vale do Sol',
      },
      {
        productId: 'mock-cenoura',
        name: 'Cenoura baby com rama',
        quantity: '500 g',
        origin: 'Sítio Verde',
      },
      {
        name: 'Couve manteiga orgânica',
        quantity: '1 maço',
        origin: 'Sítio Verde',
      },
      {
        name: 'Abobrinha italiana fresca',
        quantity: '600 g',
        origin: 'Sítio Verde',
      },
      {
        name: 'Cheiro-verde (salsinha e cebolinha)',
        quantity: '1 maço',
        origin: 'Horta dos Irmãos',
      },
      {
        productId: 'mock-morango',
        name: 'Banana prata ou fruta da semana',
        quantity: '1 dúzia',
        origin: 'Pomar da Serra',
      },
    ],
  },
  {
    id: 'basket-compacta',
    productId: 'mock-cesta-compacta',
    name: 'Cesta fixa compacta (Casal)',
    description:
      'Seleção enxuta de 5 itens essenciais de hortaliças e legumes frescos da semana, pensada para 1 a 2 pessoas sem desperdício.',
    priceCents: 4290,
    producer: { id: 'horta-irmaos', name: 'Horta dos Irmãos' },
    frequencies: ['weekly', 'monthly'],
    cutoffHours: 36,
    stock: { available: 15, deliveryDate: '2026-11-17T11:00:00.000Z' },
    seasonality: 'Ano inteiro · Folhas e raízes frescas',
    items: [
      {
        productId: 'mock-alface',
        name: 'Alface crespa fresca',
        quantity: '1 unidade',
        origin: 'Horta dos Irmãos',
      },
      {
        name: 'Rúcula cultivada em canteiro',
        quantity: '1 maço',
        origin: 'Horta dos Irmãos',
      },
      {
        productId: 'mock-tomate',
        name: 'Tomate italiano maduro',
        quantity: '500 g',
        origin: 'Vale do Sol',
      },
      {
        productId: 'mock-cenoura',
        name: 'Cenoura baby lavada',
        quantity: '500 g',
        origin: 'Sítio Verde',
      },
      {
        name: 'Batata doce rosada',
        quantity: '600 g',
        origin: 'Horta dos Irmãos',
      },
    ],
  },
  {
    id: 'basket-pomar',
    productId: 'mock-cesta-pomar',
    name: 'Cesta fixa Pomar & Granja',
    description:
      'Combinação semanal ou mensal de frutas selecionadas da estação e ovos caipiras de galinhas criadas livres a pasto.',
    priceCents: 5490,
    producer: { id: 'pomar-serra', name: 'Pomar da Serra' },
    frequencies: ['weekly', 'monthly'],
    cutoffHours: 48,
    stock: { available: 10, deliveryDate: '2026-11-19T11:00:00.000Z' },
    seasonality: 'Safra de Primavera/Verão · Frutas doces',
    items: [
      {
        productId: 'mock-morango',
        name: 'Morango da estação selecionado',
        quantity: '2 bandejas',
        origin: 'Pomar da Serra',
      },
      {
        productId: 'mock-ovos',
        name: 'Ovos caipiras de pasto',
        quantity: '1 dúzia',
        origin: 'Granja Feliz',
      },
      {
        name: 'Laranja lima suculenta',
        quantity: '1 kg',
        origin: 'Pomar da Serra',
      },
      {
        name: 'Abacate manteiga',
        quantity: '2 unidades',
        origin: 'Pomar da Serra',
      },
    ],
  },
];

const baseProducts: Product[] = [
  {
    id: 'mock-cesta',
    name: 'Cesta da semana',
    description:
      'Seleção variada de folhas, legumes e frutas da colheita desta semana.',
    category: 'Cestas',
    unit: 'cesta',
    priceCents: 6490,
    active: true,
    certification: 'Orgânico Participativo (OPAC)',
    producer: { id: 'sitio-verde', name: 'Sítio Verde' },
    stock: {
      available: 12,
      reserved: 2,
      lowStockThreshold: 5,
      deliveryDate: '2026-11-17T11:00:00.000Z',
    },
    seasonality: 'Safra de Primavera · Colheita na véspera',
    basketId: 'basket-familiar',
    basketItems: baseBaskets[0].items,
  },
  {
    id: 'mock-cesta-compacta',
    name: 'Cesta fixa compacta (Casal)',
    description:
      'Seleção enxuta de 5 itens essenciais de hortaliças e legumes frescos da semana para 1 a 2 pessoas.',
    category: 'Cestas',
    unit: 'cesta',
    priceCents: 4290,
    active: true,
    certification: 'Agricultura Familiar (PRONAF)',
    producer: { id: 'horta-irmaos', name: 'Horta dos Irmãos' },
    stock: {
      available: 15,
      reserved: 1,
      lowStockThreshold: 4,
      deliveryDate: '2026-11-17T11:00:00.000Z',
    },
    seasonality: 'Ano inteiro · Folhas e raízes frescas',
    basketId: 'basket-compacta',
    basketItems: baseBaskets[1].items,
  },
  {
    id: 'mock-cesta-pomar',
    name: 'Cesta fixa Pomar & Granja',
    description:
      'Combinação de frutas selecionadas da estação e ovos caipiras de galinhas criadas soltas.',
    category: 'Cestas',
    unit: 'cesta',
    priceCents: 5490,
    active: true,
    certification: 'Manejo Sustentável Regional',
    producer: { id: 'pomar-serra', name: 'Pomar da Serra' },
    stock: {
      available: 10,
      reserved: 1,
      lowStockThreshold: 4,
      deliveryDate: '2026-11-19T11:00:00.000Z',
    },
    seasonality: 'Safra de Primavera/Verão · Frutas doces',
    basketId: 'basket-pomar',
    basketItems: baseBaskets[2].items,
  },
  {
    id: 'mock-tomate',
    name: 'Tomate italiano orgânico',
    description:
      'Tomates maduros, cultivados sem agrotóxicos abusivos e colhidos no dia.',
    category: 'Hortaliças',
    unit: 'kg',
    priceCents: 1490,
    active: true,
    certification: 'Orgânico Brasil (SISORG)',
    producer: { id: 'vale-sol', name: 'Vale do Sol' },
    stock: {
      available: 24,
      reserved: 3,
      lowStockThreshold: 6,
      deliveryDate: '2026-11-17T11:00:00.000Z',
    },
    seasonality: 'Safra plena · Colheita diária',
  },
  {
    id: 'mock-alface',
    name: 'Alface crespa',
    description: 'Folhas crocantes e frescas para as refeições da semana.',
    category: 'Hortaliças',
    unit: 'unidade',
    priceCents: 590,
    active: true,
    certification: 'Agricultura Familiar (PRONAF)',
    producer: { id: 'horta-irmaos', name: 'Horta dos Irmãos' },
    stock: {
      available: 36,
      reserved: 4,
      lowStockThreshold: 8,
      deliveryDate: '2026-11-17T11:00:00.000Z',
    },
    seasonality: 'Ano inteiro · Colheita na manhã da entrega',
  },
  {
    id: 'mock-cenoura',
    name: 'Cenoura baby',
    description: 'Cenouras doces, recém-colhidas e lavadas na propriedade.',
    category: 'Hortaliças',
    unit: '500 g',
    priceCents: 890,
    active: true,
    certification: 'Orgânico Participativo (OPAC)',
    producer: { id: 'sitio-verde', name: 'Sítio Verde' },
    stock: {
      available: 4,
      reserved: 1,
      lowStockThreshold: 5,
      deliveryDate: '2026-11-19T11:00:00.000Z',
    },
    seasonality: 'Outono/Primavera · Raízes jovens',
  },
  {
    id: 'mock-ovos',
    name: 'Ovos caipiras',
    description:
      'Dúzia de ovos de galinhas criadas soltas, de pequenos produtores locais.',
    category: 'Granja',
    unit: 'dúzia',
    priceCents: 1890,
    active: true,
    certification: 'Bem-Estar Animal · Criação Livre',
    producer: { id: 'granja-feliz', name: 'Granja Feliz' },
    stock: {
      available: 20,
      reserved: 2,
      lowStockThreshold: 5,
      deliveryDate: '2026-11-19T11:00:00.000Z',
    },
    seasonality: 'Produção contínua · Postura da semana',
  },
  {
    id: 'mock-morango',
    name: 'Morango da estação',
    description: 'Morangos doces e perfumados, selecionados à mão.',
    category: 'Frutas',
    unit: 'bandeja',
    priceCents: 1290,
    active: true,
    certification: 'Cultivo Integrado Sem Resíduos',
    producer: { id: 'pomar-serra', name: 'Pomar da Serra' },
    stock: {
      available: 9,
      reserved: 1,
      lowStockThreshold: 4,
      deliveryDate: '2026-11-19T11:00:00.000Z',
    },
    seasonality: 'Inverno/Primavera · Colheita seletiva',
  },
];

type StoredUser = {
  id: string;
  email: string;
  cpf: string;
  password: string;
  role: string;
};

type ProducerState = {
  id: string;
  displayName: string;
  city: string;
  state: string;
  story: string;
  legalIdMasked: string;
  onboardingStatus: 'approved' | 'pending_review' | 'changes_requested';
  paymentAccountConnected: boolean;
  splitFeatureFlagEnabled: boolean;
  platformFeePercent: number;
  certifications: ProducerCertification[];
  separatedOrderIds: string[];
};

const storageKeys = {
  cart: 'agritech_mock_cart',
  orders: 'agritech_mock_orders',
  stock: 'agritech_mock_stock',
  users: 'agritech_mock_users',
  subscriptions: 'agritech_mock_subscriptions',
  addresses: 'agritech_mock_addresses',
  lgpdRequests: 'agritech_mock_lgpd_requests',
  producerState: 'agritech_mock_producer_state',
  customProducts: 'agritech_mock_custom_products',
  productOverrides: 'agritech_mock_product_overrides',
  producerAudit: 'agritech_mock_producer_audit',
  adminZones: 'agritech_mock_admin_zones',
  adminSlots: 'agritech_mock_admin_slots',
  adminRoutes: 'agritech_mock_admin_routes',
  adminExceptions: 'agritech_mock_admin_exceptions',
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

function defaultProducerState(): ProducerState {
  return {
    id: 'sitio-verde',
    displayName: 'Sítio Verde · Agricultura Familiar',
    city: 'Ibiúna',
    state: 'SP',
    story:
      'Propriedade familiar de 6 hectares dedicada a hortaliças orgânicas e cestas agroecológicas colhidas na véspera da entrega.',
    legalIdMasked: '***.982.247-25 · DAP/CAF Ativo',
    onboardingStatus: 'approved',
    paymentAccountConnected: true,
    splitFeatureFlagEnabled: false,
    platformFeePercent: 10,
    certifications: [
      {
        id: 'cert-opac',
        name: 'Certificação Orgânica Participativa (OPAC)',
        issuer: 'Rede Agroecológica Regional',
        validUntil: '2027-08-15',
        status: 'valid',
      },
      {
        id: 'cert-caf',
        name: 'Cadastro Nacional da Agricultura Familiar (CAF)',
        issuer: 'MDA · Governo Federal',
        validUntil: '2027-03-30',
        status: 'valid',
      },
    ],
    separatedOrderIds: ['AG-1037'],
  };
}

function defaultProducerAudit(): ProducerAuditEntry[] {
  return [
    {
      id: 'aud-1',
      action: 'onboarding.approved',
      resourceType: 'Onboarding',
      resourceId: 'sitio-verde',
      summary: 'Onboarding da propriedade Sítio Verde aprovado pela operação.',
      createdAt: '2026-10-15T10:00:00.000Z',
    },
    {
      id: 'aud-2',
      action: 'inventory.updated',
      resourceType: 'Inventory',
      resourceId: 'mock-cesta',
      summary: 'Disponibilidade semanal da Cesta da semana atualizada para 12 unidades.',
      createdAt: '2026-10-28T09:15:00.000Z',
    },
  ];
}

function appendProducerAudit(
  action: string,
  resourceType: ProducerAuditEntry['resourceType'],
  resourceId: string,
  summary: string
) {
  const current = read<ProducerAuditEntry[]>(
    storageKeys.producerAudit,
    defaultProducerAudit()
  );
  const entry: ProducerAuditEntry = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    action,
    resourceType,
    resourceId,
    summary,
    createdAt: new Date().toISOString(),
  };
  write(storageKeys.producerAudit, [entry, ...current]);
}

function stockMap(): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const product of baseProducts) {
    defaults[product.id] = product.stock.available;
  }
  const custom = read<Product[]>(storageKeys.customProducts, []);
  for (const product of custom) {
    defaults[product.id] = product.stock.available;
  }
  return { ...defaults, ...read<Record<string, number>>(storageKeys.stock, {}) };
}

function allProductsWithOverrides(): Product[] {
  const stocks = stockMap();
  const overrides = read<Record<string, Partial<Product>>>(
    storageKeys.productOverrides,
    {}
  );
  const custom = read<Product[]>(storageKeys.customProducts, []);
  const combined = [...baseProducts, ...custom];
  return combined.map((product) => {
    const ov = overrides[product.id] ?? {};
    const mergedStock = {
      ...product.stock,
      ...(ov.stock ?? {}),
      available: Math.max(
        0,
        stocks[product.id] ?? ov.stock?.available ?? product.stock.available
      ),
    };
    return {
      ...product,
      ...ov,
      active: ov.active ?? product.active ?? true,
      stock: mergedStock,
    };
  });
}

function currentProducts(): Product[] {
  return allProductsWithOverrides().filter((p) => p.active !== false);
}

function currentBaskets(): Basket[] {
  const stocks = stockMap();
  const overrides = read<Record<string, Partial<Product>>>(
    storageKeys.productOverrides,
    {}
  );
  return baseBaskets
    .filter((b) => overrides[b.productId]?.active !== false)
    .map((basket) => ({
      ...basket,
      priceCents: overrides[basket.productId]?.priceCents ?? basket.priceCents,
      stock: {
        ...basket.stock,
        available: Math.max(
          0,
          stocks[basket.productId] ?? basket.stock.available
        ),
      },
    }));
}

function makeCartItem(productId: string, quantity: number): CartItem {
  const product = allProductsWithOverrides().find(
    (item) => item.id === productId
  );
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

function defaultSavedAddresses(): SavedAddress[] {
  return [
    {
      id: 'addr-1',
      label: 'Casa · Bela Vista',
      zoneName: 'Zona Centro-Sul (Atendida)',
      isDefault: true,
      ...defaultAddress,
    },
  ];
}

function resolveZoneName(postalCode: string): string {
  const clean = postalCode.replace(/\D/g, '');
  if (clean.startsWith('01') || clean.startsWith('04')) {
    return 'Zona Centro-Sul (Atendida)';
  }
  if (clean.startsWith('05') || clean.startsWith('02')) {
    return 'Zona Oeste-Norte (Atendida)';
  }
  return 'Zona Piloto Regional (Atendida)';
}

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
  const totalCents = items.reduce(
    (total, item) => total + item.subtotalCents,
    0
  );
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
        ['mock-cesta', 1],
        ['mock-cenoura', 2],
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

function enrichSubscriptionCutoff(
  sub: Subscription,
  now = new Date()
): Subscription {
  const deliveryDate = new Date(sub.nextDeliveryAt);
  const cutoffDate = new Date(
    deliveryDate.getTime() - sub.cutoffHours * 3600000
  );
  const basket =
    currentBaskets().find((b) => b.id === sub.basketId) ?? baseBaskets[0];
  return {
    ...sub,
    items: basket.items,
    cutoffAt: cutoffDate.toISOString(),
    canModifyCurrentCycle: isBeforeCutoff(now, deliveryDate, sub.cutoffHours),
  };
}

function defaultSubscriptionsList(): Subscription[] {
  const futureDelivery = new Date(Date.now() + 5 * 86400000).toISOString();
  const futureBilling = new Date(Date.now() + 3 * 86400000).toISOString();
  const basket = baseBaskets[0];
  const slot = MOCK_DELIVERY_SLOTS[0];
  const sub: Subscription = {
    id: 'SUB-2041',
    basketId: basket.id,
    basketName: basket.name,
    producer: basket.producer,
    frequency: 'weekly',
    priceCents: basket.priceCents,
    status: 'active',
    cutoffHours: basket.cutoffHours,
    cutoffAt: new Date(
      new Date(futureDelivery).getTime() - basket.cutoffHours * 3600000
    ).toISOString(),
    canModifyCurrentCycle: true,
    nextBillingAt: futureBilling,
    nextDeliveryAt: futureDelivery,
    address: defaultAddress,
    deliverySlot: {
      id: slot.id,
      label: slot.label,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
    },
    items: basket.items,
    cycles: [
      {
        id: 'CYC-101',
        cycleKey: '2026-10-21',
        deliveryDate: '2026-10-21T11:00:00.000Z',
        billingDate: '2026-10-19T11:00:00.000Z',
        amountCents: basket.priceCents,
        status: 'confirmed',
        paymentStatus: 'approved',
        orderId: 'AG-1037',
        note: 'Ciclo entregue e confirmado.',
        createdAt: '2026-10-19T11:00:00.000Z',
      },
    ],
    createdAt: '2026-10-15T10:00:00.000Z',
    updatedAt: '2026-10-21T13:00:00.000Z',
  };
  return [enrichSubscriptionCutoff(sub)];
}

function subscriptions(): Subscription[] {
  const list = read<Subscription[]>(
    storageKeys.subscriptions,
    defaultSubscriptionsList()
  );
  return list.map((s) => enrichSubscriptionCutoff(s));
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

function validateAddress(addr: Order['address'] | undefined) {
  if (
    !addr?.postalCode?.trim() ||
    !addr?.street?.trim() ||
    !addr?.number?.trim() ||
    !addr?.city?.trim() ||
    !addr?.state?.trim()
  ) {
    throw new Error('Preencha todos os campos obrigatórios do endereço.');
  }
  return {
    postalCode: addr.postalCode.trim(),
    street: addr.street.trim(),
    number: addr.number.trim(),
    complement: addr.complement?.trim() || undefined,
    city: addr.city.trim(),
    state: addr.state.trim().toUpperCase(),
  };
}

function buildProducerDashboard(): ProducerDashboardData {
  const pState = read<ProducerState>(
    storageKeys.producerState,
    defaultProducerState()
  );
  const allOffers = allProductsWithOverrides();
  const allOrders = orders();
  const unitMap = new Map(allOffers.map((p) => [p.id, p.unit]));

  const fulfillmentQueue: ProducerFulfillmentItem[] = allOrders.map((order) => {
    const items = order.items.map((i) => ({
      productId: i.productId,
      name: i.name,
      quantity: i.quantity,
      unit: unitMap.get(i.productId) ?? 'un',
      unitPriceCents: i.unitPriceCents,
    }));
    const producerGrossCents = items.reduce(
      (sum, i) => sum + i.quantity * i.unitPriceCents,
      0
    );
    return {
      orderId: order.id,
      status: order.status,
      producerSeparated:
        pState.separatedOrderIds.includes(order.id) ||
        order.status === 'Entregue',
      deliverySlot: order.deliverySlot,
      customerCity: order.address.city,
      items,
      producerGrossCents,
    };
  });

  const harvestMap = new Map<string, ProducerHarvestSummary>();
  for (const fq of fulfillmentQueue) {
    if (fq.status === 'Entregue') continue;
    for (const item of fq.items) {
      const prev = harvestMap.get(item.productId);
      if (prev) {
        prev.totalQuantity += item.quantity;
        prev.ordersCount += 1;
      } else {
        harvestMap.set(item.productId, {
          productId: item.productId,
          name: item.name,
          unit: item.unit,
          totalQuantity: item.quantity,
          ordersCount: 1,
        });
      }
    }
  }

  const payouts: ProducerPayoutItem[] = fulfillmentQueue.map((fq) => {
    const feeCents = calculatePlatformFeeCents(
      fq.producerGrossCents,
      pState.platformFeePercent
    );
    const netCents = fq.producerGrossCents - feeCents;
    const isDelivered = fq.status === 'Entregue';
    return {
      id: `PAY-${fq.orderId}`,
      orderId: fq.orderId,
      createdAt: fq.deliverySlot.startsAt,
      scheduledAt: new Date(
        new Date(fq.deliverySlot.startsAt).getTime() + 2 * 86400000
      ).toISOString(),
      grossCents: fq.producerGrossCents,
      feePercent: pState.platformFeePercent,
      feeCents,
      netCents,
      status: !pState.paymentAccountConnected
        ? 'pending_split_approval'
        : isDelivered
          ? 'paid'
          : 'scheduled',
      itemsSummary: fq.items.map((i) => `${i.quantity}× ${i.name}`).join(', '),
    };
  });

  const lowStockOffers = allOffers.filter(
    (o) => o.stock.available <= (o.stock.lowStockThreshold ?? 5)
  );
  const pendingFulfillment = fulfillmentQueue.filter(
    (f) => !f.producerSeparated
  );

  const pendingReasons: string[] = [];
  if (pState.onboardingStatus !== 'approved') {
    pendingReasons.push('Cadastro da propriedade aguarda aprovação operacional');
  }
  if (!pState.paymentAccountConnected) {
    pendingReasons.push('Conta de recebimento Mercado Pago não conectada');
  }
  if (lowStockOffers.length > 0) {
    pendingReasons.push(
      `${lowStockOffers.length} oferta(s) com alerta de baixo estoque`
    );
  }
  if (pendingFulfillment.length > 0) {
    pendingReasons.push(
      `${pendingFulfillment.length} pedido(s) aguardando colheita e separação`
    );
  }

  const grossSalesCents = payouts.reduce((s, p) => s + p.grossCents, 0);
  const netPayoutCents = payouts.reduce((s, p) => s + p.netCents, 0);

  return {
    producer: {
      id: pState.id,
      displayName: pState.displayName,
      city: pState.city,
      state: pState.state,
      story: pState.story,
      legalIdMasked: pState.legalIdMasked,
      onboardingStatus: pState.onboardingStatus,
      paymentAccountConnected: pState.paymentAccountConnected,
      splitFeatureFlagEnabled: pState.splitFeatureFlagEnabled,
      platformFeePercent: pState.platformFeePercent,
      pendingReasons,
      certifications: pState.certifications,
    },
    metrics: {
      activeOffersCount: allOffers.filter((o) => o.active !== false).length,
      pausedOffersCount: allOffers.filter((o) => o.active === false).length,
      lowStockCount: lowStockOffers.length,
      pendingFulfillmentCount: pendingFulfillment.length,
      grossSalesCents,
      netPayoutCents,
    },
    offers: allOffers,
    fulfillmentQueue,
    harvestSummary: Array.from(harvestMap.values()),
    payouts,
    auditLogs: read<ProducerAuditEntry[]>(
      storageKeys.producerAudit,
      defaultProducerAudit()
    ),
  };
}

function defaultAdminZones(): AdminServiceZone[] {
  return [
    {
      id: 'zone-centro-sul',
      name: 'Zona Centro-Sul · Piloto',
      postalCodePrefix: '01310',
      city: 'São Paulo',
      active: true,
      cutoffHours: 36,
      ordersCount: 2,
    },
    {
      id: 'zone-oeste',
      name: 'Zona Oeste · Pinheiros/Butantã',
      postalCodePrefix: '05400',
      city: 'São Paulo',
      active: true,
      cutoffHours: 36,
      ordersCount: 0,
    },
  ];
}

function defaultAdminSlots(): AdminDeliverySlot[] {
  return [
    {
      id: MOCK_DELIVERY_SLOTS[0].id,
      zoneId: 'zone-centro-sul',
      zoneName: 'Zona Centro-Sul · Piloto',
      label: MOCK_DELIVERY_SLOTS[0].label,
      startsAt: MOCK_DELIVERY_SLOTS[0].startsAt,
      endsAt: MOCK_DELIVERY_SLOTS[0].endsAt,
      capacity: 50,
      occupied: 2,
      active: true,
    },
    {
      id: MOCK_DELIVERY_SLOTS[1].id,
      zoneId: 'zone-centro-sul',
      zoneName: 'Zona Centro-Sul · Piloto',
      label: MOCK_DELIVERY_SLOTS[1].label,
      startsAt: MOCK_DELIVERY_SLOTS[1].startsAt,
      endsAt: MOCK_DELIVERY_SLOTS[1].endsAt,
      capacity: 30,
      occupied: 0,
      active: true,
    },
    {
      id: MOCK_DELIVERY_SLOTS[2].id,
      zoneId: 'zone-oeste',
      zoneName: 'Zona Oeste · Pinheiros/Butantã',
      label: MOCK_DELIVERY_SLOTS[2].label,
      startsAt: MOCK_DELIVERY_SLOTS[2].startsAt,
      endsAt: MOCK_DELIVERY_SLOTS[2].endsAt,
      capacity: 25,
      occupied: 0,
      active: true,
    },
  ];
}

function defaultAdminRoutes(): AdminManualRoute[] {
  return [
    {
      id: 'route-cs-01',
      name: 'Rota 01 · Centro-Sul Manhã',
      zoneId: 'zone-centro-sul',
      zoneName: 'Zona Centro-Sul · Piloto',
      slotId: MOCK_DELIVERY_SLOTS[0].id,
      slotLabel: MOCK_DELIVERY_SLOTS[0].label,
      driverName: 'Carlos Mendes · VUC Refrigerado',
      status: 'open',
      orderIds: ['AG-1048'],
      createdAt: '2026-10-28T07:30:00.000Z',
    },
  ];
}

function defaultAdminExceptions(): AdminExceptionItem[] {
  return [
    {
      id: 'exc-seed-1',
      type: 'stock_shortage',
      severity: 'medium',
      referenceId: 'AG-1048',
      title: 'Substituição preventiva de item sazonal em cesta fixa',
      description:
        'A alface crespa hidropônica atingiu o limite de colheita no Sítio Verde; sugerida substituição equivalente por alface americana orgânica.',
      status: 'open',
      createdAt: '2026-10-28T08:10:00.000Z',
    },
  ];
}

function mapPostalCodeToZone(
  postalCode: string,
  zones: AdminServiceZone[]
): AdminServiceZone {
  const clean = (postalCode ?? '').replace(/\D/g, '');
  const matched = zones.find((z) =>
    clean.startsWith(z.postalCodePrefix.replace(/\D/g, '').slice(0, 2))
  );
  return matched ?? zones[0];
}

function buildAdminDashboard(): AdminDashboardData {
  const zonesRaw = read<AdminServiceZone[]>(
    storageKeys.adminZones,
    defaultAdminZones()
  );
  const slotsRaw = read<AdminDeliverySlot[]>(
    storageKeys.adminSlots,
    defaultAdminSlots()
  );
  const routesRaw = read<AdminManualRoute[]>(
    storageKeys.adminRoutes,
    defaultAdminRoutes()
  );
  const storedExceptions = read<AdminExceptionItem[]>(
    storageKeys.adminExceptions,
    defaultAdminExceptions()
  );
  const allOrders = orders();
  const allSubs = subscriptions();
  const lgpdReqs = read<LgpdDeletionRequest[]>(storageKeys.lgpdRequests, []);
  const pState = read<ProducerState>(
    storageKeys.producerState,
    defaultProducerState()
  );
  const allOffers = allProductsWithOverrides();
  const unitMap = new Map(allOffers.map((p) => [p.id, p.unit]));
  const producerMap = new Map(allOffers.map((p) => [p.id, p.producer.name]));

  const routeByOrder = new Map<string, AdminManualRoute>();
  for (const r of routesRaw) {
    for (const oid of r.orderIds) {
      routeByOrder.set(oid, r);
    }
  }

  const enrichedOrders: Order[] = allOrders.map((o) => {
    const z = mapPostalCodeToZone(o.address.postalCode, zonesRaw);
    const assignedRoute = routeByOrder.get(o.id);
    const stage =
      o.operationalStage ??
      (consumerLabelToStage(o.status) as Order['operationalStage']);
    return {
      ...o,
      operationalStage: stage,
      zoneName: o.zoneName ?? z?.name ?? 'Zona Centro-Sul · Piloto',
      routeId: assignedRoute?.id ?? o.routeId ?? null,
      routeName: assignedRoute?.name ?? o.routeName ?? null,
    };
  });

  const zones: AdminServiceZone[] = zonesRaw.map((z) => {
    const count = enrichedOrders.filter((o) => o.zoneName === z.name).length;
    return { ...z, ordersCount: count };
  });

  const slots: AdminDeliverySlot[] = slotsRaw.map((s) => {
    const occupied = enrichedOrders.filter(
      (o) => o.deliverySlot.id === s.id
    ).length;
    const z = zones.find((zn) => zn.id === s.zoneId);
    return {
      ...s,
      zoneName: z?.name ?? s.zoneName,
      occupied,
    };
  });

  const dynamicExceptions: AdminExceptionItem[] = [...storedExceptions];
  for (const sub of allSubs) {
    for (const cyc of sub.cycles) {
      if (
        (cyc.status === 'payment_failed' || cyc.status === 'stock_shortage') &&
        !dynamicExceptions.some((e) => e.referenceId === `${sub.id}:${cyc.id}`)
      ) {
        dynamicExceptions.push({
          id: `exc-${sub.id}-${cyc.id}`,
          type:
            cyc.status === 'payment_failed'
              ? 'payment_failure'
              : 'stock_shortage',
          severity: 'high',
          referenceId: `${sub.id}:${cyc.id}`,
          title:
            cyc.status === 'payment_failed'
              ? `Falha na cobrança recorrente da assinatura ${sub.id}`
              : `Ruptura de estoque no ciclo ${cyc.cycleKey} da assinatura ${sub.id}`,
          description:
            cyc.note ?? 'Incidente operacional registrado no ciclo recorrente.',
          status: 'open',
          createdAt: cyc.createdAt,
        });
      }
    }
  }

  for (const req of lgpdReqs) {
    if (!dynamicExceptions.some((e) => e.referenceId === req.protocol)) {
      dynamicExceptions.push({
        id: `exc-lgpd-${req.id}`,
        type: 'lgpd_request',
        severity: 'high',
        referenceId: req.protocol,
        title: `Solicitação LGPD de exclusão/anonimização (${req.protocol})`,
        description: req.reason,
        status: req.status === 'completed' ? 'resolved' : 'open',
        createdAt: req.requestedAt,
        resolvedAt: req.completedAt,
      });
    }
  }

  const slotLabelMap = new Map(slots.map((s) => [s.id, s.label]));
  const manifest: AdminManifestEntry[] = enrichedOrders.map((o) => {
    const itemsSummary = o.items
      .map(
        (i) => `${i.quantity}× ${i.name} (${unitMap.get(i.productId) ?? 'un'})`
      )
      .join('; ');
    const producersSummary = Array.from(
      new Set(
        o.items.map(
          (i) => producerMap.get(i.productId) ?? 'Sítio Verde · Agricultura Familiar'
        )
      )
    ).join(', ');
    return {
      orderId: o.id,
      status: o.status,
      operationalStage: o.operationalStage ?? 'preparing',
      customerEmail: DEMO_CREDENTIALS.email,
      zoneName: o.zoneName ?? 'Zona Centro-Sul · Piloto',
      routeName: o.routeName ?? 'Sem rota atribuída',
      slotLabel:
        slotLabelMap.get(o.deliverySlot.id) ?? MOCK_DELIVERY_SLOTS[0].label,
      addressLine: `${o.address.street}, ${o.address.number}${o.address.complement ? ` (${o.address.complement})` : ''} - ${o.address.city}/${o.address.state}`,
      postalCode: o.address.postalCode,
      producerSeparated:
        pState.separatedOrderIds.includes(o.id) || o.status === 'Entregue',
      itemsSummary,
      producersSummary,
      totalCents: o.totalCents,
    };
  });

  const totalSlotCapacity = slots
    .filter((s) => s.active)
    .reduce((sum, s) => sum + s.capacity, 0);
  const occupiedSlotsCount = slots
    .filter((s) => s.active)
    .reduce((sum, s) => sum + s.occupied, 0);

  return {
    metrics: {
      totalOrdersCount: enrichedOrders.length,
      inTransitCount: enrichedOrders.filter(
        (o) => o.operationalStage === 'in_transit'
      ).length,
      deliveredCount: enrichedOrders.filter(
        (o) => o.operationalStage === 'delivered'
      ).length,
      openExceptionsCount: dynamicExceptions.filter((e) => e.status === 'open')
        .length,
      activeZonesCount: zones.filter((z) => z.active).length,
      totalSlotCapacity,
      occupiedSlotsCount,
    },
    zones,
    slots,
    routes: routesRaw,
    orders: enrichedOrders,
    exceptions: dynamicExceptions,
    manifest,
    auditLogs: read<ProducerAuditEntry[]>(
      storageKeys.producerAudit,
      defaultProducerAudit()
    ),
  };
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

  const cleanAddress = validateAddress(body?.address);

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
  order.address = cleanAddress;
  write(storageKeys.orders, [order, ...orders()]);
  write<CartItem[]>(storageKeys.cart, []);
  return order;
}

function createSubscription(
  body: {
    basketId: string;
    frequency: 'weekly' | 'monthly';
    address: Order['address'];
    deliverySlotId?: string;
  },
  idempotencyKey?: string
): Subscription {
  const basket = currentBaskets().find((b) => b.id === body?.basketId);
  if (!basket) throw new Error('Cesta fixa não encontrada.');
  if (!['weekly', 'monthly'].includes(body?.frequency)) {
    throw new Error('Escolha a frequência semanal ou mensal.');
  }
  const cleanAddress = validateAddress(body?.address);
  const stocks = stockMap();
  const available = stocks[basket.productId] ?? 0;
  if (available < 1) {
    throw new Error(`Sem disponibilidade no lote atual para ${basket.name}.`);
  }

  const currentSubs = subscriptions();
  if (idempotencyKey) {
    const existing = currentSubs.find((s) => s.id === idempotencyKey);
    if (existing) return existing;
  }

  stocks[basket.productId] = Math.max(0, available - 1);
  write(storageKeys.stock, stocks);

  const now = new Date();
  const nextDays = body.frequency === 'weekly' ? 7 : 30;
  const nextDelivery = new Date(now.getTime() + nextDays * 86400000);
  const nextBilling = new Date(
    nextDelivery.getTime() - basket.cutoffHours * 3600000
  );
  const slot =
    MOCK_DELIVERY_SLOTS.find((s) => s.id === body.deliverySlotId) ??
    MOCK_DELIVERY_SLOTS[0];

  const orderId = `AG-${Math.floor(1000 + Math.random() * 9000)}`;
  const initialOrder = makeOrder(
    orderId,
    'Em preparação',
    [[basket.productId, 1]],
    now.toISOString(),
    slot.id,
    `sub-order-${orderId}`
  );
  initialOrder.address = cleanAddress;
  write(storageKeys.orders, [initialOrder, ...orders()]);

  const subId = `SUB-${Math.floor(2100 + Math.random() * 7800)}`;
  const cycleKey = now.toISOString().slice(0, 10);
  const initialCycle: SubscriptionCycle = {
    id: `CYC-${Math.floor(200 + Math.random() * 800)}`,
    cycleKey,
    deliveryDate: slot.startsAt,
    billingDate: now.toISOString(),
    amountCents: basket.priceCents,
    status: 'confirmed',
    paymentStatus: 'approved',
    orderId: initialOrder.id,
    note: '1º ciclo confirmado na adesão (estoque reservado).',
    createdAt: now.toISOString(),
  };

  const newSub: Subscription = enrichSubscriptionCutoff({
    id: subId,
    basketId: basket.id,
    basketName: basket.name,
    producer: basket.producer,
    frequency: body.frequency,
    priceCents: basket.priceCents,
    status: 'active',
    cutoffHours: basket.cutoffHours,
    cutoffAt: nextBilling.toISOString(),
    canModifyCurrentCycle: true,
    nextBillingAt: nextBilling.toISOString(),
    nextDeliveryAt: nextDelivery.toISOString(),
    address: cleanAddress,
    deliverySlot: {
      id: slot.id,
      label: slot.label,
      startsAt: slot.startsAt,
      endsAt: slot.endsAt,
    },
    items: basket.items,
    cycles: [initialCycle],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  });

  write(storageKeys.subscriptions, [newSub, ...currentSubs]);
  return newSub;
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
    if (
      email === DEMO_PRODUCER_CREDENTIALS.email &&
      password === DEMO_PRODUCER_CREDENTIALS.password
    ) {
      return authResponse(email, 'producer', 'sitio-verde');
    }
    if (
      email === DEMO_OPERATIONS_CREDENTIALS.email &&
      password === DEMO_OPERATIONS_CREDENTIALS.password
    ) {
      return authResponse(email, 'operations', 'ops-central');
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
    const role = body?.role === 'producer' ? 'producer' : 'consumer';

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
      email === DEMO_PRODUCER_CREDENTIALS.email ||
      users.some((u) => u.email === email || u.cpf === cpf)
    ) {
      throw new Error('Email ou CPF já cadastrado neste ambiente.');
    }

    const newUser: StoredUser = {
      id: `user-${users.length + 1}`,
      email,
      cpf,
      password,
      role,
    };
    write(storageKeys.users, [...users, newUser]);
    if (role === 'producer' && body?.displayName?.trim()) {
      const pState = read<ProducerState>(
        storageKeys.producerState,
        defaultProducerState()
      );
      pState.displayName = body.displayName.trim();
      write(storageKeys.producerState, pState);
    }
    return authResponse(newUser.email, newUser.role, newUser.id);
  }

  if (pathname === '/producer/dashboard' && method === 'GET') {
    return buildProducerDashboard();
  }

  if (pathname === '/producer/onboarding' && method === 'PATCH') {
    const current = read<ProducerState>(
      storageKeys.producerState,
      defaultProducerState()
    );
    const updated: ProducerState = {
      ...current,
      displayName: body?.displayName?.trim() || current.displayName,
      city: body?.city?.trim() || current.city,
      state: body?.state?.trim() || current.state,
      story: body?.story?.trim() || current.story,
      onboardingStatus: body?.onboardingStatus ?? current.onboardingStatus,
      paymentAccountConnected:
        typeof body?.paymentAccountConnected === 'boolean'
          ? body.paymentAccountConnected
          : current.paymentAccountConnected,
      certifications: Array.isArray(body?.certifications)
        ? body.certifications
        : current.certifications,
    };
    write(storageKeys.producerState, updated);
    appendProducerAudit(
      'onboarding.updated',
      'Onboarding',
      updated.id,
      `Status de onboarding: ${updated.onboardingStatus} · Conta Mercado Pago conectada: ${updated.paymentAccountConnected ? 'Sim' : 'Não'}.`
    );
    return buildProducerDashboard();
  }

  if (pathname === '/producer/offers' && method === 'POST') {
    const pState = read<ProducerState>(
      storageKeys.producerState,
      defaultProducerState()
    );
    const wantsPublish = body?.active !== false;
    if (
      wantsPublish &&
      (pState.onboardingStatus !== 'approved' ||
        !pState.paymentAccountConnected)
    ) {
      throw new Error(
        'Conclua a aprovação do onboarding e conecte a conta de recebimento antes de publicar ofertas.'
      );
    }
    const name = body?.name?.trim();
    const unit = body?.unit?.trim();
    const category = body?.category?.trim() || 'Hortaliças';
    const priceCents = Number(body?.priceCents ?? 0);
    const available = Number(body?.available ?? 0);
    if (!name || !unit) {
      throw new Error('Informe o nome e a unidade de comercialização da oferta.');
    }
    if (!Number.isInteger(priceCents) || priceCents <= 0) {
      throw new Error('O preço da oferta deve ser maior que zero.');
    }
    if (!Number.isInteger(available) || available < 0) {
      throw new Error('A disponibilidade inicial não pode ser negativa.');
    }

    const custom = read<Product[]>(storageKeys.customProducts, []);
    const newId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const created: Product = {
      id: newId,
      name,
      description:
        body?.description?.trim() ||
        `Colheita fresca de ${name} produzida por ${pState.displayName}.`,
      category,
      unit,
      priceCents,
      active: wantsPublish,
      certification:
        body?.certification?.trim() || 'Orgânico Participativo (OPAC)',
      seasonality: body?.seasonality?.trim() || 'Safra atual · Colheita sob demanda',
      producer: { id: pState.id, name: pState.displayName },
      stock: {
        available,
        reserved: 0,
        lowStockThreshold: Number(body?.lowStockThreshold ?? 5),
        deliveryDate: MOCK_DELIVERY_SLOTS[0].startsAt,
      },
      basketItems: Array.isArray(body?.basketItems)
        ? body.basketItems
        : undefined,
    };
    write(storageKeys.customProducts, [created, ...custom]);
    const stocks = stockMap();
    stocks[newId] = available;
    write(storageKeys.stock, stocks);

    appendProducerAudit(
      wantsPublish ? 'offer.published' : 'offer.draft_saved',
      'Product',
      newId,
      `${wantsPublish ? 'Oferta publicada' : 'Rascunho salvo'}: ${name} (${unit}) por R$ ${(priceCents / 100).toFixed(2)} com lote de ${available}.`
    );
    return created;
  }

  if (
    pathname.startsWith('/producer/offers/') &&
    pathname.endsWith('/toggle-status') &&
    method === 'POST'
  ) {
    const productId = pathname
      .replace('/producer/offers/', '')
      .replace('/toggle-status', '');
    const all = allProductsWithOverrides();
    const target = all.find((p) => p.id === productId);
    if (!target) throw new Error('Oferta não encontrada.');

    const nextActive = target.active === false;
    const pState = read<ProducerState>(
      storageKeys.producerState,
      defaultProducerState()
    );
    if (
      nextActive &&
      (pState.onboardingStatus !== 'approved' ||
        !pState.paymentAccountConnected)
    ) {
      throw new Error(
        'Conclua a aprovação do onboarding e conecte a conta de recebimento antes de publicar ofertas.'
      );
    }

    const overrides = read<Record<string, Partial<Product>>>(
      storageKeys.productOverrides,
      {}
    );
    overrides[productId] = {
      ...(overrides[productId] ?? {}),
      active: nextActive,
    };
    write(storageKeys.productOverrides, overrides);

    appendProducerAudit(
      nextActive ? 'offer.activated' : 'offer.paused',
      'Product',
      productId,
      `Oferta "${target.name}" ${nextActive ? 'reativada no catálogo' : 'pausada pelo produtor'}.`
    );
    return buildProducerDashboard();
  }

  if (pathname.startsWith('/producer/offers/') && method === 'PATCH') {
    const productId = pathname.replace('/producer/offers/', '');
    const all = allProductsWithOverrides();
    const target = all.find((p) => p.id === productId);
    if (!target) throw new Error('Oferta não encontrada.');

    const priceCents =
      body?.priceCents !== undefined
        ? Number(body.priceCents)
        : target.priceCents;
    if (!Number.isInteger(priceCents) || priceCents <= 0) {
      throw new Error('Preço inválido.');
    }

    const overrides = read<Record<string, Partial<Product>>>(
      storageKeys.productOverrides,
      {}
    );
    overrides[productId] = {
      ...(overrides[productId] ?? {}),
      name: body?.name?.trim() || target.name,
      description: body?.description?.trim() || target.description,
      unit: body?.unit?.trim() || target.unit,
      seasonality: body?.seasonality?.trim() || target.seasonality,
      certification: body?.certification?.trim() || target.certification,
      priceCents,
    };
    write(storageKeys.productOverrides, overrides);

    appendProducerAudit(
      'offer.updated',
      'Product',
      productId,
      `Oferta "${overrides[productId].name}" atualizada (preço: R$ ${(priceCents / 100).toFixed(2)}).`
    );
    return buildProducerDashboard();
  }

  if (pathname.startsWith('/producer/inventory/') && method === 'PATCH') {
    const productId = pathname.replace('/producer/inventory/', '');
    const all = allProductsWithOverrides();
    const target = all.find((p) => p.id === productId);
    if (!target) throw new Error('Oferta não encontrada.');

    if (
      body?.expectedAvailable !== undefined &&
      Number(body.expectedAvailable) !== target.stock.available
    ) {
      throw new Error(
        'A disponibilidade mudou enquanto você editava. Atualize os dados antes de salvar.'
      );
    }

    const nextAvailable = Number(body?.available);
    if (!Number.isInteger(nextAvailable) || nextAvailable < 0) {
      throw new Error('O estoque disponível não pode ser negativo.');
    }

    const stocks = stockMap();
    const prevAvailable = stocks[productId] ?? target.stock.available;
    stocks[productId] = nextAvailable;
    write(storageKeys.stock, stocks);

    if (body?.lowStockThreshold !== undefined || body?.deliveryDate) {
      const overrides = read<Record<string, Partial<Product>>>(
        storageKeys.productOverrides,
        {}
      );
      overrides[productId] = {
        ...(overrides[productId] ?? {}),
        stock: {
          ...target.stock,
          available: nextAvailable,
          lowStockThreshold:
            body?.lowStockThreshold !== undefined
              ? Math.max(0, Number(body.lowStockThreshold))
              : target.stock.lowStockThreshold,
          deliveryDate: body?.deliveryDate ?? target.stock.deliveryDate,
        },
      };
      write(storageKeys.productOverrides, overrides);
    }

    appendProducerAudit(
      'inventory.updated',
      'Inventory',
      productId,
      `Estoque semanal de "${target.name}" alterado de ${prevAvailable} para ${nextAvailable} (${target.unit}).`
    );
    return buildProducerDashboard();
  }

  if (
    pathname.startsWith('/producer/orders/') &&
    pathname.endsWith('/mark-separated') &&
    method === 'POST'
  ) {
    const orderId = pathname
      .replace('/producer/orders/', '')
      .replace('/mark-separated', '');
    const pState = read<ProducerState>(
      storageKeys.producerState,
      defaultProducerState()
    );
    if (!pState.separatedOrderIds.includes(orderId)) {
      pState.separatedOrderIds = [...pState.separatedOrderIds, orderId];
      write(storageKeys.producerState, pState);
    }
    const list = orders();
    const idx = list.findIndex((o) => o.id === orderId);
    if (idx >= 0 && list[idx].status !== 'Entregue') {
      const now = new Date().toISOString();
      list[idx].statusHistory = [
        ...list[idx].statusHistory,
        {
          toStatus: 'Colheita e separação concluídas pelo produtor',
          createdAt: now,
        },
      ];
      write(storageKeys.orders, list);
    }
    appendProducerAudit(
      'fulfillment.separated',
      'Order',
      orderId,
      `Lote do pedido #${orderId} colhido, separado e etiquetado para coleta.`
    );
    return buildProducerDashboard();
  }

  if (pathname === '/admin/dashboard' && method === 'GET') {
    return buildAdminDashboard();
  }

  if (pathname === '/admin/zones' && method === 'POST') {
    const name = body?.name?.trim();
    const postalCodePrefix = (body?.postalCodePrefix ?? '').replace(/\D/g, '');
    const city = body?.city?.trim() || 'São Paulo';
    const cutoffHours = Number(body?.cutoffHours ?? 36);
    if (!name || postalCodePrefix.length < 2) {
      throw new Error(
        'Informe o nome da zona e ao menos 2 dígitos iniciais do CEP.'
      );
    }
    const zones = read<AdminServiceZone[]>(
      storageKeys.adminZones,
      defaultAdminZones()
    );
    const created: AdminServiceZone = {
      id: `zone-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      postalCodePrefix,
      city,
      active: true,
      cutoffHours: Number.isInteger(cutoffHours) && cutoffHours > 0 ? cutoffHours : 36,
      ordersCount: 0,
    };
    write(storageKeys.adminZones, [...zones, created]);
    appendProducerAudit(
      'zone.created',
      'Onboarding',
      created.id,
      `Zona de atendimento "${created.name}" (CEP ${created.postalCodePrefix}*) criada por Operações.`
    );
    return buildAdminDashboard();
  }

  if (
    pathname.startsWith('/admin/zones/') &&
    pathname.endsWith('/toggle') &&
    method === 'PATCH'
  ) {
    const zoneId = pathname
      .replace('/admin/zones/', '')
      .replace('/toggle', '');
    const zones = read<AdminServiceZone[]>(
      storageKeys.adminZones,
      defaultAdminZones()
    );
    const idx = zones.findIndex((z) => z.id === zoneId);
    if (idx < 0) throw new Error('Zona de atendimento não encontrada.');
    zones[idx] = { ...zones[idx], active: !zones[idx].active };
    write(storageKeys.adminZones, zones);
    appendProducerAudit(
      zones[idx].active ? 'zone.activated' : 'zone.paused',
      'Onboarding',
      zoneId,
      `Zona "${zones[idx].name}" ${zones[idx].active ? 'ativada' : 'pausada'} por Operações.`
    );
    return buildAdminDashboard();
  }

  if (pathname === '/admin/slots' && method === 'POST') {
    const zoneId = body?.zoneId?.trim();
    const label = body?.label?.trim();
    const startsAt = body?.startsAt || MOCK_DELIVERY_SLOTS[0].startsAt;
    const endsAt = body?.endsAt || MOCK_DELIVERY_SLOTS[0].endsAt;
    const capacity = Number(body?.capacity ?? 30);
    if (!zoneId || !label) {
      throw new Error('Selecione a zona e informe o rótulo da janela de entrega.');
    }
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error('A capacidade da janela deve ser maior que zero.');
    }
    const zones = read<AdminServiceZone[]>(
      storageKeys.adminZones,
      defaultAdminZones()
    );
    const zone = zones.find((z) => z.id === zoneId);
    if (!zone) throw new Error('Zona de atendimento inválida.');

    const slots = read<AdminDeliverySlot[]>(
      storageKeys.adminSlots,
      defaultAdminSlots()
    );
    const created: AdminDeliverySlot = {
      id: `slot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      zoneId: zone.id,
      zoneName: zone.name,
      label,
      startsAt,
      endsAt,
      capacity,
      occupied: 0,
      active: true,
    };
    write(storageKeys.adminSlots, [...slots, created]);
    appendProducerAudit(
      'slot.created',
      'Inventory',
      created.id,
      `Janela de entrega "${created.label}" criada na ${zone.name} com capacidade de ${capacity} pedidos.`
    );
    return buildAdminDashboard();
  }

  if (pathname.startsWith('/admin/slots/') && method === 'PATCH') {
    const slotId = pathname.replace('/admin/slots/', '');
    const slots = read<AdminDeliverySlot[]>(
      storageKeys.adminSlots,
      defaultAdminSlots()
    );
    const idx = slots.findIndex((s) => s.id === slotId);
    if (idx < 0) throw new Error('Janela de entrega não encontrada.');
    const nextCapacity =
      body?.capacity !== undefined ? Number(body.capacity) : slots[idx].capacity;
    if (!Number.isInteger(nextCapacity) || nextCapacity <= 0) {
      throw new Error('A capacidade deve ser um número inteiro positivo.');
    }
    const nextActive =
      typeof body?.active === 'boolean' ? body.active : slots[idx].active;
    slots[idx] = {
      ...slots[idx],
      capacity: nextCapacity,
      active: nextActive,
    };
    write(storageKeys.adminSlots, slots);
    appendProducerAudit(
      'slot.updated',
      'Inventory',
      slotId,
      `Janela "${slots[idx].label}" atualizada (capacidade: ${nextCapacity}, ativa: ${nextActive ? 'Sim' : 'Não'}).`
    );
    return buildAdminDashboard();
  }

  if (pathname === '/admin/routes' && method === 'POST') {
    const name = body?.name?.trim();
    const zoneId = body?.zoneId?.trim();
    const slotId = body?.slotId?.trim();
    const driverName = body?.driverName?.trim() || 'Motorista da Frota Local';
    if (!name || !zoneId || !slotId) {
      throw new Error(
        'Informe o nome da rota, a zona e a janela de entrega correspondente.'
      );
    }
    const zones = read<AdminServiceZone[]>(
      storageKeys.adminZones,
      defaultAdminZones()
    );
    const slots = read<AdminDeliverySlot[]>(
      storageKeys.adminSlots,
      defaultAdminSlots()
    );
    const zone = zones.find((z) => z.id === zoneId) ?? zones[0];
    const slot = slots.find((s) => s.id === slotId) ?? slots[0];
    const routes = read<AdminManualRoute[]>(
      storageKeys.adminRoutes,
      defaultAdminRoutes()
    );
    const created: AdminManualRoute = {
      id: `route-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name,
      zoneId: zone.id,
      zoneName: zone.name,
      slotId: slot.id,
      slotLabel: slot.label,
      driverName,
      status: 'open',
      orderIds: [],
      createdAt: new Date().toISOString(),
    };
    write(storageKeys.adminRoutes, [created, ...routes]);
    appendProducerAudit(
      'route.created',
      'Order',
      created.id,
      `Rota manual "${created.name}" (${zone.name}) criada com motorista ${driverName}.`
    );
    return buildAdminDashboard();
  }

  if (
    pathname.startsWith('/admin/orders/') &&
    pathname.endsWith('/assign-route') &&
    method === 'POST'
  ) {
    const orderId = pathname
      .replace('/admin/orders/', '')
      .replace('/assign-route', '');
    const routeId = body?.routeId?.trim() || null;
    const routes = read<AdminManualRoute[]>(
      storageKeys.adminRoutes,
      defaultAdminRoutes()
    );
    const list = orders();
    const orderIdx = list.findIndex((o) => o.id === orderId);
    if (orderIdx < 0) throw new Error('Pedido não encontrado.');

    const updatedRoutes = routes.map((r) => {
      const withoutOrder = r.orderIds.filter((id) => id !== orderId);
      if (routeId && r.id === routeId) {
        return { ...r, orderIds: [...withoutOrder, orderId] };
      }
      return { ...r, orderIds: withoutOrder };
    });
    write(storageKeys.adminRoutes, updatedRoutes);

    const assigned = updatedRoutes.find((r) => r.id === routeId);
    list[orderIdx] = {
      ...list[orderIdx],
      routeId: assigned?.id ?? null,
      routeName: assigned?.name ?? null,
    };
    write(storageKeys.orders, list);

    appendProducerAudit(
      'route.assigned',
      'Order',
      orderId,
      assigned
        ? `Pedido #${orderId} alocado manualmente na rota "${assigned.name}".`
        : `Pedido #${orderId} desvinculado de rota manual.`
    );
    return buildAdminDashboard();
  }

  if (
    pathname.startsWith('/admin/orders/') &&
    pathname.endsWith('/status') &&
    method === 'POST'
  ) {
    const orderId = pathname
      .replace('/admin/orders/', '')
      .replace('/status', '');
    const targetStage = body?.stage as OrderStage | undefined;
    if (!targetStage || !ORDER_STATUS_FLOW.includes(targetStage)) {
      throw new Error('Estágio operacional inválido.');
    }
    const list = orders();
    const idx = list.findIndex((o) => o.id === orderId);
    if (idx < 0) throw new Error('Pedido não encontrado.');
    const order = list[idx];
    const currentStage =
      (order.operationalStage as OrderStage | undefined) ??
      consumerLabelToStage(order.status);

    if (!canTransitionOrder(currentStage, targetStage)) {
      throw new Error(
        `Transição inválida de "${stageToConsumerLabel(currentStage)}" para "${stageToConsumerLabel(targetStage)}". Respeite a sequência operacional.`
      );
    }

    const now = new Date().toISOString();
    const nextConsumerLabel = stageToConsumerLabel(targetStage);
    order.status = nextConsumerLabel;
    order.operationalStage = targetStage;
    if (targetStage === 'delivered') {
      order.delivery = { status: 'delivered', confirmedAt: now };
    }
    order.statusHistory = [
      ...order.statusHistory,
      {
        toStatus: `${nextConsumerLabel} (atualizado por Operações)`,
        createdAt: now,
        actor: 'Operações',
      },
    ];
    list[idx] = order;
    write(storageKeys.orders, list);

    appendProducerAudit(
      `order.status.${targetStage}`,
      'Order',
      orderId,
      `Status do pedido #${orderId} avançado para "${nextConsumerLabel}" pela equipe de Operações.`
    );
    return buildAdminDashboard();
  }

  if (
    pathname.startsWith('/admin/exceptions/') &&
    pathname.endsWith('/resolve') &&
    method === 'POST'
  ) {
    const excId = pathname
      .replace('/admin/exceptions/', '')
      .replace('/resolve', '');
    const resolutionNote =
      body?.resolutionNote?.trim() ||
      'Exceção tratada e registrada pela central de Operações.';
    const now = new Date().toISOString();
    const dash = buildAdminDashboard();
    const target = dash.exceptions.find((e) => e.id === excId);
    if (!target) throw new Error('Exceção operacional não encontrada.');

    const stored = read<AdminExceptionItem[]>(
      storageKeys.adminExceptions,
      defaultAdminExceptions()
    );
    const resolvedItem: AdminExceptionItem = {
      ...target,
      status: 'resolved',
      resolutionNote,
      resolvedAt: now,
    };
    const existingIdx = stored.findIndex((e) => e.id === excId);
    if (existingIdx >= 0) {
      stored[existingIdx] = resolvedItem;
      write(storageKeys.adminExceptions, stored);
    } else {
      write(storageKeys.adminExceptions, [resolvedItem, ...stored]);
    }

    if (target.type === 'lgpd_request') {
      const reqs = read<LgpdDeletionRequest[]>(storageKeys.lgpdRequests, []);
      const updatedReqs = reqs.map((r) =>
        r.protocol === target.referenceId
          ? { ...r, status: 'completed' as const, completedAt: now }
          : r
      );
      write(storageKeys.lgpdRequests, updatedReqs);
    }

    appendProducerAudit(
      'exception.resolved',
      'Order',
      target.referenceId,
      `Exceção "${target.title}" resolvida: ${resolutionNote}`
    );
    return buildAdminDashboard();
  }

  if (pathname === '/delivery-slots' && method === 'GET') {
    const adminSlots = read<AdminDeliverySlot[]>(
      storageKeys.adminSlots,
      defaultAdminSlots()
    );
    const activeSlots = adminSlots
      .filter((s) => s.active)
      .map(({ id, label, startsAt, endsAt }) => ({
        id,
        label,
        startsAt,
        endsAt,
      }));
    return {
      data: activeSlots.length > 0 ? activeSlots : MOCK_DELIVERY_SLOTS,
    };
  }

  if (pathname === '/baskets' && method === 'GET') {
    return { data: currentBaskets() };
  }

  if (pathname.startsWith('/baskets/') && method === 'GET') {
    const basket = currentBaskets().find(
      (b) => b.id === pathname.replace('/baskets/', '')
    );
    if (!basket) throw new Error('Cesta fixa não encontrada.');
    return basket;
  }

  if (pathname === '/subscriptions' && method === 'GET') {
    return { data: subscriptions() };
  }

  if (pathname === '/subscriptions' && method === 'POST') {
    const idempotencyKey = extractHeader(options.headers, 'x-idempotency-key');
    return createSubscription(body, idempotencyKey);
  }

  if (
    pathname.startsWith('/subscriptions/') &&
    pathname.endsWith('/pause') &&
    method === 'POST'
  ) {
    const subId = pathname
      .replace('/subscriptions/', '')
      .replace('/pause', '');
    const list = subscriptions();
    const index = list.findIndex((s) => s.id === subId);
    if (index < 0) throw new Error('Assinatura não encontrada.');
    const sub = list[index];
    if (sub.status === 'cancelled') {
      throw new Error('Assinatura cancelada não pode ser pausada.');
    }
    if (!sub.canModifyCurrentCycle) {
      throw new Error(
        `Prazo de alteração encerrado. Você só pode pausar até ${sub.cutoffHours}h antes da próxima entrega.`
      );
    }
    sub.status = 'paused';
    sub.updatedAt = new Date().toISOString();
    list[index] = enrichSubscriptionCutoff(sub);
    write(storageKeys.subscriptions, list);
    return list[index];
  }

  if (
    pathname.startsWith('/subscriptions/') &&
    pathname.endsWith('/resume') &&
    method === 'POST'
  ) {
    const subId = pathname
      .replace('/subscriptions/', '')
      .replace('/resume', '');
    const list = subscriptions();
    const index = list.findIndex((s) => s.id === subId);
    if (index < 0) throw new Error('Assinatura não encontrada.');
    const sub = list[index];
    if (sub.status === 'cancelled') {
      throw new Error(
        'Assinatura cancelada não pode ser reativada. Inicie uma nova assinatura em Cestas.'
      );
    }
    sub.status = 'active';
    sub.updatedAt = new Date().toISOString();
    list[index] = enrichSubscriptionCutoff(sub);
    write(storageKeys.subscriptions, list);
    return list[index];
  }

  if (
    pathname.startsWith('/subscriptions/') &&
    pathname.endsWith('/cancel') &&
    method === 'POST'
  ) {
    const subId = pathname
      .replace('/subscriptions/', '')
      .replace('/cancel', '');
    const list = subscriptions();
    const index = list.findIndex((s) => s.id === subId);
    if (index < 0) throw new Error('Assinatura não encontrada.');
    const sub = list[index];
    if (!sub.canModifyCurrentCycle) {
      throw new Error(
        `Prazo de cancelamento encerrado para o ciclo atual (limite de ${sub.cutoffHours}h antes da entrega).`
      );
    }
    sub.status = 'cancelled';
    sub.updatedAt = new Date().toISOString();
    list[index] = enrichSubscriptionCutoff(sub);
    write(storageKeys.subscriptions, list);
    return list[index];
  }

  if (
    pathname.startsWith('/subscriptions/') &&
    pathname.endsWith('/generate-cycle') &&
    method === 'POST'
  ) {
    const subId = pathname
      .replace('/subscriptions/', '')
      .replace('/generate-cycle', '');
    const list = subscriptions();
    const index = list.findIndex((s) => s.id === subId);
    if (index < 0) throw new Error('Assinatura não encontrada.');
    const sub = list[index];
    if (sub.status !== 'active') {
      throw new Error(
        'Apenas assinaturas ativas podem gerar um novo ciclo de entrega.'
      );
    }

    const cycleKey =
      body?.cycleKey || sub.nextDeliveryAt.slice(0, 10) || 'next-cycle';
    const existingCycle = sub.cycles.find((c) => c.cycleKey === cycleKey);
    if (existingCycle) {
      return sub;
    }

    const now = new Date();
    const basket =
      currentBaskets().find((b) => b.id === sub.basketId) ?? baseBaskets[0];

    if (body?.simulatePaymentFailure) {
      const failedCycle: SubscriptionCycle = {
        id: `CYC-${Math.floor(200 + Math.random() * 800)}`,
        cycleKey,
        deliveryDate: sub.nextDeliveryAt,
        billingDate: now.toISOString(),
        amountCents: sub.priceCents,
        status: 'payment_failed',
        paymentStatus: 'failed',
        orderId: null,
        note: 'Falha na cobrança recorrente sandbox. Verifique o meio de pagamento.',
        createdAt: now.toISOString(),
      };
      sub.status = 'payment_failed';
      sub.cycles = [failedCycle, ...sub.cycles];
      sub.updatedAt = now.toISOString();
      list[index] = enrichSubscriptionCutoff(sub);
      write(storageKeys.subscriptions, list);
      return list[index];
    }

    const stocks = stockMap();
    const available = stocks[basket.productId] ?? 0;
    if (available < 1) {
      const shortageCycle: SubscriptionCycle = {
        id: `CYC-${Math.floor(200 + Math.random() * 800)}`,
        cycleKey,
        deliveryDate: sub.nextDeliveryAt,
        billingDate: now.toISOString(),
        amountCents: sub.priceCents,
        status: 'stock_shortage',
        paymentStatus: 'pending',
        orderId: null,
        note: 'Estoque insuficiente da cesta no lote da semana. Nenhuma cobrança efetuada.',
        createdAt: now.toISOString(),
      };
      sub.cycles = [shortageCycle, ...sub.cycles];
      sub.updatedAt = now.toISOString();
      list[index] = enrichSubscriptionCutoff(sub);
      write(storageKeys.subscriptions, list);
      return list[index];
    }

    stocks[basket.productId] = available - 1;
    write(storageKeys.stock, stocks);

    const orderId = `AG-${Math.floor(1000 + Math.random() * 9000)}`;
    const cycleOrder = makeOrder(
      orderId,
      'Em preparação',
      [[basket.productId, 1]],
      now.toISOString(),
      sub.deliverySlot.id,
      `cycle-${sub.id}-${cycleKey}`
    );
    cycleOrder.address = sub.address;
    write(storageKeys.orders, [cycleOrder, ...orders()]);

    const confirmedCycle: SubscriptionCycle = {
      id: `CYC-${Math.floor(200 + Math.random() * 800)}`,
      cycleKey,
      deliveryDate: sub.nextDeliveryAt,
      billingDate: now.toISOString(),
      amountCents: sub.priceCents,
      status: 'confirmed',
      paymentStatus: 'approved',
      orderId: cycleOrder.id,
      note: 'Ciclo recorrente confirmado e estoque reservado.',
      createdAt: now.toISOString(),
    };

    const stepDays = sub.frequency === 'weekly' ? 7 : 30;
    const nextDelivery = new Date(
      new Date(sub.nextDeliveryAt).getTime() + stepDays * 86400000
    );
    const nextBilling = new Date(
      nextDelivery.getTime() - sub.cutoffHours * 3600000
    );

    sub.cycles = [confirmedCycle, ...sub.cycles];
    sub.nextDeliveryAt = nextDelivery.toISOString();
    sub.nextBillingAt = nextBilling.toISOString();
    sub.updatedAt = now.toISOString();
    list[index] = enrichSubscriptionCutoff(sub);
    write(storageKeys.subscriptions, list);
    return list[index];
  }

  if (pathname === '/account/profile' && method === 'GET') {
    const addresses = read<SavedAddress[]>(
      storageKeys.addresses,
      defaultSavedAddresses()
    );
    const lgpdRequests = read<LgpdDeletionRequest[]>(
      storageKeys.lgpdRequests,
      []
    );
    const profile: AccountProfile = {
      user: {
        id: 'mock-consumer',
        email: DEMO_CREDENTIALS.email,
        role: 'consumer',
      },
      maskedCpf: maskCpf(DEMO_CPF),
      paymentGatewayStatus: {
        provider: 'Adapter Fake Sandbox (Mercado Pago não conectado)',
        mode: 'sandbox',
        storesCardData: false,
        description:
          'Nenhum dado bruto de cartão de crédito é armazenado pelo AgriTech. Cobranças avulsas e recorrentes operam em modo de simulação local.',
      },
      addresses,
      lgpdRequests,
    };
    return profile;
  }

  if (pathname === '/account/addresses' && method === 'POST') {
    const clean = validateAddress(body);
    const label = body?.label?.trim() || 'Endereço adicional';
    const addresses = read<SavedAddress[]>(
      storageKeys.addresses,
      defaultSavedAddresses()
    );
    const created: SavedAddress = {
      id: `addr-${Date.now()}`,
      label,
      zoneName: resolveZoneName(clean.postalCode),
      isDefault: addresses.length === 0,
      ...clean,
    };
    const next = [...addresses, created];
    write(storageKeys.addresses, next);
    return { data: next };
  }

  if (pathname.startsWith('/account/addresses/') && method === 'DELETE') {
    const id = pathname.replace('/account/addresses/', '');
    const addresses = read<SavedAddress[]>(
      storageKeys.addresses,
      defaultSavedAddresses()
    ).filter((a) => a.id !== id);
    write(storageKeys.addresses, addresses);
    return { data: addresses };
  }

  if (pathname === '/account/lgpd-deletion-request' && method === 'POST') {
    const reason =
      body?.reason?.trim() ||
      'Solicitação de exclusão e anonimização de dados pessoais conforme LGPD.';
    const existing = read<LgpdDeletionRequest[]>(storageKeys.lgpdRequests, []);
    if (existing.some((r) => r.status === 'pending_review')) {
      throw new Error(
        'Já existe uma solicitação LGPD em análise para esta conta.'
      );
    }
    const created: LgpdDeletionRequest = {
      id: `lgpd-${Date.now()}`,
      protocol: `LGPD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      reason,
      status: 'pending_review',
      requestedAt: new Date().toISOString(),
    };
    const next = [created, ...existing];
    write(storageKeys.lgpdRequests, next);
    return created;
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

/* eslint-disable @next/next/no-location-assign-relative-destination -- API client handles auth expiry outside React event handlers. */
import { mockApi } from './mock-data';

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/v1';

// Local previews work without the Nest/Prisma stack. Set this to "false" in
// .env.local when you want to call a running backend instead.
export const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA !== 'false';

export type User = { id: string; email: string; role: string };

export type AuthResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: User;
};

export type BasketItem = {
  productId?: string;
  name: string;
  quantity: string;
  origin: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  priceCents: number;
  active?: boolean;
  certification?: string;
  producer: { id: string; name: string };
  stock: {
    available: number;
    reserved?: number;
    lowStockThreshold?: number;
    deliveryDate: string | null;
  };
  seasonality?: string;
  basketId?: string;
  basketItems?: BasketItem[];
};

export type ProducerCertification = {
  id: string;
  name: string;
  issuer: string;
  validUntil: string;
  status: 'valid' | 'expiring_soon' | 'pending_verification';
};

export type ProducerAuditEntry = {
  id: string;
  action: string;
  resourceType: 'Product' | 'Inventory' | 'Onboarding' | 'Order' | 'Payout';
  resourceId: string;
  summary: string;
  createdAt: string;
};

export type ProducerPayoutItem = {
  id: string;
  orderId: string;
  createdAt: string;
  scheduledAt: string;
  grossCents: number;
  feePercent: number;
  feeCents: number;
  netCents: number;
  status: 'scheduled' | 'paid' | 'pending_split_approval';
  itemsSummary: string;
};

export type ProducerFulfillmentItem = {
  orderId: string;
  status: string;
  producerSeparated: boolean;
  deliverySlot: { id: string; startsAt: string; endsAt: string };
  customerCity: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unit: string;
    unitPriceCents: number;
  }[];
  producerGrossCents: number;
};

export type ProducerHarvestSummary = {
  productId: string;
  name: string;
  unit: string;
  totalQuantity: number;
  ordersCount: number;
};

export type ProducerDashboardData = {
  producer: {
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
    pendingTasksCount: number;
    pendingReasons: string[];
    certifications: ProducerCertification[];
  };
  metrics: {
    activeOffersCount: number;
    pausedOffersCount: number;
    lowStockCount: number;
    pendingFulfillmentCount: number;
    grossSalesCents: number;
    netPayoutCents: number;
  };
  offers: Product[];
  fulfillmentQueue: ProducerFulfillmentItem[];
  harvestSummary: ProducerHarvestSummary[];
  payouts: ProducerPayoutItem[];
  auditLogs: ProducerAuditEntry[];
};

export type Basket = {
  id: string;
  productId: string;
  name: string;
  description: string;
  priceCents: number;
  producer: { id: string; name: string };
  frequencies: ('weekly' | 'monthly')[];
  cutoffHours: number;
  stock: { available: number; deliveryDate: string };
  items: BasketItem[];
  seasonality: string;
};

export type SubscriptionCycle = {
  id: string;
  cycleKey: string;
  deliveryDate: string;
  billingDate: string;
  amountCents: number;
  status:
    | 'scheduled'
    | 'confirmed'
    | 'stock_shortage'
    | 'payment_failed'
    | 'skipped';
  paymentStatus: 'approved' | 'pending' | 'failed';
  orderId: string | null;
  note?: string;
  createdAt: string;
};

export type Subscription = {
  id: string;
  basketId: string;
  basketName: string;
  producer: { id: string; name: string };
  frequency: 'weekly' | 'monthly';
  priceCents: number;
  status: 'active' | 'paused' | 'cancelled' | 'payment_failed';
  cutoffHours: number;
  cutoffAt: string;
  canModifyCurrentCycle: boolean;
  nextBillingAt: string;
  nextDeliveryAt: string;
  address: Order['address'];
  deliverySlot: Order['deliverySlot'] & { label?: string };
  items: BasketItem[];
  cycles: SubscriptionCycle[];
  createdAt: string;
  updatedAt: string;
};

export type SavedAddress = Order['address'] & {
  id: string;
  label: string;
  zoneName: string;
  isDefault?: boolean;
};

export type LgpdDeletionRequest = {
  id: string;
  protocol: string;
  reason: string;
  status: 'pending_review' | 'completed';
  requestedAt: string;
  completedAt?: string;
};

export type AccountProfile = {
  user: User;
  maskedCpf: string;
  paymentGatewayStatus: {
    provider: string;
    mode: 'sandbox';
    storesCardData: false;
    description: string;
  };
  addresses: SavedAddress[];
  lgpdRequests: LgpdDeletionRequest[];
};

export type Cart = { data: CartItem[]; totalCents: number; currency: string };

export type CartItem = {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  subtotalCents: number;
  available: number;
};

export type Order = {
  id: string;
  status: string;
  operationalStage?: 'pending_payment' | 'confirmed' | 'preparing' | 'in_transit' | 'delivered';
  routeId?: string | null;
  routeName?: string | null;
  zoneName?: string;
  totalCents: number;
  idempotencyKey: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
  }[];
  payment: { provider: string; status: string };
  delivery: { status: string; confirmedAt: string | null };
  address: {
    postalCode: string;
    street: string;
    number: string;
    complement?: string;
    city: string;
    state: string;
  };
  deliverySlot: { id: string; startsAt: string; endsAt: string };
  statusHistory: { toStatus: string; createdAt: string; actor?: string }[];
};

export type AdminServiceZone = {
  id: string;
  name: string;
  postalCodePrefix: string;
  city: string;
  cutoffHours: number;
  active: boolean;
  ordersCount: number;
};

export type AdminDeliverySlot = {
  id: string;
  zoneId: string;
  zoneName: string;
  label: string;
  startsAt: string;
  endsAt: string;
  capacity: number;
  occupied: number;
  active: boolean;
};

export type AdminManualRoute = {
  id: string;
  name: string;
  zoneId: string;
  zoneName: string;
  slotId: string;
  slotLabel: string;
  driverName: string;
  orderIds: string[];
  status: 'open' | 'dispatched' | 'closed';
  createdAt: string;
};

export type AdminExceptionItem = {
  id: string;
  type:
    | 'payment_failure'
    | 'payment_failed'
    | 'stock_shortage'
    | 'refund_request'
    | 'lgpd_request';
  severity: 'medium' | 'high';
  referenceId: string;
  title: string;
  description: string;
  status: 'open' | 'resolved';
  resolutionNote?: string;
  createdAt: string;
  resolvedAt?: string;
};

export type AdminManifestEntry = {
  orderId: string;
  status: string;
  operationalStage: string;
  customerEmail: string;
  zoneName: string;
  routeName: string;
  slotLabel: string;
  addressLine: string;
  postalCode: string;
  producerSeparated: boolean;
  itemsSummary: string;
  producersSummary: string;
  totalCents: number;
};

export type AdminDashboardData = {
  metrics: {
    totalOrdersCount: number;
    inTransitCount: number;
    deliveredCount: number;
    openExceptionsCount: number;
    activeZonesCount: number;
    totalSlotCapacity: number;
    occupiedSlotsCount: number;
  };
  zones: AdminServiceZone[];
  slots: AdminDeliverySlot[];
  routes: AdminManualRoute[];
  orders: Order[];
  exceptions: AdminExceptionItem[];
  manifest: AdminManifestEntry[];
  auditLogs: ProducerAuditEntry[];
};

export type DeliverySlotOption = {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
};

export type CatalogResponse = {
  data: Product[];
  pagination: {
    limit: number;
    offset: number;
    count: number;
    nextOffset: number | null;
  };
};

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function notifyStateChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('agritech:state'));
  }
}

function token() {
  return typeof window === 'undefined'
    ? null
    : localStorage.getItem('agritech_token');
}

export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('agritech_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function saveSession(auth: AuthResponse) {
  localStorage.setItem('agritech_token', auth.accessToken);
  localStorage.setItem('agritech_user', JSON.stringify(auth.user));
  notifyStateChange();
}

export function clearSession() {
  localStorage.removeItem('agritech_token');
  localStorage.removeItem('agritech_user');
  notifyStateChange();
}

export function isAuthenticated() {
  return Boolean(token());
}

export function requireAuth() {
  if (!token()) {
    window.location.href = `/entrar?next=${encodeURIComponent(
      window.location.pathname
    )}`;
    return false;
  }
  return true;
}

export function formatPrice(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString('pt-BR', { dateStyle: 'medium' })
    : 'Data a confirmar';
}

export function formatDateTime(value: string | null) {
  return value
    ? new Date(value).toLocaleString('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : 'Horário a confirmar';
}

const AUDIT_ACTION_LABELS: Record<string, string> = {
  'onboarding.approved': 'Onboarding aprovado',
  'onboarding.updated': 'Cadastro atualizado',
  'inventory.updated': 'Estoque atualizado',
  'offer.published': 'Oferta publicada',
  'offer.draft_saved': 'Rascunho salvo',
  'offer.activated': 'Oferta reativada',
  'offer.paused': 'Oferta pausada',
  'offer.updated': 'Oferta editada',
  'fulfillment.separated': 'Separação concluída',
  'zone.created': 'Zona criada',
  'zone.activated': 'Zona ativada',
  'zone.paused': 'Zona pausada',
  'slot.created': 'Janela criada',
  'slot.updated': 'Janela atualizada',
  'route.created': 'Rota criada',
  'route.assigned': 'Rota atribuída',
  'order.status.pending_payment': 'Aguardando pagamento',
  'order.status.confirmed': 'Pedido confirmado',
  'order.status.preparing': 'Em preparação',
  'order.status.in_transit': 'Despachado para rota',
  'order.status.delivered': 'Entrega confirmada',
  'exception.resolved': 'Exceção resolvida',
};

const AUDIT_RESOURCE_LABELS: Record<string, string> = {
  Onboarding: 'Propriedade / Zona',
  Inventory: 'Estoque / Janela',
  Product: 'Oferta do catálogo',
  Order: 'Pedido / Rota',
};

const EXCEPTION_TYPE_LABELS: Record<string, string> = {
  stock_shortage: 'Ruptura ou substituição de estoque',
  payment_failure: 'Falha de cobrança recorrente',
  payment_failed: 'Falha de cobrança recorrente',
  refund_request: 'Solicitação de reembolso',
  lgpd_request: 'Direito do titular (LGPD)',
};

export function formatAuditAction(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? 'Registro operacional';
}

export function formatAuditResource(resourceType: string): string {
  return AUDIT_RESOURCE_LABELS[resourceType] ?? resourceType;
}

export function formatExceptionType(type: string): string {
  return EXCEPTION_TYPE_LABELS[type] ?? 'Ocorrência operacional';
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  if (USE_MOCK_DATA) {
    const result = (await mockApi(path, options)) as T;
    if (method !== 'GET') notifyStateChange();
    return result;
  }
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const t = token();
  if (t) headers.set('Authorization', `Bearer ${t}`);
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 401) {
    clearSession();
    if (typeof window !== 'undefined')
      window.location.href = `/entrar?next=${encodeURIComponent(
        window.location.pathname
      )}`;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message = Array.isArray(body?.error?.message)
      ? body.error.message.join(', ')
      : body?.error?.message ||
        body?.message ||
        'Não foi possível concluir a operação.';
    throw new ApiError(response.status, message);
  }
  if (method !== 'GET') notifyStateChange();
  return body as T;
}

export const auth = {
  register: (data: {
    email: string;
    cpf: string;
    password: string;
    role?: 'consumer' | 'producer';
    displayName?: string;
  }) =>
    api<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  login: (data: { email: string; password: string }) =>
    api<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

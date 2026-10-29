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

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  unit: string;
  priceCents: number;
  producer: { id: string; name: string };

  stock: { available: number; deliveryDate: string | null };

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

  statusHistory: { toStatus: string; createdAt: string }[];
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

function token() {
  return typeof window === 'undefined'
    ? null
    : localStorage.getItem('agritech_token');
}

export function saveSession(auth: AuthResponse) {
  localStorage.setItem('agritech_token', auth.accessToken);
  localStorage.setItem('agritech_user', JSON.stringify(auth.user));
}

export function clearSession() {
  localStorage.removeItem('agritech_token');
  localStorage.removeItem('agritech_user');
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

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (USE_MOCK_DATA) return (await mockApi(path, options)) as T;
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
  return body as T;
}

export const auth = {
  register: (data: { email: string; cpf: string; password: string }) =>
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


'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header, StatusBadge } from '@/components/ui';
import {
  api,
  formatPrice,
  formatDate,
  requireAuth,
  type Order,
} from '@/lib/api';

export default function Pedidos() {
  const [orders, setOrders] = useState<Order[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth()) return;
    api<{ data: Order[] }>('/orders')
      .then((x) => setOrders(x.data))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header app />
      <main className="page-main container narrow">
        <div className="breadcrumb">
          <Link href="/app">Área do consumidor</Link>
          <span>/</span>Pedidos
        </div>
        <h1>Seus pedidos e entregas</h1>
        <p className="lead">Acompanhe a confirmação e o envio dos pedidos realizados diretamente aos produtores.</p>
        {loading && <p className="loading-indicator">Carregando pedidos…</p>}
        {error && <p className="danger-text">{error}</p>}
        {!loading && !error && !orders.length && (
          <section className="dashboard-card empty-card">
            <h2>Você ainda não tem pedidos realizados.</h2>
            <p className="muted">Descubra os produtos da safra semanal e monte a sua primeira sacola.</p>
            <Link href="/catalogo" className="button button-primary">
              Explorar ofertas
            </Link>
          </section>
        )}
        {orders.map((o) => (
          <section className="dashboard-card order-card" key={o.id}>
            <div className="card-heading">
              <div>
                <span className="order-code">Pedido #{o.id}</span>
                <h2>
                  {o.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                </h2>
              </div>
              <StatusBadge>{o.status}</StatusBadge>
            </div>
            <div className="delivery-info">
              <div>
                <span>Total pago</span>
                <strong>{formatPrice(o.totalCents)}</strong>
              </div>
              <div>
                <span>Janela de entrega</span>
                <strong>{formatDate(o.deliverySlot.startsAt)}</strong>
              </div>
              <Link href={`/app/pedidos/${o.id}`} className="text-link">
                Ver detalhes do pedido →
              </Link>
            </div>
          </section>
        ))}
      </main>
    </>
  );
}

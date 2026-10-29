'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header, StatusBadge } from '@/components/ui';
import { api, formatPrice, requireAuth, type Order } from '@/lib/api';

export default function PedidoDetalhe({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null),
    [error, setError] = useState('');

  useEffect(() => {
    if (!requireAuth()) return;
    api<Order>(`/orders/${params.id}`)
      .then(setOrder)
      .catch((e) => setError(e.message));
  }, [params.id]);

  return (
    <>
      <Header app />
      <main className="page-main container narrow">
        <div className="breadcrumb">
          <Link href="/app/pedidos">Pedidos</Link>
          <span>/</span>Detalhe
        </div>
        {error && <p className="danger-text">{error}</p>}
        {!order && !error && <p className="loading-indicator">Carregando pedido…</p>}
        {order && (
          <section className="dashboard-card order-detail-card">
            <div className="card-heading">
              <div>
                <span className="order-code">Pedido #{order.id}</span>
                <h1>
                  {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                </h1>
              </div>
              <StatusBadge>{order.status}</StatusBadge>
            </div>
            <div className="delivery-info">
              <div>
                <span>Total</span>
                <strong>{formatPrice(order.totalCents)}</strong>
              </div>
              <div>
                <span>Endereço de entrega</span>
                <strong>
                  {order.address.street}, {order.address.number} · {order.address.city}
                </strong>
              </div>
              <div>
                <span>Pagamento</span>
                <strong>
                  {order.payment.status} · {order.payment.provider}
                </strong>
              </div>
            </div>
            <hr className="detail-rule" />
            <h2>Histórico de atualizações</h2>
            <div className="status-history-list">
              {order.statusHistory.map((s, i) => (
                <div className="order-row" key={`${s.createdAt}-${i}`}>
                  <span className="status-timeline-dot" />
                  <div>
                    <strong>{s.toStatus}</strong>
                    <span>{new Date(s.createdAt).toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </>
  );
}

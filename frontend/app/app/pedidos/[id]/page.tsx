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
        {!order && !error && <p>Carregando pedido…</p>}
        {order && (
          <section className="dashboard-card">
            <div className="eyebrow">Pedido {order.id}</div>
            <h1>
              <StatusBadge>{order.status}</StatusBadge>
            </h1>
            <p className="lead">
              {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
            </p>
            <div className="delivery-info">
              <div>
                <span>Total</span>
                <strong>{formatPrice(order.totalCents)}</strong>
              </div>
              <div>
                <span>Endereço</span>
                <strong>
                  {order.address.street}, {order.address.number} ·{' '}
                  {order.address.city}
                </strong>
              </div>
              <div>
                <span>Pagamento</span>
                <strong>
                  {order.payment.status} · {order.payment.provider}
                </strong>
              </div>
            </div>
            <hr />
            <h2>Atualizações</h2>
            {order.statusHistory.map((s, i) => (
              <div className="order-row" key={`${s.createdAt}-${i}`}>
                <span className="order-icon">●</span>
                <div>
                  <strong>{s.toStatus}</strong>
                  <span>{new Date(s.createdAt).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </>
  );
}

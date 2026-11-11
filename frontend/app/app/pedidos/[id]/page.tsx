'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header, StatusBadge } from '@/components/ui';
import { CheckIcon } from '@/components/icons';
import { api, formatPrice, requireAuth, type Order } from '@/lib/api';

export default function PedidoDetalhe() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id ?? '';
  const [order, setOrder] = useState<Order | null>(null),
    [error, setError] = useState(''),
    [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    if (!requireAuth()) return;
    api<Order>(`/orders/${orderId}`)
      .then(setOrder)
      .catch((e) => setError(e.message));
  }, [orderId]);

  async function confirmDelivery() {
    if (!order) return;
    setConfirming(true);
    setError('');
    try {
      const updated = await api<Order>(`/orders/${order.id}/confirm-delivery`, {
        method: 'POST',
      });
      setOrder(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setConfirming(false);
    }
  }

  const isDelivered =
    order?.status === 'Entregue' || order?.status === 'delivered';

  return (
    <>
      <Header app />
      <main className="page-main container">
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
              <StatusBadge tone={isDelivered ? 'success' : 'info'}>
                {order.status}
              </StatusBadge>
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
            {!isDelivered && (
              <div style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  disabled={confirming}
                  onClick={confirmDelivery}
                  className="button button-primary"
                >
                  <CheckIcon size={16} />
                  <span>
                    {confirming
                      ? 'Confirmando entrega…'
                      : 'Confirmar recebimento da entrega'}
                  </span>
                </button>
              </div>
            )}
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

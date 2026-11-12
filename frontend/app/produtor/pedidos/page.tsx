'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Footer,
  Header,
  ProducerSubnav,
  StatusBadge,
} from '@/components/ui';
import { CheckIcon, SproutIcon, TruckIcon } from '@/components/icons';
import {
  api,
  formatDate,
  formatPrice,
  type ProducerDashboardData,
} from '@/lib/api';

export default function ProdutorPedidosPage() {
  const [data, setData] = useState<ProducerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api<ProducerDashboardData>('/producer/dashboard')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function markSeparated(orderId: string) {
    setError('');
    setMessage('');
    try {
      const updated = await api<ProducerDashboardData>(
        `/producer/orders/${orderId}/mark-separated`,
        { method: 'POST' }
      );
      setData(updated);
      setMessage(
        `Pedido #${orderId} marcado como colhido e separado para coleta operacional.`
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <Header app />
      <main className="page-main container">
        <ProducerSubnav
          active="pedidos"
          onboardingApproved={data?.producer.onboardingStatus === 'approved'}
          paymentConnected={data?.producer.paymentAccountConnected ?? true}
        />

        <h1>Fila de colheita e separação de pedidos</h1>
        <p className="lead">
          Consulte os volumes consolidados por item da safra e confirme a separação de cada pedido para a coleta da operação.
        </p>

        {message && (
          <p className="status status-success status-message" role="status" style={{ marginBottom: '20px' }}>
            <span>{message}</span>
          </p>
        )}
        {error && (
          <div className="info-alert" role="alert">
            <strong>Não foi possível atualizar o pedido.</strong>
            <p>{error}</p>
          </div>
        )}
        {loading && <p className="loading-indicator">Carregando fila de separação…</p>}

        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section className="dashboard-card">
              <h2>1. Resumo consolidado de colheita por produto</h2>
              <p className="muted" style={{ marginBottom: '12px' }}>
                Quantidades totais necessárias para atender todos os pedidos em aberto da janela atual.
              </p>
              {data.harvestSummary.length === 0 ? (
                <p className="muted">Todos os pedidos ativos já foram colhidos e entregues.</p>
              ) : (
                <div className="status-history-list">
                  {data.harvestSummary.map((h) => (
                    <div
                      className="order-row"
                      key={h.productId}
                      style={{ justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <SproutIcon size={18} />
                        <div>
                          <strong>{h.name}</strong>
                          <span style={{ display: 'block', fontSize: '13px' }}>
                            Distribuído em {h.ordersCount} pedido(s)
                          </span>
                        </div>
                      </div>
                      <StatusBadge tone="info">
                        Total a colher: {h.totalQuantity} {h.unit}
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 style={{ marginBottom: '12px' }}>2. Pedidos confirmados para separação</h2>
              {data.fulfillmentQueue.map((fq) => (
                <article
                  className="dashboard-card order-card"
                  key={fq.orderId}
                  style={{ marginTop: '14px' }}
                >
                  <div className="card-heading">
                    <div>
                      <span className="order-code">
                        Pedido #{fq.orderId} · Destino: {fq.customerCity}
                      </span>
                      <h3 style={{ marginTop: '4px', fontSize: '18px' }}>
                        {fq.items
                          .map((i) => `${i.quantity}× ${i.name} (${i.unit})`)
                          .join(', ')}
                      </h3>
                    </div>
                    <StatusBadge
                      tone={fq.producerSeparated ? 'success' : 'warning'}
                    >
                      {fq.producerSeparated
                        ? 'Separado para coleta'
                        : 'Aguardando colheita'}
                    </StatusBadge>
                  </div>

                  <div className="delivery-info" style={{ alignItems: 'center' }}>
                    <div>
                      <span>Janela de coleta/entrega</span>
                      <strong>{formatDate(fq.deliverySlot.startsAt)}</strong>
                    </div>
                    <div>
                      <span>Valor bruto do pedido</span>
                      <strong>{formatPrice(fq.producerGrossCents)}</strong>
                    </div>
                    <div>
                      <span>Status operacional</span>
                      <strong>{fq.status}</strong>
                    </div>
                    <div style={{ marginLeft: 'auto' }}>
                      {!fq.producerSeparated ? (
                        <button
                          type="button"
                          onClick={() => markSeparated(fq.orderId)}
                          className="button button-small button-primary"
                        >
                          <CheckIcon size={14} />
                          <span>Confirmar colheita e separação</span>
                        </button>
                      ) : (
                        <span className="count-tag" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <TruckIcon size={15} /> Etiqueta emitida · Pronto para coleta
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

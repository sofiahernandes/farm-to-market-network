'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AdminSubnav,
  Footer,
  Header,
  SectionHeading,
  StatusBadge,
} from '@/components/ui';
import { CheckIcon, MapPinIcon, TruckIcon } from '@/components/icons';
import {
  api,
  formatDateTime,
  formatPrice,
  type AdminDashboardData,
  type Order,
} from '@/lib/api';

const STAGE_LABELS: Record<
  NonNullable<Order['operationalStage']>,
  {
    label: string;
    next?: NonNullable<Order['operationalStage']>;
    nextLabel?: string;
  }
> = {
  pending_payment: {
    label: 'Aguardando pagamento',
    next: 'confirmed',
    nextLabel: 'Avançar para Confirmado',
  },
  confirmed: {
    label: 'Pedido confirmado',
    next: 'preparing',
    nextLabel: 'Avançar para Em preparação',
  },
  preparing: {
    label: 'Em preparação',
    next: 'in_transit',
    nextLabel: 'Despachar para A caminho',
  },
  in_transit: {
    label: 'A caminho',
    next: 'delivered',
    nextLabel: 'Confirmar Entrega Operacional',
  },
  delivered: {
    label: 'Entregue',
  },
};

export default function AdminEntregasPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<AdminDashboardData>('/admin/dashboard')
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function advanceOrderStage(
    orderId: string,
    stage: NonNullable<Order['operationalStage']>
  ) {
    setBusyId(orderId);
    setError('');
    setFeedback('');
    try {
      const updated = await api<AdminDashboardData>(
        `/admin/orders/${orderId}/status`,
        {
          method: 'POST',
          body: JSON.stringify({ stage }),
        }
      );
      setData(updated);
      setFeedback(
        `Status do pedido #${orderId} atualizado para "${STAGE_LABELS[stage].label}" e registrado com autor e data/hora.`
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <Header app />
      <main className="page-main container">
        <div className="breadcrumb">
          <Link href="/">Início</Link>
          <span>/</span>
          <Link href="/admin">Operações</Link>
          <span>/</span>
          <span>Status de entregas</span>
        </div>

        <SectionHeading
          eyebrow="Progressão Sequencial de Entregas"
          title="Atualização operacional: Confirmado → Em preparação → A caminho → Entregue"
        />

        <AdminSubnav
          active="entregas"
          openExceptionsCount={data?.metrics.openExceptionsCount ?? 0}
        />

        {feedback && (
          <div className="info-alert" role="status">
            <strong>{feedback}</strong>
          </div>
        )}
        {error && (
          <div className="zone-alert" style={{ marginBottom: '20px' }}>
            <p className="danger-text" style={{ margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        {loading || !data ? (
          <div className="dashboard-card">
            <p className="muted">Carregando fila de entregas…</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {data.orders.map((order) => {
              const stage = order.operationalStage ?? 'preparing';
              const meta = STAGE_LABELS[stage] ?? STAGE_LABELS.preparing;
              const lastHistory =
                order.statusHistory[order.statusHistory.length - 1];

              return (
                <article key={order.id} className="dashboard-card">
                  <div className="card-heading">
                    <div>
                      <span className="order-code">
                        Pedido #{order.id} · {order.zoneName}
                      </span>
                      <h3 style={{ marginTop: '4px' }}>
                        {order.routeName ?? 'Sem rota atribuída'}
                      </h3>
                    </div>
                    <StatusBadge
                      tone={stage === 'delivered' ? 'success' : 'info'}
                    >
                      {order.status}
                    </StatusBadge>
                  </div>

                  <div className="delivery-info">
                    <div>
                      <span>Destino da entrega</span>
                      <strong>
                        <MapPinIcon size={14} /> {order.address.street},{' '}
                        {order.address.number}{' '}
                        {order.address.complement
                          ? `(${order.address.complement})`
                          : ''}{' '}
                        — {order.address.city}/{order.address.state} · CEP{' '}
                        {order.address.postalCode}
                      </strong>
                    </div>
                    <div>
                      <span>Composição e valor</span>
                      <strong>
                        {order.items
                          .map((i) => `${i.quantity}× ${i.name}`)
                          .join(', ')}{' '}
                        ({formatPrice(order.totalCents)})
                      </strong>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '14px',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface-warm)',
                      border: '1px solid var(--line)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <strong>Última atualização na linha do tempo:</strong>{' '}
                    {lastHistory?.toStatus} ·{' '}
                    {lastHistory ? formatDateTime(lastHistory.createdAt) : ''}
                    {lastHistory?.actor ? ` · Autor: ${lastHistory.actor}` : ''}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginTop: '16px',
                    }}
                  >
                    {meta.next ? (
                      <button
                        type="button"
                        disabled={busyId === order.id}
                        onClick={() => advanceOrderStage(order.id, meta.next!)}
                        className="button button-small button-primary"
                      >
                        <TruckIcon size={15} />
                        <span>
                          {busyId === order.id
                            ? 'Atualizando…'
                            : meta.nextLabel}
                        </span>
                      </button>
                    ) : (
                      <StatusBadge tone="success">
                        <CheckIcon size={14} /> Ciclo de entrega concluído
                      </StatusBadge>
                    )}
                    <Link
                      href={`/app/pedidos/${order.id}`}
                      className="button button-small button-secondary"
                    >
                      Visão do consumidor
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

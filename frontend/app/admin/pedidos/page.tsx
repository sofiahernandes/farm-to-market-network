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
import { CheckIcon, MapPinIcon, ShieldIcon, TruckIcon } from '@/components/icons';
import {
  api,
  formatDateTime,
  formatExceptionType,
  formatPrice,
  type AdminDashboardData,
} from '@/lib/api';

export default function AdminPedidosPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoneFilter, setZoneFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<AdminDashboardData>('/admin/dashboard')
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function resolveException(excId: string) {
    setBusyId(excId);
    setError('');
    setFeedback('');
    try {
      const updated = await api<AdminDashboardData>(
        `/admin/exceptions/${excId}/resolve`,
        {
          method: 'POST',
          body: JSON.stringify({
            resolutionNote:
              notes[excId]?.trim() ||
              'Exceção verificada e solucionada pela central de Operações.',
          }),
        }
      );
      setData(updated);
      setFeedback('Exceção marcada como resolvida e registrada na auditoria.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const filteredOrders =
    data?.orders.filter(
      (o) =>
        (!zoneFilter || o.zoneName === zoneFilter) &&
        (!stageFilter || o.operationalStage === stageFilter)
    ) ?? [];

  return (
    <>
      <Header app />
      <main className="page-main container">
        <div className="breadcrumb">
          <Link href="/">Início</Link>
          <span>/</span>
          <Link href="/admin">Operações</Link>
          <span>/</span>
          <span>Pedidos e exceções</span>
        </div>

        <SectionHeading
          eyebrow="Monitoramento e Tratamento de Incidentes"
          title="Pedidos consolidados e fila de exceções"
        />

        <AdminSubnav
          active="pedidos"
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
            <p className="muted">Carregando fila de pedidos e exceções…</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section className="dashboard-card">
              <div className="card-heading">
                <div>
                  <h2>
                    Fila de exceções (Ruptura e Pagamento Recorrente)
                  </h2>
                  <p className="muted">
                    Registre a providência adotada para concluir cada incidente operacional.
                  </p>
                </div>
                <StatusBadge
                  tone={
                    data.metrics.openExceptionsCount > 0 ? 'warning' : 'success'
                  }
                >
                  {data.metrics.openExceptionsCount} em aberto
                </StatusBadge>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  marginTop: '16px',
                }}
              >
                {data.exceptions.map((exc) => (
                  <article
                    key={exc.id}
                    className="dashboard-card"
                    style={{ padding: '20px' }}
                  >
                    <div className="card-heading">
                      <div>
                        <span className="order-code">
                          Referência: {exc.referenceId} ·{' '}
                          {formatExceptionType(exc.type)}
                        </span>
                        <h3 style={{ fontSize: '1.05rem', marginTop: '4px' }}>
                          {exc.title}
                        </h3>
                      </div>
                      <StatusBadge
                        tone={exc.status === 'resolved' ? 'success' : 'warning'}
                      >
                        {exc.status === 'resolved' ? 'Resolvida' : 'Em aberto'}
                      </StatusBadge>
                    </div>
                    <p className="muted" style={{ marginTop: '8px' }}>
                      {exc.description}
                    </p>
                    {exc.status === 'resolved' ? (
                      <div className="delivery-info">
                        <div>
                          <span>Providência registrada</span>
                          <strong>
                            <CheckIcon size={14} />{' '}
                            {exc.resolutionNote ?? 'Concluída'}
                          </strong>
                        </div>
                        {exc.resolvedAt && (
                          <div>
                            <span>Concluída em</span>
                            <strong>{formatDateTime(exc.resolvedAt)}</strong>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          gap: '10px',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          marginTop: '14px',
                        }}
                      >
                        <input
                          type="text"
                          value={notes[exc.id] ?? ''}
                          onChange={(e) =>
                            setNotes((prev) => ({
                              ...prev,
                              [exc.id]: e.target.value,
                            }))
                          }
                          placeholder="Descreva a providência adotada (ex.: substituição aprovada, reprocessamento, anonimização concluída)"
                          style={{
                            flex: 1,
                            minWidth: '240px',
                            padding: '10px 12px',
                            border: '1px solid var(--line-strong)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        />
                        <button
                          type="button"
                          disabled={busyId === exc.id}
                          onClick={() => resolveException(exc.id)}
                          className="button button-small button-primary"
                        >
                          <ShieldIcon size={15} />
                          <span>
                            {busyId === exc.id
                              ? 'Registrando…'
                              : 'Marcar como resolvida'}
                          </span>
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>

            <section className="dashboard-card">
              <div className="card-heading">
                <div>
                  <h2>Pedidos do ciclo ({filteredOrders.length})</h2>
                  <p className="muted">
                    Filtre por zona de atendimento ou estágio de entrega.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    aria-label="Filtrar por zona"
                    value={zoneFilter}
                    onChange={(e) => setZoneFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line-strong)',
                      background: 'var(--surface)',
                    }}
                  >
                    <option value="">Todas as zonas</option>
                    {data.zones.map((z) => (
                      <option key={z.id} value={z.name}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Filtrar por estágio operacional"
                    value={stageFilter}
                    onChange={(e) => setStageFilter(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line-strong)',
                      background: 'var(--surface)',
                    }}
                  >
                    <option value="">Todos os estágios</option>
                    <option value="confirmed">Confirmado</option>
                    <option value="preparing">Em preparação</option>
                    <option value="in_transit">A caminho</option>
                    <option value="delivered">Entregue</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  marginTop: '16px',
                }}
              >
                {filteredOrders.map((order) => (
                  <article
                    key={order.id}
                    className="dashboard-card"
                    style={{ padding: '20px' }}
                  >
                    <div className="card-heading">
                      <div>
                        <span className="order-code">
                          Pedido #{order.id} · {order.zoneName}
                        </span>
                        <h3 style={{ marginTop: '4px' }}>
                          {order.items
                            .map((i) => `${i.quantity}× ${i.name}`)
                            .join(', ')}
                        </h3>
                      </div>
                      <StatusBadge
                        tone={
                          order.status === 'Entregue' ? 'success' : 'info'
                        }
                      >
                        {order.status}
                      </StatusBadge>
                    </div>
                    <div className="delivery-info">
                      <div>
                        <span>Endereço de entrega</span>
                        <strong>
                          <MapPinIcon size={14} /> {order.address.street},{' '}
                          {order.address.number} — CEP {order.address.postalCode}
                        </strong>
                      </div>
                      <div>
                        <span>Rota atribuída</span>
                        <strong>
                          <TruckIcon size={14} />{' '}
                          {order.routeName ?? 'Sem rota atribuída'}
                        </strong>
                      </div>
                      <div>
                        <span>Total</span>
                        <strong>{formatPrice(order.totalCents)}</strong>
                      </div>
                      <Link
                        href="/admin/entregas"
                        className="button button-small button-secondary"
                      >
                        Gerenciar entrega
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

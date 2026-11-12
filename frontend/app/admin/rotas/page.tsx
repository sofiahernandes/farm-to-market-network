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
import { MapPinIcon, TruckIcon } from '@/components/icons';
import { api, formatPrice, type AdminDashboardData } from '@/lib/api';

export default function AdminRotasPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeName, setRouteName] = useState('');
  const [zoneId, setZoneId] = useState('zone-centro-sul');
  const [slotId, setSlotId] = useState('seed-slot');
  const [driverName, setDriverName] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<AdminDashboardData>('/admin/dashboard')
      .then((res) => {
        setData(res);
        if (res.zones[0]) setZoneId(res.zones[0].id);
        if (res.slots[0]) setSlotId(res.slots[0].id);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreateRoute(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      const updated = await api<AdminDashboardData>('/admin/routes', {
        method: 'POST',
        body: JSON.stringify({
          name: routeName,
          zoneId,
          slotId,
          driverName,
        }),
      });
      setData(updated);
      setRouteName('');
      setDriverName('');
      setFeedback('Rota manual criada e disponível para alocação de pedidos.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAssignRoute(orderId: string, selectedRouteId: string) {
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      const updated = await api<AdminDashboardData>(
        `/admin/orders/${orderId}/assign-route`,
        {
          method: 'POST',
          body: JSON.stringify({ routeId: selectedRouteId }),
        }
      );
      setData(updated);
      setFeedback(`Alocação de rota do pedido #${orderId} atualizada.`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header app />
      <main className="page-main container">
        <SectionHeading
          eyebrow="Planejamento Logístico por Zona"
          title="Agrupamento manual de rotas e mapa de entregas"
        />

        <AdminSubnav
          active="rotas"
          openExceptionsCount={data?.metrics.openExceptionsCount ?? 0}
        />

        <div
          className="info-alert"
          role="region"
          aria-label="Status do mapa operacional"
        >
          <div style={{ flex: 1 }}>
            <strong>
              Visualização Geográfica em modo Sandbox · Roteirização algorítmica
              fora de escopo no MVP
            </strong>
            <p>
              A chave real do Mapbox não está configurada neste ambiente local.
              Conforme especificação de produto, o agrupamento de pedidos é{' '}
              <strong>manual por zona e janela</strong>, acompanhado de lista
              textual obrigatória de endereços para conferência operacional.
            </p>
          </div>
          <StatusBadge tone="info">Visão Esquemática Ativa</StatusBadge>
        </div>

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
            <p className="muted">Carregando rotas e distribuição espacial…</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="checkout-layout" style={{ marginTop: 0 }}>
              <section className="dashboard-card">
                <div className="card-heading">
                  <div>
                    <h2>Visualização esquemática por zona</h2>
                    <p className="muted">
                      Agrupamento de paradas por faixa de CEP atendida.
                    </p>
                  </div>
                  <MapPinIcon size={18} />
                </div>
                <div
                  style={{
                    marginTop: '14px',
                    padding: '18px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--line-strong)',
                    background: 'var(--surface-warm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {data.zones.map((z) => {
                    const zoneOrders = data.orders.filter(
                      (o) => o.zoneName === z.name
                    );
                    return (
                      <div
                        key={z.id}
                        style={{
                          padding: '12px 14px',
                          background: 'var(--surface)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--line)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '6px',
                          }}
                        >
                          <strong>
                            {z.name} (CEP {z.postalCodePrefix}*)
                          </strong>
                          <StatusBadge tone="info">
                            {zoneOrders.length} parada(s)
                          </StatusBadge>
                        </div>
                        {zoneOrders.length === 0 ? (
                          <span className="muted" style={{ fontSize: '0.88rem' }}>
                            Nenhum pedido posicionado nesta zona no ciclo atual.
                          </span>
                        ) : (
                          <ul
                            style={{
                              margin: 0,
                              paddingLeft: '18px',
                              fontSize: '0.9rem',
                            }}
                          >
                            {zoneOrders.map((o) => (
                              <li key={o.id}>
                                <strong>#{o.id}:</strong> {o.address.street},{' '}
                                {o.address.number} ({o.address.postalCode}) —{' '}
                                <em>{o.routeName ?? 'Sem rota'}</em>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="dashboard-card">
                <div className="card-heading">
                  <div>
                    <h2>Criar nova rota manual</h2>
                    <p className="muted">
                      Defina o motorista e a janela para agrupar entregas.
                    </p>
                  </div>
                  <TruckIcon size={18} />
                </div>
                <form
                  className="checkout-form"
                  style={{ marginTop: '14px' }}
                  onSubmit={handleCreateRoute}
                >
                  <div className="form-group-grid">
                    <label style={{ gridColumn: '1 / -1' }}>
                      Identificação da rota
                      <input
                        required
                        value={routeName}
                        onChange={(e) => setRouteName(e.target.value)}
                        placeholder="Ex.: Rota 02 · Centro-Sul Tarde"
                      />
                    </label>
                    <label>
                      Zona de atendimento
                      <select
                        value={zoneId}
                        onChange={(e) => setZoneId(e.target.value)}
                      >
                        {data.zones.map((z) => (
                          <option key={z.id} value={z.id}>
                            {z.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Janela de entrega
                      <select
                        value={slotId}
                        onChange={(e) => setSlotId(e.target.value)}
                      >
                        {data.slots.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label style={{ gridColumn: '1 / -1' }}>
                      Motorista / Veículo responsável
                      <input
                        required
                        value={driverName}
                        onChange={(e) => setDriverName(e.target.value)}
                        placeholder="Ex.: Juliana Costa · Fiorino Isotérmica"
                      />
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="button button-primary"
                  >
                    Cadastrar rota manual
                  </button>
                </form>
              </section>
            </div>

            <section className="dashboard-card">
              <div className="card-heading">
                <div>
                  <h2>
                    Lista textual obrigatória de paradas e alocação manual por
                    pedido
                  </h2>
                  <p className="muted">
                    Selecione a rota correspondente para cada parada do ciclo.
                  </p>
                </div>
                <StatusBadge tone="success">
                  {data.routes.length} rota(s) ativa(s)
                </StatusBadge>
              </div>
              <div className="status-history-list" style={{ marginTop: '14px' }}>
                {data.orders.map((order) => (
                  <div
                    key={order.id}
                    className="order-row"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong>
                        Pedido #{order.id} · {formatPrice(order.totalCents)} (
                        {order.status})
                      </strong>
                      <span
                        className="muted"
                        style={{ display: 'block', fontSize: '0.95rem', marginTop: '2px' }}
                      >
                        <MapPinIcon size={13} /> {order.zoneName} —{' '}
                        {order.address.street}, {order.address.number}{' '}
                        {order.address.complement
                          ? `(${order.address.complement})`
                          : ''}{' '}
                        · CEP {order.address.postalCode}
                      </span>
                    </div>
                    <select
                      aria-label={`Atribuir rota ao pedido ${order.id}`}
                      disabled={busy}
                      value={order.routeId ?? ''}
                      onChange={(e) =>
                        handleAssignRoute(order.id, e.target.value)
                      }
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--line-strong)',
                        background: 'var(--surface)',
                      }}
                    >
                      <option value="">Sem rota atribuída</option>
                      {data.routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.driverName})
                        </option>
                      ))}
                    </select>
                  </div>
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

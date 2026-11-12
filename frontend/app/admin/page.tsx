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
import {
  ArrowRightIcon,
  CheckIcon,
  MapPinIcon,
  ShieldCheckIcon,
  TruckIcon,
} from '@/components/icons';
import {
  api,
  formatAuditAction,
  formatAuditResource,
  formatDateTime,
  formatExceptionType,
  formatPrice,
  type AdminDashboardData,
} from '@/lib/api';

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<AdminDashboardData>('/admin/dashboard')
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const openExceptions =
    data?.exceptions.filter((e) => e.status === 'open') ?? [];

  return (
    <>
      <Header app />
      <main className="page-main container">
        <SectionHeading
          eyebrow="Central de Operações e Logística"
          title="Coordenação de zonas, janelas, rotas e entregas"
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Link
              href="/admin/romaneio"
              className="button button-small button-secondary"
            >
              <span>Romaneio diário (CSV)</span>
            </Link>
            <Link
              href="/admin/entregas"
              className="button button-small button-primary"
            >
              <span>Atualizar entregas</span>
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        </SectionHeading>

        <AdminSubnav
          active="visao-geral"
          openExceptionsCount={data?.metrics.openExceptionsCount ?? 0}
        />

        {error && (
          <div className="zone-alert" style={{ marginBottom: '20px' }}>
            <p className="danger-text" style={{ margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        {loading || !data ? (
          <div className="dashboard-card">
            <p className="muted">Carregando painel operacional…</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div
              className="metric-grid"
              style={{
                gridTemplateColumns: 'repeat(3, 1fr)',
                marginBottom: 0,
              }}
            >
              <div className="metric-card">
                <span className="metric-label">Pedidos do ciclo</span>
                <strong>{data.metrics.totalOrdersCount}</strong>
                <small>
                  {data.metrics.inTransitCount} em rota ·{' '}
                  {data.metrics.deliveredCount} entregue(s)
                </small>
              </div>

              <div className="metric-card">
                <span className="metric-label">Ocupação de janelas</span>
                <strong>
                  {data.metrics.occupiedSlotsCount} /{' '}
                  {data.metrics.totalSlotCapacity}
                </strong>
                <small>
                  {data.metrics.activeZonesCount} zona(s) ativa(s) no piloto
                </small>
              </div>

              <div className="metric-card">
                <span className="metric-label">Exceções abertas</span>
                <strong>{data.metrics.openExceptionsCount}</strong>
                <small>
                  {data.metrics.openExceptionsCount > 0
                    ? 'Atenção requerida em pedidos ou ciclos'
                    : 'Zero bloqueios operacionais'}
                </small>
              </div>
            </div>

            <div className="checkout-layout" style={{ marginTop: 0 }}>
              <section className="dashboard-card">
                <div className="card-heading">
                  <div>
                    <h2>Fila de exceções operacionais</h2>
                    <p className="muted">
                      Incidentes de estoque, cobrança recorrente ou direitos LGPD.
                    </p>
                  </div>
                  <Link className="text-link" href="/admin/pedidos">
                    Tratar exceções →
                  </Link>
                </div>
                {openExceptions.length === 0 ? (
                  <p className="muted" style={{ marginTop: '14px' }}>
                    Nenhuma exceção aberta neste ciclo.
                  </p>
                ) : (
                  <div className="status-history-list" style={{ marginTop: '14px' }}>
                    {openExceptions.map((exc) => (
                      <div
                        key={exc.id}
                        className="order-row"
                        style={{
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <strong>{exc.title}</strong>
                          <span
                            className="muted"
                            style={{ display: 'block', fontSize: '13px', marginTop: '2px' }}
                          >
                            {formatExceptionType(exc.type)} · {exc.description}
                          </span>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            flexShrink: 0,
                          }}
                        >
                          <StatusBadge
                            tone={exc.severity === 'high' ? 'warning' : 'info'}
                          >
                            Ref: {exc.referenceId}
                          </StatusBadge>
                          <Link className="text-link" href="/admin/pedidos">
                            Resolver
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="dashboard-card">
                <div className="card-heading">
                  <div>
                    <h2>Capacidade por janela</h2>
                    <p className="muted">Vagas ocupadas no ciclo atual.</p>
                  </div>
                  <Link className="text-link" href="/admin/zonas-slots">
                    Gerenciar →
                  </Link>
                </div>
                <div className="status-history-list" style={{ marginTop: '14px' }}>
                  {data.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="order-row"
                      style={{
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong>{slot.label}</strong>
                        <span
                          className="muted"
                          style={{ display: 'block', fontSize: '13px', marginTop: '2px' }}
                        >
                          <MapPinIcon size={13} /> {slot.zoneName}
                        </span>
                      </div>
                      <StatusBadge
                        tone={
                          !slot.active
                            ? 'warning'
                            : slot.occupied >= slot.capacity
                              ? 'warning'
                              : 'success'
                        }
                      >
                        {slot.occupied}/{slot.capacity} vagas
                      </StatusBadge>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <section className="dashboard-card">
              <div className="card-heading">
                <div>
                  <h2>Pedidos recentes e alocação de rotas</h2>
                  <p className="muted">
                    Acompanhe a distribuição de pedidos por zona de atendimento e rota manual.
                  </p>
                </div>
                <Link className="text-link" href="/admin/rotas">
                  Agrupamento manual de rotas →
                </Link>
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
                        Pedido #{order.id} · {order.zoneName}
                      </strong>
                      <span
                        className="muted"
                        style={{ display: 'block', fontSize: '13px', marginTop: '2px' }}
                      >
                        <TruckIcon size={13} />{' '}
                        {order.routeName ?? 'Aguardando atribuição de rota'} ·{' '}
                        {order.address.street}, {order.address.number}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        flexShrink: 0,
                      }}
                    >
                      <StatusBadge
                        tone={
                          order.status === 'Entregue' ? 'success' : 'info'
                        }
                      >
                        {order.status}
                      </StatusBadge>
                      <strong>{formatPrice(order.totalCents)}</strong>
                      <Link className="text-link" href="/admin/entregas">
                        Atualizar status
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-card">
              <div className="card-heading">
                <div>
                  <h2>Histórico de auditoria (Produtor e Operações)</h2>
                  <p className="muted">
                    Registro cronológico e imutável de aprovações, estoque, separação de lotes e rotas.
                  </p>
                </div>
                <StatusBadge tone="info">
                  <CheckIcon size={13} /> Registro imutável
                </StatusBadge>
              </div>
              <div className="status-history-list" style={{ marginTop: '14px' }}>
                {data.auditLogs.slice(0, 6).map((entry) => (
                  <div
                    key={entry.id}
                    className="order-row"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <ShieldCheckIcon size={18} />
                      <div>
                        <strong>{entry.summary}</strong>
                        <span
                          className="muted"
                          style={{ display: 'block', fontSize: '12px', marginTop: '2px' }}
                        >
                          {formatAuditResource(entry.resourceType)} ·{' '}
                          {formatDateTime(entry.createdAt)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge tone="info">
                      {formatAuditAction(entry.action)}
                    </StatusBadge>
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

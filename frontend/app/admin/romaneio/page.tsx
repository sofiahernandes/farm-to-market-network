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
import { CheckIcon, PackageIcon, TruckIcon } from '@/components/icons';
import { api, formatPrice, type AdminDashboardData } from '@/lib/api';

const PAGE_SIZE = 10;

export default function AdminRomaneioPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeFilter, setRouteFilter] = useState('');
  const [page, setPage] = useState(1);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<AdminDashboardData>('/admin/dashboard')
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const manifestList =
    data?.manifest.filter(
      (entry) => !routeFilter || entry.routeName === routeFilter
    ) ?? [];

  const totalPages = Math.max(1, Math.ceil(manifestList.length / PAGE_SIZE));
  const paginated = manifestList.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  function exportCsv() {
    if (!manifestList.length) return;
    const headers = [
      'Pedido',
      'Status',
      'Zona',
      'Rota',
      'Janela',
      'SeparadoProdutor',
      'Produtores',
      'Itens',
      'Endereco',
      'CEP',
      'TotalBRL',
    ];
    const rows = manifestList.map((m) => [
      m.orderId,
      m.status,
      m.zoneName,
      m.routeName,
      m.slotLabel,
      m.producerSeparated ? 'SIM' : 'PENDENTE',
      m.producersSummary,
      m.itemsSummary,
      m.addressLine,
      m.postalCode,
      (m.totalCents / 100).toFixed(2),
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `romaneio-agritech-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback(
      `Romaneio exportado em CSV com ${manifestList.length} registro(s).`
    );
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
          <span>Romaneio diário</span>
        </div>

        <SectionHeading
          eyebrow="Conferência de Coleta e Expedição"
          title="Romaneio operacional diário (paginado e exportável em CSV)"
        >
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={exportCsv}
              className="button button-small button-primary"
            >
              <PackageIcon size={15} />
              <span>Exportar CSV</span>
            </button>
          </div>
        </SectionHeading>

        <AdminSubnav
          active="romaneio"
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
            <p className="muted">Gerando romaneio consolidado…</p>
          </div>
        ) : (
          <section className="dashboard-card">
            <div className="card-heading">
              <div>
                <h2>
                  Lista de expedição ({manifestList.length} pedido(s) · Página{' '}
                  {page} de {totalPages})
                </h2>
                <p className="muted">
                  Conferência consolidada de coleta no produtor, itens e destino final.
                </p>
              </div>
              <select
                aria-label="Filtrar romaneio por rota"
                value={routeFilter}
                onChange={(e) => {
                  setRouteFilter(e.target.value);
                  setPage(1);
                }}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line-strong)',
                  background: 'var(--surface)',
                }}
              >
                <option value="">Todas as rotas</option>
                {data.routes.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
                <option value="Sem rota atribuída">Sem rota atribuída</option>
              </select>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                marginTop: '16px',
              }}
            >
              {paginated.map((entry) => (
                <article
                  key={entry.orderId}
                  className="dashboard-card"
                  style={{ padding: '20px' }}
                >
                  <div className="card-heading">
                    <div>
                      <span className="order-code">
                        {entry.zoneName} · {entry.slotLabel}
                      </span>
                      <h3 style={{ marginTop: '4px' }}>
                        Pedido #{entry.orderId} — {entry.routeName}
                      </h3>
                    </div>
                    <div
                      style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}
                    >
                      <StatusBadge
                        tone={entry.producerSeparated ? 'success' : 'warning'}
                      >
                        {entry.producerSeparated ? (
                          <>
                            <CheckIcon size={13} /> Colhido e separado
                          </>
                        ) : (
                          'Aguardando separação no produtor'
                        )}
                      </StatusBadge>
                      <StatusBadge tone="info">{entry.status}</StatusBadge>
                    </div>
                  </div>

                  <div className="delivery-info">
                    <div>
                      <span>Itens do lote</span>
                      <strong>{entry.itemsSummary}</strong>
                    </div>
                    <div>
                      <span>Produtor de origem</span>
                      <strong>{entry.producersSummary}</strong>
                    </div>
                    <div>
                      <span>Endereço de entrega</span>
                      <strong>
                        <TruckIcon size={13} /> {entry.addressLine} (CEP{' '}
                        {entry.postalCode})
                      </strong>
                    </div>
                    <div>
                      <span>Total</span>
                      <strong>{formatPrice(entry.totalCents)}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '16px',
                }}
              >
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="button button-small button-secondary"
                >
                  Página anterior
                </button>
                <span className="muted">
                  Página {page} de {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="button button-small button-secondary"
                >
                  Próxima página
                </button>
              </div>
            )}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

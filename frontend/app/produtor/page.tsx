'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Footer,
  Header,
  ProducerSubnav,
  StatusBadge,
} from '@/components/ui';
import {
  ArrowRightIcon,
  CalendarIcon,
  PackageIcon,
  ShieldCheckIcon,
  SproutIcon,
  TruckIcon,
} from '@/components/icons';
import {
  api,
  formatAuditAction,
  formatAuditResource,
  formatDateTime,
  formatPrice,
  type ProducerDashboardData,
} from '@/lib/api';

export default function ProdutorDashboardPage() {
  const [data, setData] = useState<ProducerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<ProducerDashboardData>('/producer/dashboard')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const canPublish =
    data?.producer.onboardingStatus === 'approved' &&
    Boolean(data?.producer.paymentAccountConnected);

  return (
    <>
      <Header app />
      <main className="page-main container">
        <div className="breadcrumb">
          <Link href="/">Início</Link>
          <span>/</span>Painel do produtor
        </div>

        <ProducerSubnav
          active="painel"
          pendingTasksCount={data?.producer.pendingTasksCount ?? 0}
          onboardingApproved={data?.producer.onboardingStatus === 'approved'}
          paymentConnected={data?.producer.paymentAccountConnected ?? true}
        />

        {loading && (
          <p className="loading-indicator">Carregando painel do produtor…</p>
        )}
        {error && (
          <div className="info-alert" role="alert">
            <strong>Não foi possível carregar o painel.</strong>
            <p>{error}</p>
          </div>
        )}

        {data && (
          <>
            <div className="dashboard-intro">
              <div>
                <span className="product-category-tag">
                  {data.producer.city}/{data.producer.state} · {data.producer.legalIdMasked}
                </span>
                <h1 style={{ marginTop: '4px' }}>{data.producer.displayName}</h1>
                <p className="lead">{data.producer.story}</p>
              </div>
              <div className="hero-actions">
                {canPublish ? (
                  <Link
                    href="/produtor/catalogo/novo"
                    className="button button-primary"
                  >
                    <span>Nova oferta da colheita</span>
                    <ArrowRightIcon size={15} />
                  </Link>
                ) : (
                  <Link
                    href="/produtor/onboarding"
                    className="button button-primary"
                  >
                    <span>Concluir pré-requisitos</span>
                    <ArrowRightIcon size={15} />
                  </Link>
                )}
                <Link
                  href="/produtor/estoque"
                  className="button button-secondary"
                >
                  Atualizar estoque semanal
                </Link>
              </div>
            </div>

            <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div className="metric-card">
                <span className="metric-label">Ofertas publicadas</span>
                <strong>{data.metrics.activeOffersCount}</strong>
                <small>
                  {data.metrics.pausedOffersCount} pausada(s) ou em rascunho
                </small>
              </div>
              <div className="metric-card">
                <span className="metric-label">Alertas de estoque</span>
                <strong>{data.metrics.lowStockCount}</strong>
                <small>Lotes abaixo do mínimo configurado</small>
              </div>
              <div className="metric-card">
                <span className="metric-label">Fila de colheita</span>
                <strong>{data.metrics.pendingFulfillmentCount}</strong>
                <small>Pedidos aguardando separação</small>
              </div>
              <div className="metric-card">
                <span className="metric-label">Repasse líquido previsto</span>
                <strong>{formatPrice(data.metrics.netPayoutCents)}</strong>
                <small>
                  Bruto: {formatPrice(data.metrics.grossSalesCents)} (taxa{' '}
                  {data.producer.platformFeePercent}%)
                </small>
              </div>
            </div>

            {data.producer.pendingReasons.length > 0 && (
              <section
                className="dashboard-card"
                style={{ marginBottom: '24px' }}
              >
                <div className="card-heading">
                  <div>
                    <h2>Pendências acionáveis do lote</h2>
                    <p className="muted">
                      Itens que exigem atenção antes do fechamento da janela semanal.
                    </p>
                  </div>
                  <StatusBadge tone="warning">
                    {data.producer.pendingTasksCount} pendência(s)
                  </StatusBadge>
                </div>
                <div className="status-history-list" style={{ marginTop: '12px' }}>
                  {data.producer.pendingReasons.map((reason, idx) => (
                    <div className="order-row" key={idx}>
                      <span className="status-timeline-dot" />
                      <strong>{reason}</strong>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <div className="checkout-layout" style={{ marginTop: 0 }}>
              <section className="dashboard-card">
                <div className="card-heading">
                  <div>
                    <h2>Volumes consolidados para colheita</h2>
                    <p className="muted">
                      Soma dos itens confirmados em pedidos ativos para separação na propriedade.
                    </p>
                  </div>
                  <Link href="/produtor/pedidos" className="text-link">
                    Ver fila completa →
                  </Link>
                </div>

                {data.harvestSummary.length === 0 ? (
                  <p className="muted" style={{ marginTop: '16px' }}>
                    Nenhum volume pendente de colheita neste momento.
                  </p>
                ) : (
                  <div className="status-history-list" style={{ marginTop: '14px' }}>
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
                              Presente em {h.ordersCount} pedido(s) confirmado(s)
                            </span>
                          </div>
                        </div>
                        <StatusBadge tone="info">
                          Colher: {h.totalQuantity} {h.unit}
                        </StatusBadge>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <aside className="dashboard-card summary-card">
                <h2>Status da propriedade</h2>
                <div className="summary-row">
                  <span>Onboarding operacional</span>
                  <StatusBadge
                    tone={
                      data.producer.onboardingStatus === 'approved'
                        ? 'success'
                        : 'warning'
                    }
                  >
                    {data.producer.onboardingStatus === 'approved'
                      ? 'Aprovado'
                      : data.producer.onboardingStatus === 'pending_review'
                        ? 'Em análise'
                        : 'Com pendência'}
                  </StatusBadge>
                </div>
                <div className="summary-row">
                  <span>Conta Mercado Pago</span>
                  <StatusBadge
                    tone={
                      data.producer.paymentAccountConnected
                        ? 'success'
                        : 'warning'
                    }
                  >
                    {data.producer.paymentAccountConnected
                      ? 'Conectada (Sandbox)'
                      : 'Desconectada'}
                  </StatusBadge>
                </div>
                <div className="summary-row">
                  <span>Split 1:1 em produção</span>
                  <StatusBadge tone="info">Feature Flag Off</StatusBadge>
                </div>
                <hr />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <Link
                    href="/produtor/catalogo"
                    className="button button-secondary button-full"
                  >
                    <PackageIcon size={15} />
                    <span>Gerenciar ofertas e cestas</span>
                  </Link>
                  <Link
                    href="/produtor/pedidos"
                    className="button button-secondary button-full"
                  >
                    <TruckIcon size={15} />
                    <span>Fila de separação e etiquetas</span>
                  </Link>
                  <Link
                    href="/produtor/financeiro"
                    className="button button-secondary button-full"
                  >
                    <CalendarIcon size={15} />
                    <span>Extrato de vendas e repasses</span>
                  </Link>
                </div>
              </aside>
            </div>

            <section className="dashboard-card" style={{ marginTop: '24px' }}>
              <div className="card-heading">
                <div>
                  <h2>Últimas alterações auditadas</h2>
                  <p className="muted">
                    Toda mudança de preço, estoque, oferta ou status gera registro imutável.
                  </p>
                </div>
                <Link href="/produtor/conta" className="text-link">
                  Ver trilha completa →
                </Link>
              </div>
              <div className="status-history-list" style={{ marginTop: '12px' }}>
                {data.auditLogs.slice(0, 4).map((log) => (
                  <div
                    className="order-row"
                    key={log.id}
                    style={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <ShieldCheckIcon size={18} />
                      <div>
                        <strong>{log.summary}</strong>
                        <span className="muted" style={{ display: 'block', fontSize: '12px', marginTop: '2px' }}>
                          {formatAuditResource(log.resourceType)} · {formatDateTime(log.createdAt)}
                        </span>
                      </div>
                    </div>
                    <StatusBadge tone="info">
                      {formatAuditAction(log.action)}
                    </StatusBadge>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

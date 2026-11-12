'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Footer,
  Header,
  ProducerSubnav,
  StatusBadge,
} from '@/components/ui';
import { ShieldCheckIcon } from '@/components/icons';
import {
  api,
  formatDate,
  formatPrice,
  type ProducerDashboardData,
} from '@/lib/api';

export default function ProdutorFinanceiroPage() {
  const [data, setData] = useState<ProducerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<ProducerDashboardData>('/producer/dashboard')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  const totalFeesCents =
    data?.payouts.reduce((sum, p) => sum + p.feeCents, 0) ?? 0;

  return (
    <>
      <Header app />
      <main className="page-main container">
        <ProducerSubnav
          active="financeiro"
          onboardingApproved={data?.producer.onboardingStatus === 'approved'}
          paymentConnected={data?.producer.paymentAccountConnected ?? true}
        />

        <h1>Extrato de vendas, taxa da plataforma e repasses</h1>
        <p className="lead">
          Transparência completa sobre valor bruto, taxa operacional da plataforma e valor líquido devido ao produtor por pedido.
        </p>

        <div className="zone-alert" style={{ marginTop: '18px' }}>
          <div className="zone-alert-icon">
            <ShieldCheckIcon size={20} />
          </div>
          <div>
            <strong>
              Split 1:1 Mercado Pago desativado por Feature Flag (Ambiente Sandbox)
            </strong>
            <p>
              O split automático em produção só é habilitado após aprovação comercial e conexão definitiva da conta. Abaixo você acompanha o cálculo demonstrativo exato de cada venda.
            </p>
          </div>
        </div>

        {loading && <p className="loading-indicator">Carregando extrato financeiro…</p>}
        {error && (
          <div className="info-alert" role="alert">
            <strong>Erro ao carregar extrato.</strong>
            <p>{error}</p>
          </div>
        )}

        {data && (
          <>
            <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="metric-card">
                <span className="metric-label">Volume bruto de vendas</span>
                <strong>{formatPrice(data.metrics.grossSalesCents)}</strong>
                <small>{data.payouts.length} pedidos contabilizados</small>
              </div>
              <div className="metric-card">
                <span className="metric-label">
                  Taxa da plataforma ({data.producer.platformFeePercent}%)
                </span>
                <strong>{formatPrice(totalFeesCents)}</strong>
                <small>Custeio logístico e operacional do piloto</small>
              </div>
              <div className="metric-card">
                <span className="metric-label">Valor líquido do produtor</span>
                <strong>{formatPrice(data.metrics.netPayoutCents)}</strong>
                <small>90% do valor bruto de cada pedido</small>
              </div>
            </div>

            <section className="dashboard-card">
              <h2>Detalhamento por pedido</h2>
              <div className="status-history-list" style={{ marginTop: '14px' }}>
                {data.payouts.map((p) => (
                  <div
                    className="order-row"
                    key={p.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr',
                      gap: '14px',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong>Pedido #{p.orderId}</strong>
                      <span style={{ display: 'block', fontSize: '0.95rem' }}>
                        {p.itemsSummary} · Previsão: {formatDate(p.scheduledAt)}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.95rem', display: 'block' }}>Bruto</span>
                      <strong>{formatPrice(p.grossCents)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.95rem', display: 'block' }}>
                        Taxa ({p.feePercent}%)
                      </span>
                      <strong>− {formatPrice(p.feeCents)}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.95rem', display: 'block' }}>
                        Líquido produtor
                      </span>
                      <strong style={{ color: 'var(--forest)' }}>
                        {formatPrice(p.netCents)}
                      </strong>
                    </div>
                    <div>
                      <StatusBadge
                        tone={
                          p.status === 'paid'
                            ? 'success'
                            : p.status === 'scheduled'
                              ? 'info'
                              : 'warning'
                        }
                      >
                        {p.status === 'paid'
                          ? 'Repasse liquidado (Sandbox)'
                          : p.status === 'scheduled'
                            ? 'Agendado pós-entrega'
                            : 'Aguardando conta conectada'}
                      </StatusBadge>
                    </div>
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

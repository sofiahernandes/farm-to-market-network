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
  formatDateTime,
  type ProducerDashboardData,
} from '@/lib/api';

export default function ProdutorContaPage() {
  const [data, setData] = useState<ProducerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<ProducerDashboardData>('/producer/dashboard')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header app />
      <main className="page-main container">
        <div className="breadcrumb">
          <Link href="/produtor">Painel do produtor</Link>
          <span>/</span>Propriedade e trilha de auditoria
        </div>

        <ProducerSubnav
          active="conta"
          pendingTasksCount={data?.producer.pendingTasksCount ?? 0}
          onboardingApproved={data?.producer.onboardingStatus === 'approved'}
          paymentConnected={data?.producer.paymentAccountConnected ?? true}
        />

        <h1>Dados da propriedade e trilha de auditoria</h1>
        <p className="lead">
          Consulte os dados cadastrais protegidos da propriedade e o registro imutável de todas as ações de preço, estoque e ofertas.
        </p>

        {loading && <p className="loading-indicator">Carregando dados…</p>}
        {error && (
          <div className="info-alert" role="alert">
            <strong>Erro ao carregar dados.</strong>
            <p>{error}</p>
          </div>
        )}

        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '20px' }}>
            <section className="dashboard-card">
              <div className="card-heading">
                <div>
                  <h2>{data.producer.displayName}</h2>
                  <p className="muted">{data.producer.story}</p>
                </div>
                <StatusBadge tone="success">Produtor Parceiro</StatusBadge>
              </div>
              <div className="delivery-info">
                <div>
                  <span>Localização</span>
                  <strong>
                    {data.producer.city}/{data.producer.state}
                  </strong>
                </div>
                <div>
                  <span>Identificação protegida</span>
                  <strong>{data.producer.legalIdMasked}</strong>
                </div>
                <div>
                  <span>Certificações ativas</span>
                  <strong>{data.producer.certifications.length} válidas</strong>
                </div>
              </div>
            </section>

            <section className="dashboard-card">
              <h2>Trilha de auditoria imutável ({data.auditLogs.length} registros)</h2>
              <p className="muted" style={{ marginBottom: '14px' }}>
                Registro cronológico append-only das alterações realizadas pelo produtor e pela operação.
              </p>
              <div className="status-history-list">
                {data.auditLogs.map((log) => (
                  <div className="order-row" key={log.id}>
                    <ShieldCheckIcon size={16} />
                    <div>
                      <strong>{log.summary}</strong>
                      <span style={{ display: 'block', fontSize: '12px' }}>
                        Evento: <code>{log.action}</code> · Entidade:{' '}
                        <code>
                          {log.resourceType}/{log.resourceId}
                        </code>{' '}
                        · {formatDateTime(log.createdAt)}
                      </span>
                    </div>
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

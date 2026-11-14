'use client';

import { useEffect, useState } from 'react';
import {
  Header,
  ProducerSubnav,
  StatusBadge,
} from '@/components/ui';
import { ShieldCheckIcon } from '@/components/icons';
import {
  api,
  formatAuditAction,
  formatAuditResource,
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
        <ProducerSubnav
          active="conta"
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
          <div className="stack-lg">
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

            <section className="dashboard-card stack-md">
              <div className="card-heading">
                <div>
                  <h2>Histórico de auditoria ({data.auditLogs.length} registros)</h2>
                  <p className="muted">
                    Registro cronológico e imutável das alterações realizadas pelo produtor e pela operação.
                  </p>
                </div>
                <StatusBadge tone="info">Registro imutável</StatusBadge>
              </div>
              <div className="status-history-list">
                {data.auditLogs.map((log) => (
                  <div className="order-row" key={log.id}>
                    <div className="cluster-sm">
                      <ShieldCheckIcon size={18} />
                      <div className="stack-xs">
                        <strong>{log.summary}</strong>
                        <span className="count-tag">
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
          </div>
        )}
      </main>
    </>
  );
}

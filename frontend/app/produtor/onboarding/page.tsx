'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Footer,
  Header,
  ProducerSubnav,
  StatusBadge,
} from '@/components/ui';
import { CheckIcon, ShieldCheckIcon } from '@/components/icons';
import {
  api,
  type ProducerDashboardData,
} from '@/lib/api';

export default function ProdutorOnboardingPage() {
  const [data, setData] = useState<ProducerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    displayName: '',
    city: '',
    state: '',
    story: '',
    onboardingStatus: 'approved' as
      | 'approved'
      | 'pending_review'
      | 'changes_requested',
    paymentAccountConnected: true,
  });

  useEffect(() => {
    api<ProducerDashboardData>('/producer/dashboard')
      .then((res) => {
        setData(res);
        setForm({
          displayName: res.producer.displayName,
          city: res.producer.city,
          state: res.producer.state,
          story: res.producer.story,
          onboardingStatus: res.producer.onboardingStatus,
          paymentAccountConnected: res.producer.paymentAccountConnected,
        });
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const updated = await api<ProducerDashboardData>(
        '/producer/onboarding',
        {
          method: 'PATCH',
          body: JSON.stringify(form),
        }
      );
      setData(updated);
      setMessage('Dados de onboarding e pré-requisitos atualizados e auditados.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Header app />
      <main className="page-main container">
        <div className="breadcrumb">
          <Link href="/produtor">Painel do produtor</Link>
          <span>/</span>Onboarding e aprovação
        </div>

        <ProducerSubnav
          active="onboarding"
          pendingTasksCount={data?.producer.pendingTasksCount ?? 0}
          onboardingApproved={data?.producer.onboardingStatus === 'approved'}
          paymentConnected={data?.producer.paymentAccountConnected ?? true}
        />

        <h1>Onboarding, certificações e conta de repasse</h1>
        <p className="lead">
          Para publicar ofertas no catálogo, a propriedade precisa estar aprovada pela operação e com conta de recebimento conectada.
        </p>

        {message && (
          <p className="status status-success status-message" role="status" style={{ marginBottom: '20px' }}>
            <span>{message}</span>
          </p>
        )}
        {error && (
          <div className="info-alert" role="alert">
            <strong>Erro ao salvar dados.</strong>
            <p>{error}</p>
          </div>
        )}
        {loading && <p className="loading-indicator">Carregando dados da propriedade…</p>}

        {data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '20px' }}>
            <section className="dashboard-card">
              <div className="card-heading">
                <div>
                  <h2>Dados da propriedade e simulação de aprovação</h2>
                  <p className="muted">
                    Use os seletores abaixo para testar também os estados &ldquo;Em análise&rdquo;, &ldquo;Com pendência&rdquo; ou sem conta de pagamento conectada.
                  </p>
                </div>
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
                      : 'Pendência'}
                </StatusBadge>
              </div>

              <form className="checkout-form" onSubmit={save} style={{ marginTop: '16px' }}>
                <label>
                  Nome da propriedade / produtor
                  <input
                    required
                    value={form.displayName}
                    onChange={(e) =>
                      setForm({ ...form, displayName: e.target.value })
                    }
                  />
                </label>

                <div className="form-group-grid">
                  <label>
                    Município de origem
                    <input
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                    />
                  </label>
                  <label>
                    Estado (UF)
                    <input
                      required
                      value={form.state}
                      onChange={(e) =>
                        setForm({ ...form, state: e.target.value })
                      }
                    />
                  </label>
                </div>

                <label>
                  Apresentação e práticas de cultivo
                  <input
                    required
                    value={form.story}
                    onChange={(e) => setForm({ ...form, story: e.target.value })}
                  />
                </label>

                <div className="form-group-grid">
                  <label>
                    Status de aprovação operacional (Sandbox)
                    <select
                      value={form.onboardingStatus}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          onboardingStatus: e.target
                            .value as typeof form.onboardingStatus,
                        })
                      }
                    >
                      <option value="approved">Aprovado (permite publicar ofertas)</option>
                      <option value="pending_review">Em análise (bloqueia publicação)</option>
                      <option value="changes_requested">Pendência documental (bloqueia publicação)</option>
                    </select>
                  </label>
                  <label>
                    Conta Mercado Pago (Sandbox)
                    <select
                      value={form.paymentAccountConnected ? 'true' : 'false'}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          paymentAccountConnected: e.target.value === 'true',
                        })
                      }
                    >
                      <option value="true">Conectada para repasse</option>
                      <option value="false">Não conectada (bloqueia publicação)</option>
                    </select>
                  </label>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={saving}
                    className="button button-primary"
                  >
                    <CheckIcon size={15} />
                    <span>
                      {saving
                        ? 'Salvando alterações…'
                        : 'Salvar dados de onboarding'}
                    </span>
                  </button>
                </div>
              </form>
            </section>

            <section className="dashboard-card">
              <h2>Certificações e documentos sanitários</h2>
              <p className="muted" style={{ marginBottom: '14px' }}>
                Certificações ativas apresentadas aos consumidores nas páginas de produto e cesta.
              </p>
              <div className="status-history-list">
                {data.producer.certifications.map((cert) => (
                  <div
                    className="order-row"
                    key={cert.id}
                    style={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ShieldCheckIcon size={18} />
                      <div>
                        <strong>{cert.name}</strong>
                        <span style={{ display: 'block', fontSize: '13px' }}>
                          Emissor: {cert.issuer} · Validade: {cert.validUntil}
                        </span>
                      </div>
                    </div>
                    <StatusBadge tone="success">Válida</StatusBadge>
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

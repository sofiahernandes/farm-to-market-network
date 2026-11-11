'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header, StatusBadge } from '@/components/ui';
import {
  CheckIcon,
  PinIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@/components/icons';
import {
  api,
  formatDateTime,
  requireAuth,
  type AccountProfile,
  type LgpdDeletionRequest,
  type SavedAddress,
} from '@/lib/api';

export default function ContaPage() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [addrForm, setAddrForm] = useState({
    label: 'Trabalho',
    postalCode: '04538-132',
    street: 'Avenida Brigadeiro Faria Lima',
    number: '3477',
    complement: '10º andar',
    city: 'São Paulo',
    state: 'SP',
  });
  const [lgpdReason, setLgpdReason] = useState('');

  useEffect(() => {
    if (!requireAuth()) return;
    api<AccountProfile>('/account/profile')
      .then(setProfile)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await api<{ data: SavedAddress[] }>('/account/addresses', {
        method: 'POST',
        body: JSON.stringify(addrForm),
      });
      if (profile) setProfile({ ...profile, addresses: res.data });
      setMessage('Endereço cadastrado e associado à zona de atendimento.');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function removeAddress(id: string) {
    setError('');
    setMessage('');
    try {
      const res = await api<{ data: SavedAddress[] }>(
        `/account/addresses/${id}`,
        { method: 'DELETE' }
      );
      if (profile) setProfile({ ...profile, addresses: res.data });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function requestLgpdDeletion(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const created = await api<LgpdDeletionRequest>(
        '/account/lgpd-deletion-request',
        {
          method: 'POST',
          body: JSON.stringify({ reason: lgpdReason }),
        }
      );
      if (profile) {
        setProfile({
          ...profile,
          lgpdRequests: [created, ...profile.lgpdRequests],
        });
      }
      setMessage(
        `Solicitação LGPD registrada com protocolo ${created.protocol}.`
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <Header app />
      <main className="page-main container">
        <div className="breadcrumb">
          <Link href="/app">Área do consumidor</Link>
          <span>/</span>Minha conta e privacidade
        </div>

        <h1>Minha conta e endereços</h1>
        <p className="lead">
          Gerencie seus endereços por zona de atendimento, transparência de pagamentos e direitos de titular de dados.
        </p>

        {message && (
          <p className="status status-success status-message" role="status" style={{ marginBottom: '20px' }}>
            <span>{message}</span>
          </p>
        )}

        {error && (
          <div className="info-alert" role="alert">
            <strong>Não foi possível concluir a operação.</strong>
            <p>{error}</p>
          </div>
        )}

        {loading && <p className="loading-indicator">Carregando dados da conta…</p>}

        {profile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '20px' }}>
            <section className="dashboard-card">
              <div className="card-heading">
                <div>
                  <h2>Identificação e proteção de dados</h2>
                  <p className="muted">
                    Por privacidade padrão, seu CPF nunca é exibido por completo após o cadastro e é armazenado como hash.
                  </p>
                </div>
                <StatusBadge tone="success">Papel: {profile.user.role}</StatusBadge>
              </div>
              <div className="delivery-info">
                <div>
                  <span>Email da conta</span>
                  <strong>{profile.user.email}</strong>
                </div>
                <div>
                  <span>CPF mascarado</span>
                  <strong>{profile.maskedCpf}</strong>
                </div>
                <div>
                  <span>Armazenamento de cartão</span>
                  <strong>Desativado (0 cartões salvos)</strong>
                </div>
              </div>
            </section>

            <section className="dashboard-card">
              <div className="card-heading">
                <div>
                  <h2>Meio de pagamento e transparência sandbox</h2>
                  <p className="muted">{profile.paymentGatewayStatus.description}</p>
                </div>
                <StatusBadge tone="info">Modo Sandbox</StatusBadge>
              </div>
              <div className="sandbox-notice" style={{ marginTop: '12px' }}>
                <ShieldCheckIcon size={16} />
                <span>
                  Provedor: <strong>{profile.paymentGatewayStatus.provider}</strong>
                </span>
              </div>
            </section>

            <section className="dashboard-card">
              <h2>Endereços salvos e zona de entrega</h2>
              <p className="muted" style={{ marginBottom: '16px' }}>
                Cada CEP é associado a uma zona de serviço para validar disponibilidade e janelas de entrega.
              </p>

              <div className="status-history-list" style={{ marginBottom: '20px' }}>
                {profile.addresses.map((addr) => (
                  <div
                    className="order-row"
                    key={addr.id}
                    style={{ justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                      <PinIcon size={18} />
                      <div>
                        <strong>
                          {addr.label} · {addr.street}, {addr.number}
                          {addr.complement ? ` (${addr.complement})` : ''}
                        </strong>
                        <span style={{ display: 'block', fontSize: '13px' }}>
                          CEP {addr.postalCode} · {addr.city}/{addr.state} ·{' '}
                          <strong>{addr.zoneName}</strong>
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAddress(addr.id)}
                      className="text-button danger-text"
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>

              <form className="checkout-form" onSubmit={addAddress}>
                <h3 style={{ fontSize: '16px' }}>Adicionar novo endereço</h3>
                <div className="form-group-grid">
                  <label>
                    Identificação (ex: Casa, Trabalho)
                    <input
                      required
                      value={addrForm.label}
                      onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                    />
                  </label>
                  <label>
                    CEP
                    <input
                      required
                      value={addrForm.postalCode}
                      onChange={(e) => setAddrForm({ ...addrForm, postalCode: e.target.value })}
                    />
                  </label>
                </div>
                <div className="form-group-street">
                  <label>
                    Rua / Logradouro
                    <input
                      required
                      value={addrForm.street}
                      onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                    />
                  </label>
                  <label>
                    Número
                    <input
                      required
                      value={addrForm.number}
                      onChange={(e) => setAddrForm({ ...addrForm, number: e.target.value })}
                    />
                  </label>
                </div>
                <div className="form-group-grid">
                  <label>
                    Cidade
                    <input
                      required
                      value={addrForm.city}
                      onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                    />
                  </label>
                  <label>
                    Estado (UF)
                    <input
                      required
                      value={addrForm.state}
                      onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                    />
                  </label>
                </div>
                <div>
                  <button type="submit" className="button button-secondary">
                    <CheckIcon size={15} />
                    <span>Salvar endereço na conta</span>
                  </button>
                </div>
              </form>
            </section>

            <section className="dashboard-card">
              <h2>Privacidade e solicitação de exclusão de dados</h2>
              <p className="muted" style={{ marginBottom: '16px' }}>
                Você pode solicitar a exclusão e anonimização dos seus dados pessoais a qualquer momento. A solicitação gera um protocolo rastreável na trilha de auditoria.
              </p>

              {profile.lgpdRequests.length > 0 && (
                <div className="status-history-list" style={{ marginBottom: '16px' }}>
                  {profile.lgpdRequests.map((req) => (
                    <div
                      className="order-row"
                      key={req.id}
                      style={{ justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div>
                        <strong>Protocolo {req.protocol}</strong>
                        <span style={{ display: 'block', fontSize: '13px' }}>
                          {req.reason} · Solicitado em {formatDateTime(req.requestedAt)}
                        </span>
                      </div>
                      <StatusBadge tone="warning">Em análise operacional</StatusBadge>
                    </div>
                  ))}
                </div>
              )}

              <form className="checkout-form" onSubmit={requestLgpdDeletion}>
                <label>
                  Observação opcional para a solicitação LGPD
                  <input
                    value={lgpdReason}
                    onChange={(e) => setLgpdReason(e.target.value)}
                    placeholder="Ex: Encerramento de uso no município piloto"
                  />
                </label>
                <div>
                  <button type="submit" className="button button-secondary danger-text">
                    <UserIcon size={15} />
                    <span>Solicitar exclusão dos meus dados</span>
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </main>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header, StatusBadge } from '@/components/ui';
import {
  CheckIcon,
  PinIcon,
} from '@/components/icons';
import {
  api,
  formatDateTime,
  requireAuth,
  type AccountProfile,
  type LgpdDeletionRequest,
  type SavedAddress,
} from '@/lib/api';

const EMPTY_ADDRESS_FORM = {
  label: '',
  postalCode: '',
  street: '',
  number: '',
  complement: '',
  city: 'São Paulo',
  state: 'SP',
};

export default function ContaPage() {
  const [profile, setProfile] = useState<AccountProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrForm, setAddrForm] = useState(EMPTY_ADDRESS_FORM);
  const [showLgpdForm, setShowLgpdForm] = useState(false);
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
      setAddrForm(EMPTY_ADDRESS_FORM);
      setShowAddressForm(false);
      setMessage('Endereço salvo com sucesso.');
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
          body: JSON.stringify({ reason: lgpdReason || 'Solicitação do titular' }),
        }
      );
      if (profile) {
        setProfile({
          ...profile,
          lgpdRequests: [created, ...profile.lgpdRequests],
        });
      }
      setLgpdReason('');
      setShowLgpdForm(false);
      setMessage(`Solicitação registrada (protocolo ${created.protocol}).`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <Header app />
      <main className="page-main container">
        <h1>Minha conta</h1>
        <p className="lead">
          Seus dados de acesso e endereços salvos para entrega.
        </p>

        {message && (
          <p className="status status-success status-message" role="status">
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
          <div className="stack-lg">
            <section className="dashboard-card">
              <div className="card-heading">
                <h2>Dados pessoais</h2>
                <div className="cluster-sm">
                  <Link href="/app/pedidos" className="button button-small button-secondary">
                    <span>Meus pedidos</span>
                  </Link>
                  <Link href="/app/assinaturas" className="button button-small button-secondary">
                    <span>Minhas assinaturas</span>
                  </Link>
                </div>
              </div>
              <div className="delivery-info">
                <div>
                  <span>E-mail</span>
                  <strong>{profile.user.email}</strong>
                </div>
                <div>
                  <span>CPF</span>
                  <strong>{profile.maskedCpf}</strong>
                </div>
              </div>
            </section>

            <section className="dashboard-card stack-md">
              <div className="card-heading">
                <div>
                  <h2>Endereços de entrega</h2>
                  <p className="muted">
                    Endereços utilizados para calcular a zona e janela de entrega.
                  </p>
                </div>
                <button
                  type="button"
                  className="button button-small button-secondary"
                  onClick={() => setShowAddressForm((prev) => !prev)}
                >
                  {!showAddressForm && '+'}
                  <span>{showAddressForm ? 'Cancelar' : 'Novo endereço'}</span>
                </button>
              </div>

              {profile.addresses.length === 0 ? (
                <p className="muted">
                  Nenhum endereço salvo ainda.
                </p>
              ) : (
                <div className="status-history-list">
                  {profile.addresses.map((addr) => (
                    <div className="order-row" key={addr.id}>
                      <div className="cluster-sm">
                        <PinIcon size={18} />
                        <div className="stack-xs">
                          <strong>
                            {addr.label} · {addr.street}, {addr.number}
                            {addr.complement ? ` (${addr.complement})` : ''}
                          </strong>
                          <span className="count-tag">
                            CEP {addr.postalCode} · {addr.city}/{addr.state} ·{' '}
                            <strong>{addr.zoneName}</strong>
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAddress(addr.id)}
                        className="danger-text"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {showAddressForm && (
                <form
                  className="checkout-form section-divider"
                  onSubmit={addAddress}
                >
                  <div className="form-group-grid">
                    <label>
                      Identificação
                      <input
                        required
                        placeholder="Ex: Casa, Trabalho"
                        value={addrForm.label}
                        onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                      />
                    </label>
                    <label>
                      CEP
                      <input
                        required
                        placeholder="00000-000"
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
                        placeholder="Nome da rua ou avenida"
                        value={addrForm.street}
                        onChange={(e) => setAddrForm({ ...addrForm, street: e.target.value })}
                      />
                    </label>
                    <label>
                      Número
                      <input
                        required
                        placeholder="Nº"
                        value={addrForm.number}
                        onChange={(e) => setAddrForm({ ...addrForm, number: e.target.value })}
                      />
                    </label>
                  </div>
                  <div className="form-group-grid">
                    <label>
                      Complemento (opcional)
                      <input
                        placeholder="Apto, bloco, referência"
                        value={addrForm.complement}
                        onChange={(e) => setAddrForm({ ...addrForm, complement: e.target.value })}
                      />
                    </label>
                    <label>
                      Cidade / UF
                      <div className="form-city-uf">
                        <input
                          required
                          placeholder="Cidade"
                          value={addrForm.city}
                          onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                        />
                        <input
                          required
                          maxLength={2}
                          placeholder="UF"
                          value={addrForm.state}
                          onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value.toUpperCase() })}
                        />
                      </div>
                    </label>
                  </div>
                  <div>
                    <button type="submit" className="button button-primary">
                      <CheckIcon size={15} />
                      <span>Salvar endereço</span>
                    </button>
                  </div>
                </form>
              )}
            </section>

            <section className="dashboard-card stack-md">
              <div className="card-heading">
                <div>
                  <h2>Privacidade da conta</h2>
                  <p className="muted">
                    Solicitação de encerramento e exclusão de dados pessoais (LGPD).
                  </p>
                </div>
                {!showLgpdForm && (
                  <button
                    type="button"
                    className="text-button danger-text"
                    onClick={() => setShowLgpdForm(true)}
                  >
                    Solicitar exclusão de dados
                  </button>
                )}
              </div>

              {profile.lgpdRequests.length > 0 && (
                <div className="status-history-list">
                  {profile.lgpdRequests.map((req) => (
                    <div className="order-row" key={req.id}>
                      <div className="stack-xs">
                        <strong>Protocolo {req.protocol}</strong>
                        <span className="count-tag">
                          Solicitado em {formatDateTime(req.requestedAt)}
                        </span>
                      </div>
                      <StatusBadge tone="warning">Em análise</StatusBadge>
                    </div>
                  ))}
                </div>
              )}

              {showLgpdForm && (
                <form className="checkout-form" onSubmit={requestLgpdDeletion}>
                  <label>
                    Motivo ou observação (opcional)
                    <input
                      value={lgpdReason}
                      onChange={(e) => setLgpdReason(e.target.value)}
                      placeholder="Ex: Encerramento de conta"
                    />
                  </label>
                  <div className="cluster-sm">
                    <button type="submit" className="button button-small button-secondary danger-text">
                      <span>Confirmar solicitação</span>
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => setShowLgpdForm(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}

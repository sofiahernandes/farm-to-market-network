'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  FluidSheet,
  Header,
  ProducerSubnav,
  StatusBadge,
} from '@/components/ui';
import {
  ArrowRightIcon,
  CheckIcon,
  PackageIcon,
  SproutIcon,
} from '@/components/icons';
import {
  api,
  formatPrice,
  type ProducerDashboardData,
  type Product,
} from '@/lib/api';
import { triggerHaptic } from '@/lib/apple-fluid';

export default function ProdutorCatalogoPage() {
  const [data, setData] = useState<ProducerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [editPriceReais, setEditPriceReais] = useState('');
  const [editSeasonality, setEditSeasonality] = useState('');

  useEffect(() => {
    api<ProducerDashboardData>('/producer/dashboard')
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function toggleOfferStatus(productId: string) {
    triggerHaptic(8);
    setError('');
    setMessage('');
    try {
      const updated = await api<ProducerDashboardData>(
        `/producer/offers/${productId}/toggle-status`,
        { method: 'POST' }
      );
      setData(updated);
      setMessage('Status da oferta atualizado no catálogo.');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function startEdit(offer: Product) {
    triggerHaptic(6);
    setEditing(offer);
    setEditPriceReais((offer.priceCents / 100).toFixed(2));
    setEditSeasonality(offer.seasonality ?? '');
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    triggerHaptic(10);
    setError('');
    setMessage('');
    try {
      const priceCents = Math.round(
        Number(editPriceReais.replace(',', '.')) * 100
      );
      const updated = await api<ProducerDashboardData>(
        `/producer/offers/${editing.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            priceCents,
            seasonality: editSeasonality,
          }),
        }
      );
      setData(updated);
      setEditing(null);
      setMessage(`Oferta "${editing.name}" atualizada e registrada na auditoria.`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <Header app />
      <main className="page-main container">
        <ProducerSubnav
          active="catalogo"
          onboardingApproved={data?.producer.onboardingStatus === 'approved'}
          paymentConnected={data?.producer.paymentAccountConnected ?? true}
        />

        <div className="dashboard-intro">
          <div className="lead">
            <h1>Catálogo de ofertas e cestas fixas</h1>
            <p>
              Publique, edite preços, atualize sazonalidade ou pause ofertas sem perder o histórico.
            </p>
          </div>
          <Link
            href="/produtor/catalogo/novo"
            className="button button-primary"
          >
            <span>Cadastrar nova oferta</span>
            <ArrowRightIcon size={15} />
          </Link>
        </div>

        {message && (
          <p className="status status-success status-message" role="status">
            <span>{message}</span>
            <Link href="/catalogo" className="text-link">
              Ver no catálogo público →
            </Link>
          </p>
        )}
        {error && (
          <div className="info-alert" role="alert">
            <strong>Operação bloqueada ou inválida.</strong>
            <p>{error}</p>
          </div>
        )}
        {loading && <p className="loading-indicator">Carregando ofertas…</p>}

        {editing && (
          <FluidSheet
            ariaLabelledBy="edit-offer-heading"
            onDismiss={() => setEditing(null)}
          >
            <h2 id="edit-offer-heading">Editar oferta: {editing.name}</h2>
            <form className="checkout-form" onSubmit={saveEdit}>
              <div className="form-group-grid">
                <label>
                  Preço por {editing.unit} (R$)
                  <input
                    required
                    value={editPriceReais}
                    onChange={(e) => setEditPriceReais(e.target.value)}
                  />
                </label>
                <label>
                  Sazonalidade e colheita
                  <input
                    required
                    value={editSeasonality}
                    onChange={(e) => setEditSeasonality(e.target.value)}
                  />
                </label>
              </div>
              <div className="hero-actions">
                <button type="submit" className="button button-primary">
                  <CheckIcon size={15} />
                  <span>Salvar alterações</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="button button-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </FluidSheet>
        )}

        {data && (
          <div className="status-history-list">
            {data.offers.map((offer) => {
              const isCesta = offer.category.toLowerCase().includes('cesta');
              const isActive = offer.active !== false;
              return (
                <section
                  className="dashboard-card order-card"
                  key={offer.id}
                >
                  <div className="card-heading">
                    <div className="cluster-md">
                      <div className="mini-art" aria-hidden="true">
                        {isCesta ? (
                          <PackageIcon size={22} />
                        ) : (
                          <SproutIcon size={22} />
                        )}
                      </div>
                      <div className="stack-xs">
                        <span className="order-code">
                          {offer.category} · {offer.certification || 'Agricultura Familiar'}
                        </span>
                        <h2>{offer.name}</h2>
                        <span className="count-tag">
                          {offer.seasonality || 'Colheita semanal'} · Produtor:{' '}
                          {offer.producer.name}
                        </span>
                      </div>
                    </div>
                    <StatusBadge tone={isActive ? 'success' : 'warning'}>
                      {isActive ? 'Publicada' : 'Pausada / Rascunho'}
                    </StatusBadge>
                  </div>

                  <div className="delivery-info">
                    <div>
                      <span>Preço de venda</span>
                      <strong>
                        {formatPrice(offer.priceCents)} / {offer.unit}
                      </strong>
                    </div>
                    <div>
                      <span>Disponibilidade no lote</span>
                      <strong>
                        {offer.stock.available} {offer.unit} disponíveis
                      </strong>
                    </div>
                    <div className="cluster-sm push-end">
                      <button
                        type="button"
                        onClick={() => startEdit(offer)}
                        className="button button-small button-secondary"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleOfferStatus(offer.id)}
                        className={
                          isActive
                            ? 'button button-small button-secondary'
                            : 'button button-small button-primary'
                        }
                      >
                        {isActive ? 'Pausar oferta' : 'Publicar oferta'}
                      </button>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Footer, Header, SectionHeading, StatusBadge } from '@/components/ui';
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  ShieldCheckIcon,
  SproutIcon,
} from '@/components/icons';
import {
  api,
  formatDate,
  formatPrice,
  isAuthenticated,
  requireAuth,
  type Basket,
  type Cart,
  type Subscription,
} from '@/lib/api';
import { MOCK_DELIVERY_SLOTS } from '@/lib/mock-data';

export default function CestasPage() {
  const router = useRouter();
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [selectedBasket, setSelectedBasket] = useState<Basket | null>(null);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('weekly');
  const [slotId, setSlotId] = useState(MOCK_DELIVERY_SLOTS[0].id);
  const [address, setAddress] = useState({
    postalCode: '01310-100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: 'Apto. 42',
    city: 'São Paulo',
    state: 'SP',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<{ data: Basket[] }>('/baskets')
      .then((res) => setBaskets(res.data))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  function openSubscribeModal(basket: Basket) {
    if (!isAuthenticated()) {
      requireAuth();
      return;
    }
    setError('');
    setMessage('');
    setSelectedBasket(basket);
    setFrequency('weekly');
  }

  async function addSingleToCart(basket: Basket) {
    if (!isAuthenticated()) {
      requireAuth();
      return;
    }
    setError('');
    setMessage('');
    try {
      await api<Cart>('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId: basket.productId, quantity: 1 }),
      });
      setMessage(`${basket.name} adicionada à sacola para compra avulsa.`);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function confirmSubscription(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBasket) return;
    setSubmitting(true);
    setError('');
    try {
      const idemKey = `sub-${selectedBasket.id}-${frequency}-${Date.now()}`;
      await api<Subscription>('/subscriptions', {
        method: 'POST',
        headers: { 'x-idempotency-key': idemKey },
        body: JSON.stringify({
          basketId: selectedBasket.id,
          frequency,
          deliverySlotId: slotId,
          address,
        }),
      });
      setSelectedBasket(null);
      router.push('/app/assinaturas');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page-main container">
        <SectionHeading title="Cestas  da colheita com assinatura semanal ou mensal.">
          <Link href="/app/assinaturas" className="button button-secondary">
            <span>Minhas assinaturas</span>
            <ArrowRightIcon size={15} />
          </Link>
        </SectionHeading>

        <div className="zone-alert">
          <div className="zone-alert-icon">
            <ShieldCheckIcon size={20} />
          </div>
          <div>
            <strong>
              Composição e preço fixos por ciclo · Sem fidelidade forçada
            </strong>
            <p>
              Cada cesta fixa reúne itens colhidos na véspera pelos produtores
              locais. Você pode pausar, reativar ou cancelar até o prazo de
              cutoff configurado antes de cada entrega.
            </p>
          </div>
        </div>

        {message && (
          <p
            className="status status-success status-message"
            role="status"
            style={{ marginBottom: '20px' }}
          >
            <span>{message}</span>
            <Link className="text-link" href="/app/carrinho">
              Ir para a sacola →
            </Link>
          </p>
        )}

        {error && (
          <div className="info-alert" role="alert">
            <strong>Não foi possível concluir a operação.</strong>
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <p className="loading-indicator">Carregando cestas fixas…</p>
        )}

        {!loading && baskets.length > 0 && (
          <div className="product-grid">
            {baskets.map((basket) => (
              <article
                className="dashboard-card"
                key={basket.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div className="card-heading">
                  <div>
                    <span className="product-category-tag">
                      {basket.producer.name}
                    </span>
                    <h2 style={{ marginTop: '4px', marginBottom: '4px' }}>
                      {basket.name}
                    </h2>
                    <span className="count-tag">{basket.seasonality}</span>
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--line)',
                    paddingTop: '12px',
                  }}
                >
                  <strong
                    style={{
                      fontSize: '0.95rem',
                      color: 'var(--forest)',
                      display: 'block',
                      marginBottom: '8px',
                    }}
                  >
                    Itens fixos deste ciclo ({basket.items.length} itens):
                  </strong>
                  <div className="status-history-list">
                    {basket.items.map((item, idx) => (
                      <div
                        key={`${basket.id}-item-${idx}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          fontSize: '0.95rem',
                          paddingBlock: '5px',
                          borderBottom:
                            idx < basket.items.length - 1
                              ? '1px solid var(--line)'
                              : '0',
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <SproutIcon size={14} />
                          <strong>{item.name}</strong>
                        </span>
                        <span className="count-tag">
                          {item.quantity} · {item.origin}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--line)',
                    paddingTop: '14px',
                    marginTop: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '24px',
                    }}
                  >
                    <div className="product-price">
                      <strong>{formatPrice(basket.priceCents)}</strong>
                      <span className="product-unit"> / ciclo</span>
                    </div>
                    <StatusBadge
                      tone={basket.stock.available > 0 ? 'success' : 'warning'}
                    >
                      {basket.stock.available} disponíveis
                    </StatusBadge>
                  </div>

                  <div
                    style={{
                      fontSize: '0.95rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <CalendarIcon size={14} />
                      Próxima entrega:{' '}
                      <strong>{formatDate(basket.stock.deliveryDate)}</strong>
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <ClockIcon size={14} />
                      Cancelamento:{' '}
                      <strong>{basket.cutoffHours}h antes da entrega</strong>
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      marginTop: '6px',
                    }}
                  >
                    <button
                      type="button"
                      disabled={basket.stock.available < 1}
                      onClick={() => openSubscribeModal(basket)}
                      className="button button-primary button-full mt-6"
                    >
                      <span>Assinar (semanal ou mensal)</span>
                      <ArrowRightIcon size={15} />
                    </button>
                    <button
                      type="button"
                      disabled={basket.stock.available < 1}
                      onClick={() => addSingleToCart(basket)}
                      className="button button-secondary button-full"
                    >
                      <span>Comprar 1 ciclo avulso</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {selectedBasket && (
          <section
            className="dashboard-card"
            style={{ marginTop: '32px', border: '2px solid var(--forest)' }}
            aria-labelledby="subscribe-heading"
          >
            <div className="card-heading">
              <div>
                <span className="product-category-tag">
                  Configurar assinatura recorrente
                </span>
                <h2 id="subscribe-heading" style={{ marginTop: '4px' }}>
                  {selectedBasket.name} ·{' '}
                  {formatPrice(selectedBasket.priceCents)} / ciclo
                </h2>
                <p className="lead">
                  Produtor responsável:{' '}
                  <strong>{selectedBasket.producer.name}</strong> · Alterações:{' '}
                  <strong>
                    {selectedBasket.cutoffHours}h antes de cada entrega
                  </strong>
                  .
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBasket(null)}
                className="button button-small button-secondary"
              >
                Fechar
              </button>
            </div>

            <form
              className="checkout-form"
              onSubmit={confirmSubscription}
              style={{ marginTop: '18px' }}
            >
              <div className="form-group-grid">
                <label>
                  Frequência de entrega e cobrança
                  <select
                    value={frequency}
                    onChange={(e) =>
                      setFrequency(e.target.value as 'weekly' | 'monthly')
                    }
                  >
                    <option value="weekly">
                      Semanal (toda semana · mesmo preço fixo)
                    </option>
                    <option value="monthly">
                      Mensal (1 ciclo a cada 30 dias)
                    </option>
                  </select>
                </label>
                <label>
                  Janela de entrega
                  <select
                    value={slotId}
                    onChange={(e) => setSlotId(e.target.value)}
                  >
                    {MOCK_DELIVERY_SLOTS.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="form-group-grid">
                <label>
                  CEP
                  <input
                    required
                    value={address.postalCode}
                    onChange={(e) =>
                      setAddress({ ...address, postalCode: e.target.value })
                    }
                  />
                </label>
                <label>
                  Cidade
                  <input
                    required
                    value={address.city}
                    onChange={(e) =>
                      setAddress({ ...address, city: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="form-group-street">
                <label>
                  Rua / Logradouro
                  <input
                    required
                    value={address.street}
                    onChange={(e) =>
                      setAddress({ ...address, street: e.target.value })
                    }
                  />
                </label>
                <label>
                  Número
                  <input
                    required
                    value={address.number}
                    onChange={(e) =>
                      setAddress({ ...address, number: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="form-group-grid">
                <label>
                  Complemento
                  <input
                    value={address.complement}
                    onChange={(e) =>
                      setAddress({ ...address, complement: e.target.value })
                    }
                  />
                </label>
                <label>
                  Estado (UF)
                  <input
                    required
                    value={address.state}
                    onChange={(e) =>
                      setAddress({ ...address, state: e.target.value })
                    }
                  />
                </label>
              </div>

              <div className="sandbox-notice">
                <CheckIcon size={15} />
                <span>
                  Ao confirmar, o 1º ciclo é reservado no estoque imediatamente
                  e a recorrência opera no adapter fake sandbox (sem cobrança
                  real em cartão).
                </span>
              </div>

              <div className="hero-actions">
                <button
                  type="submit"
                  disabled={submitting}
                  className="button button-primary"
                >
                  <CheckIcon size={16} />
                  <span>
                    {submitting
                      ? 'Ativando assinatura…'
                      : 'Confirmar assinatura da cesta'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBasket(null)}
                  className="button button-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

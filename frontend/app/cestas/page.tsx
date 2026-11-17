'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FluidSheet,
  Header,
  SectionHeading,
  StatusBadge,
} from '@/components/ui';
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
  type DeliverySlotOption,
  type Subscription,
} from '@/lib/api';
import { triggerHaptic } from '@/lib/apple-fluid';
import { MOCK_DELIVERY_SLOTS } from '@/lib/mock-data';

export default function CestasPage() {
  const router = useRouter();
  const [baskets, setBaskets] = useState<Basket[]>([]);
  const [slots, setSlots] = useState<DeliverySlotOption[]>(MOCK_DELIVERY_SLOTS);
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
    api<{ data: DeliverySlotOption[] }>('/delivery-slots')
      .then((res) => {
        if (res.data.length > 0) {
          setSlots(res.data);
          setSlotId(res.data[0].id);
        }
      })
      .catch(() => { });
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
    triggerHaptic(8);
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
    triggerHaptic(8);
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
    triggerHaptic(10);
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
          <p className="status status-success status-message" role="status">
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
                className="dashboard-card stack-md"
                key={basket.id}
              >
                <div className="card-heading">
                  <div className="stack-xs">
                    <span className="product-category-tag">
                      {basket.producer.name}
                    </span>
                    <h2>{basket.name}</h2>
                    <span className="count-tag">{basket.seasonality}</span>
                  </div>
                </div>

                <div className="section-divider">
                  <strong className="section-label">
                    Itens fixos deste ciclo ({basket.items.length} itens):
                  </strong>
                  <div className="status-history-list">
                    {basket.items.map((item, idx) => (
                      <div
                        key={`${basket.id}-item-${idx}`}
                        className="list-row"
                      >
                        <span className="cluster-sm">
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

                <div className="section-divider-auto stack-sm">
                  <div className="row-between">
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

                  <div className="stack-xs">
                    <span className="cluster-sm">
                      <CalendarIcon size={14} />
                      <span>
                        Próxima entrega:{' '}
                        <strong>{formatDate(basket.stock.deliveryDate)}</strong>
                      </span>
                    </span>
                    <span className="cluster-sm">
                      <ClockIcon size={14} />
                      <span>
                        Cancelamento:{' '}
                        <strong>{basket.cutoffHours}h antes da entrega</strong>
                      </span>
                    </span>
                  </div>

                  <div className="stack-sm">
                    <button
                      type="button"
                      disabled={basket.stock.available < 1}
                      onClick={() => openSubscribeModal(basket)}
                      className="button button-primary button-full"
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
          <FluidSheet
            ariaLabelledBy="subscribe-heading"
            onDismiss={() => setSelectedBasket(null)}
          >
            <div className="card-heading">
              <div className="stack-xs">
                <span className="product-category-tag">
                  Configurar assinatura recorrente
                </span>
                <h2 id="subscribe-heading">
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

            <form className="checkout-form" onSubmit={confirmSubscription}>
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
                    {slots.map((slot) => (
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
          </FluidSheet>
        )}
      </main>
    </>
  );
}

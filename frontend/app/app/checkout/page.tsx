'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header } from '@/components/ui';
import {
  api,
  formatPrice,
  requireAuth,
  type Cart,
  type DeliverySlotOption,
  type Order,
} from '@/lib/api';
import { MOCK_DELIVERY_SLOTS } from '@/lib/mock-data';

export default function Checkout() {
  const [cart, setCart] = useState<Cart | null>(null),
    [slots, setSlots] = useState<DeliverySlotOption[]>(MOCK_DELIVERY_SLOTS),
    [form, setForm] = useState({
      postalCode: '01310-100',
      street: 'Avenida Paulista',
      number: '1000',
      complement: 'Apto. 42',
      city: 'São Paulo',
      state: 'SP',
    }),
    [slot, setSlot] = useState(MOCK_DELIVERY_SLOTS[0].id),
    [error, setError] = useState(''),
    [order, setOrder] = useState<Order | null>(null),
    [loading, setLoading] = useState(true),
    [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!requireAuth()) return;
    api<{ data: DeliverySlotOption[] }>('/delivery-slots')
      .then((res) => {
        if (res.data.length > 0) {
          setSlots(res.data);
          setSlot(res.data[0].id);
        }
      })
      .catch(() => {});
    api<Cart>('/cart')
      .then(setCart)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const key =
        localStorage.getItem('mana_checkout_key') || crypto.randomUUID();
      localStorage.setItem('mana_checkout_key', key);
      setOrder(
        await api<Order>('/checkout', {
          method: 'POST',
          headers: { 'x-idempotency-key': key },
          body: JSON.stringify({ address: form, deliverySlotId: slot }),
        })
      );
      localStorage.removeItem('mana_checkout_key');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (order)
    return (
      <>
        <Header app />
        <main className="page-main container">
          <section className="dashboard-card order-confirmed-card stack-sm">
            <h1>Pedido #{order.id} confirmado com sucesso</h1>
            <p className="lead">
              A reserva dos itens no estoque foi efetuada e o produtor foi notificado para o preparo.
            </p>
            <div className="payment-summary-box">
              <span>Status do pagamento: {order.payment.provider} · {order.payment.status}</span>
            </div>
            <div className="hero-actions">
              <Link href={`/app/pedidos/${order.id}`} className="button button-primary">
                Ver detalhes do pedido
              </Link>
              <Link href="/app/pedidos" className="button button-secondary">
                Acompanhar meus pedidos
              </Link>
            </div>
          </section>
        </main>
      </>
    );

  return (
    <>
      <Header app />
      <main className="page-main container">
        <h1>Endereço e janela de entrega</h1>
        <p className="lead">
          Informe o local onde você deseja receber seus alimentos frescos.
        </p>
        {loading ? (
          <p className="loading-indicator">Carregando dados…</p>
        ) : cart && cart.data.length === 0 ? (
          <p className="danger-text">
            Sua sacola está vazia. <Link href="/catalogo">Voltar ao catálogo</Link>
          </p>
        ) : (
          <div className="checkout-layout">
            <form className="checkout-form dashboard-card" onSubmit={submit}>
              <div className="form-group-grid">
                <label>
                  CEP
                  <input
                    required
                    value={form.postalCode}
                    onChange={(e) =>
                      setForm({ ...form, postalCode: e.target.value })
                    }
                    placeholder="00000-000"
                  />
                </label>
                <label>
                  Cidade
                  <input
                    required
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Sua cidade"
                  />
                </label>
              </div>
              <div className="form-group-street">
                <label>
                  Rua / Logradouro
                  <input
                    required
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="Ex: Rua das Flores"
                  />
                </label>
                <label>
                  Número
                  <input
                    required
                    value={form.number}
                    onChange={(e) => setForm({ ...form, number: e.target.value })}
                    placeholder="123"
                  />
                </label>
              </div>
              <div className="form-group-grid">
                <label>
                  Complemento
                  <input
                    value={form.complement}
                    onChange={(e) =>
                      setForm({ ...form, complement: e.target.value })
                    }
                    placeholder="Apto, bloco (opcional)"
                  />
                </label>
                <label>
                  Estado (UF)
                  <input
                    required
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}
                    placeholder="SP"
                  />
                </label>
              </div>
              <label>
                Janela de entrega
                <select value={slot} onChange={(e) => setSlot(e.target.value)}>
                  {slots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
              {error && (
                <p className="danger-text" role="alert">
                  {error}
                </p>
              )}
              <button
                disabled={submitting}
                className="button button-primary button-full"
              >
                {submitting ? 'Confirmando pedido…' : 'Confirmar pedido'}
              </button>
              <p className="microcopy">
                Ambiente de demonstração sandbox: nenhuma cobrança real ocorre no cartão.
              </p>
            </form>
            <aside className="dashboard-card summary-card">
              <h2>Seu pedido</h2>
              <div className="summary-row">
                <span>{cart?.data.length ?? 0} itens na sacola</span>
                <strong>{formatPrice(cart?.totalCents ?? 0)}</strong>
              </div>
              <div className="summary-row">
                <span>Entrega direta</span>
                <span className="free-badge">Inclusa</span>
              </div>
              <hr />
              <div className="total-row">
                <span>Total</span>
                <strong>{formatPrice(cart?.totalCents ?? 0)}</strong>
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}

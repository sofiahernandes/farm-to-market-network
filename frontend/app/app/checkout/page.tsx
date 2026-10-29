'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header } from '@/components/ui';
import {
  api,
  formatPrice,
  requireAuth,
  type Cart,
  type Order,
} from '@/lib/api';

export default function Checkout() {
  const [cart, setCart] = useState<Cart | null>(null),
    [form, setForm] = useState({
      postalCode: '',
      street: '',
      number: '',
      complement: '',
      city: '',
      state: '',
    }),
    [slot, setSlot] = useState('seed-slot'),
    [error, setError] = useState(''),
    [order, setOrder] = useState<Order | null>(null),
    [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth()) return;
    api<Cart>('/cart')
      .then(setCart)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const key =
        localStorage.getItem('agritech_checkout_key') || crypto.randomUUID();
      localStorage.setItem('agritech_checkout_key', key);
      setOrder(
        await api<Order>('/checkout', {
          method: 'POST',
          headers: { 'x-idempotency-key': key },
          body: JSON.stringify({ address: form, deliverySlotId: slot }),
        })
      );
      localStorage.removeItem('agritech_checkout_key');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (order)
    return (
      <>
        <Header app />
        <main className="page-main container narrow">
          <section className="dashboard-card">
            <div className="eyebrow">Pedido confirmado</div>
            <h1>Pedido {order.id}</h1>
            <p className="lead">
              Seu pedido foi confirmado e o estoque foi reservado.
            </p>
            <p>
              Pagamento: {order.payment.provider} · {order.payment.status}
            </p>
            <Link href="/app/pedidos" className="button button-primary">
              Acompanhar pedidos
            </Link>
          </section>
        </main>
      </>
    );

  return (
    <>
      <Header app />
      <main className="page-main container narrow">
        <div className="breadcrumb">
          <Link href="/app/carrinho">Sacola</Link>
          <span>/</span>Checkout
        </div>
        <h1>Onde você recebe?</h1>
        <p className="lead">
          Informe o endereço e a janela persistida pelo backend.
        </p>
        {loading ? (
          <p>Carregando…</p>
        ) : cart && cart.data.length === 0 ? (
          <p className="danger-text">
            Carrinho vazio. <Link href="/catalogo">Voltar ao catálogo</Link>
          </p>
        ) : (
          <div className="checkout-layout">
            <form className="checkout-form dashboard-card" onSubmit={submit}>
              <label>
                CEP
                <input
                  required
                  value={form.postalCode}
                  onChange={(e) =>
                    setForm({ ...form, postalCode: e.target.value })
                  }
                />
              </label>
              <label>
                Rua
                <input
                  required
                  value={form.street}
                  onChange={(e) => setForm({ ...form, street: e.target.value })}
                />
              </label>
              <label>
                Número
                <input
                  required
                  value={form.number}
                  onChange={(e) => setForm({ ...form, number: e.target.value })}
                />
              </label>
              <label>
                Complemento
                <input
                  value={form.complement}
                  onChange={(e) =>
                    setForm({ ...form, complement: e.target.value })
                  }
                />
              </label>
              <label>
                Cidade
                <input
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </label>
              <label>
                Estado
                <input
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
              </label>
              <label>
                Janela de entrega
                <select value={slot} onChange={(e) => setSlot(e.target.value)}>
                  <option value="seed-slot">
                    Janela seed-slot (confirmada pela API no checkout)
                  </option>
                </select>
              </label>
              {error && (
                <p className="danger-text" role="alert">
                  {error}
                </p>
              )}
              <button className="button button-primary button-full">
                Confirmar pedido
              </button>
              <p className="microcopy">
                Pagamento fake sandbox; nenhuma cobrança real ocorre.
              </p>
            </form>
            <aside className="dashboard-card summary-card">
              <h2>Seu pedido</h2>
              <div>
                <span>{cart?.data.length ?? 0} itens</span>
                <strong>{formatPrice(cart?.totalCents ?? 0)}</strong>
              </div>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header, StatusBadge } from '@/components/ui';
import { SproutIcon, ArrowRightIcon } from '@/components/icons';
import { api, formatPrice, requireAuth, type Cart } from '@/lib/api';

export default function Carrinho() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!requireAuth()) return;
    api<Cart>('/cart')
      .then(setCart)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function remove(id: string) {
    try {
      setCart(await api<Cart>(`/cart/items/${id}`, { method: 'DELETE' }));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <Header app />
      <main className="page-main container narrow">
        <div className="breadcrumb">
          <Link href="/catalogo">Catálogo</Link>
          <span>/</span> Sacola
        </div>
        <h1>Sua sacola de compras</h1>
        <p className="lead">Revise os itens selecionados dos produtores locais antes de confirmar a entrega.</p>
        {loading && <p className="loading-indicator">Carregando sacola…</p>}
        {error && (
          <p className="danger-text" role="alert">
            {error}
          </p>
        )}
        {!loading && cart && cart.data.length === 0 && (
          <section className="dashboard-card empty-card">
            <h2>Sua sacola está vazia no momento.</h2>
            <p className="muted">Descubra os produtos frescos e cestas da semana dos pequenos produtores.</p>
            <Link className="button button-primary" href="/catalogo">
              <span>Explorar ofertas</span>
              <ArrowRightIcon size={16} />
            </Link>
          </section>
        )}
        {cart && cart.data.length > 0 && (
          <div className="checkout-layout">
            <section className="dashboard-card cart-items">
              {cart.data.map((item) => (
                <div className="cart-item" key={item.productId}>
                  <div className="mini-art" aria-hidden="true">
                    <SproutIcon size={24} />
                  </div>
                  <div className="cart-item-details">
                    <strong>{item.name}</strong>
                    <span className="cart-item-meta">
                      {item.quantity} × {formatPrice(item.unitPriceCents)}
                    </span>
                    <StatusBadge
                      tone={
                        item.available >= item.quantity ? 'success' : 'warning'
                      }
                    >
                      {item.available} disponíveis no lote
                    </StatusBadge>
                  </div>
                  <strong className="cart-item-subtotal">{formatPrice(item.subtotalCents)}</strong>
                  <button
                    className="text-button danger-text remove-button"
                    onClick={() => remove(item.productId)}
                  >
                    Remover
                  </button>
                </div>
              ))}
              <div className="cart-add-more">
                <Link href="/catalogo" className="text-link">
                  + Adicionar mais itens da colheita
                </Link>
              </div>
            </section>
            <aside className="dashboard-card summary-card">
              <h2>Resumo do pedido</h2>
              <div className="summary-row">
                <span>Subtotal dos itens</span>
                <strong>{formatPrice(cart.totalCents)}</strong>
              </div>
              <div className="summary-row">
                <span>Taxa de entrega</span>
                <span className="muted">Calculada no checkout</span>
              </div>
              <hr />
              <div className="total-row">
                <span>Total estimado</span>
                <strong>{formatPrice(cart.totalCents)}</strong>
              </div>
              <Link
                href="/app/checkout"
                className="button button-primary button-full"
              >
                <span>Avançar para endereço de entrega</span>
                <ArrowRightIcon size={16} />
              </Link>
            </aside>
          </div>
        )}
      </main>
    </>
  );
}

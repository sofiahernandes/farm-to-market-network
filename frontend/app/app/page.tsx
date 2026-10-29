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

export default function AppHome() {
  const [cart, setCart] = useState<Cart | null>(null),
    [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!requireAuth()) return;
    api<Cart>('/cart')
      .then(setCart)
      .catch(() => {});
    api<{ data: Order[] }>('/orders')
      .then((x) => setOrders(x.data))
      .catch(() => {});
  }, []);

  return (
    <>
      <Header app />
      <main className="dashboard container">
        <div className="dashboard-intro">
          <div>
            <h1>Seu espaço de compras locais</h1>
            <p className="lead">Acompanhe sua sacola ativa e o status dos seus pedidos aos produtores.</p>
          </div>
          <Link href="/catalogo" className="button button-primary">
            Explorar ofertas
          </Link>
        </div>
        <div className="metric-grid">
          <div className="metric-card">
            <span className="metric-label">Itens na sacola</span>
            <strong>
              {cart?.data.reduce((s, i) => s + i.quantity, 0) ?? '—'}
            </strong>
            <small>{cart ? formatPrice(cart.totalCents) : 'Carregando'}</small>
          </div>
          <div className="metric-card">
            <span className="metric-label">Pedidos confirmados</span>
            <strong>{orders.length}</strong>
            <small>Histórico da sua conta</small>
          </div>
        </div>
        <section className="dashboard-card">
          <h2>Próximas ações</h2>
          <p className="muted">
            Consulte as ofertas persistidas no catálogo, finalize os itens da sacola ou visualize
            os detalhes de entrega dos pedidos em andamento.
          </p>
          <div className="hero-actions">
            <Link href="/app/carrinho" className="button button-primary">
              Ver sacola
            </Link>
            <Link href="/app/pedidos" className="button button-secondary">
              Histórico de pedidos
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

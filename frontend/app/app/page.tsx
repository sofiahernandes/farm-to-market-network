'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header } from '@/components/ui';
import {
  api,
  formatDate,
  formatPrice,
  requireAuth,
  type Cart,
  type Order,
  type Subscription,
} from '@/lib/api';

export default function AppHome() {
  const [cart, setCart] = useState<Cart | null>(null),
    [orders, setOrders] = useState<Order[]>([]),
    [subs, setSubs] = useState<Subscription[]>([]);

  useEffect(() => {
    if (!requireAuth()) return;
    api<Cart>('/cart')
      .then(setCart)
      .catch(() => {});
    api<{ data: Order[] }>('/orders')
      .then((x) => setOrders(x.data))
      .catch(() => {});
    api<{ data: Subscription[] }>('/subscriptions')
      .then((x) => setSubs(x.data))
      .catch(() => {});
  }, []);

  const activeSubs = subs.filter((s) => s.status === 'active');

  return (
    <>
      <Header app />
      <main className="dashboard container">
        <div className="dashboard-intro">
          <div>
            <h1>Seu espaço de compras locais</h1>
            <p className="lead">
              Acompanhe sua sacola ativa, assinaturas de cestas fixas e o status dos seus pedidos aos produtores.
            </p>
          </div>
          <div className="hero-actions">
            <Link href="/catalogo" className="button button-primary">
              Catálogo
            </Link>
            <Link href="/cestas" className="button button-secondary">
              Cestas 
            </Link>
          </div>
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
            <span className="metric-label">Assinaturas ativas</span>
            <strong>{activeSubs.length}</strong>
            <small>
              {activeSubs[0]
                ? `Próxima entrega: ${formatDate(activeSubs[0].nextDeliveryAt)}`
                : 'Nenhuma cesta recorrente ativa'}
            </small>
          </div>
          <div className="metric-card">
            <span className="metric-label">Pedidos confirmados</span>
            <strong>{orders.length}</strong>
            <small>Histórico da sua conta</small>
          </div>
          <div className="metric-card">
            <span className="metric-label">Privacidade e Conta</span>
            <small>Endereços, zona e dados protegidos</small>
          </div>
        </div>
        <section className="dashboard-card">
          <h2>Próximas ações</h2>
          <p className="muted">
            Consulte as ofertas persistidas no catálogo, gerencie suas cestas recorrentes, finalize os itens da sacola ou visualize os detalhes de entrega dos pedidos em andamento.
          </p>
          <div className="hero-actions" style={{ flexWrap: 'wrap' }}>
            <Link href="/app/carrinho" className="button button-primary">
              Ver sacola
            </Link>
            <Link href="/app/assinaturas" className="button button-secondary">
              Minhas assinaturas
            </Link>
            <Link href="/app/pedidos" className="button button-secondary">
              Histórico de pedidos
            </Link>
            <Link href="/app/conta" className="button button-secondary">
              Minha conta
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

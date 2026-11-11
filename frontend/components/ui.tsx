'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  api,
  clearSession,
  formatPrice,
  getCurrentUser,
  isAuthenticated,
  type Cart,
  type Product,
  type User,
} from '@/lib/api';
import {
  LogoIcon,
  SproutIcon,
  BasketIcon,
  PackageIcon,
  ArrowRightIcon,
  UserIcon,
} from '@/components/icons';

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="AgriTech, início">
      <LogoIcon size={32} />
      <span className="logo-text">
        <span className="brand-name">AgriTech</span>
        <span className="brand-tag">Mercado Local</span>
      </span>
    </Link>
  );
}

export function Header({ app = false }: { app?: boolean }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [cartCount, setCartCount] = useState<number | null>(null);

  useEffect(() => {
    function syncState() {
      const authed = isAuthenticated();
      setUser(authed ? getCurrentUser() : null);
      if (authed) {
        api<Cart>('/cart')
          .then((c) =>
            setCartCount(c.data.reduce((sum, item) => sum + item.quantity, 0))
          )
          .catch(() => setCartCount(null));
      } else {
        setCartCount(null);
      }
    }

    syncState();
    window.addEventListener('agritech:state', syncState);
    window.addEventListener('storage', syncState);
    return () => {
      window.removeEventListener('agritech:state', syncState);
      window.removeEventListener('storage', syncState);
    };
  }, []);

  function handleLogout() {
    clearSession();
    router.push('/');
  }

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Logo />
        <nav className="main-nav" aria-label="Navegação principal">
          {app || user ? (
            <>
              <Link href="/catalogo">Explorar ofertas</Link>
              <Link href="/cestas">Cestas fixas</Link>
              <Link href="/app/assinaturas">Assinaturas</Link>
              <Link href="/app/pedidos">Meus pedidos</Link>
              <Link href="/produtor">Produtor</Link>
              <Link href="/admin">Operações</Link>
            </>
          ) : (
            <>
              <Link href="/catalogo">Ofertas da semana</Link>
              <Link href="/cestas">Cestas fixas</Link>
              <Link href="/produtor">Para produtores</Link>
              <Link href="/admin">Operações</Link>
              <Link href="/#como-funciona">Como funciona</Link>
            </>
          )}
        </nav>
        <div className="nav-actions">
          <Link className="cart-link" href="/app/carrinho">
            <BasketIcon size={18} />
            <span>
              Sacola{cartCount !== null && cartCount > 0 ? ` (${cartCount})` : ''}
            </span>
          </Link>
          {user ? (
            <>
              <Link
                className="button button-small button-secondary hide-mobile"
                href="/app/conta"
                title={user.email}
              >
                <UserIcon size={15} />
                <span>Minha conta</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="button button-small button-secondary"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                className="button button-small button-secondary hide-mobile"
                href="/entrar"
              >
                Entrar
              </Link>
              <Link
                className="button button-small button-primary hide-mobile"
                href="/criar-conta"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand-col">
          <Logo />
          <p className="footer-copy">
            Alimentos frescos de pequenos produtores rurais, direto do campo para a sua mesa com procedência transparente.
          </p>
        </div>
        <div>
          <h3>Navegação</h3>
          <Link href="/catalogo">Explorar ofertas</Link>
          <Link href="/cestas">Cestas fixas e assinatura</Link>
          <Link href="/produtor">Painel do produtor</Link>
          <Link href="/admin">Painel de operações</Link>
          <Link href="/#como-funciona">Como funciona</Link>
        </div>
        <div>
          <h3>Conta</h3>
          <Link href="/entrar">Entrar no painel</Link>
          <Link href="/criar-conta">Cadastre-se</Link>
          <Link href="/app/assinaturas">Minhas assinaturas</Link>
          <Link href="/app/pedidos">Histórico de pedidos</Link>
          <Link href="/app/conta">Privacidade e LGPD</Link>
        </div>
        <div>
          <h3>Ambiente Seguro</h3>
          <span className="footer-meta">Gateway sandbox para demonstração</span>
          <span className="footer-meta">Dados persistidos via SQLite local</span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 AgriTech · Rede de Agricultura Local</span>
        <span className="footer-sandbox-tag">Ambiente de Demonstração Sandbox</span>
      </div>
    </footer>
  );
}

export function ProductCard({ product }: { product: Product }) {
  const isCesta = product.category.toLowerCase().includes('cesta');

  return (
    <article className="product-card">
      <Link
        href={`/produto/${product.id}`}
        className="product-art"
        aria-label={`Ver detalhes de ${product.name}`}
      >
        <div className="product-art-inner">
          {isCesta ? (
            <PackageIcon size={46} className="product-icon" />
          ) : (
            <SproutIcon size={46} className="product-icon" />
          )}
        </div>
        <span className="product-category-badge">{product.category}</span>
      </Link>
      <div className="product-body">
        <div className="product-producer">{product.producer.name}</div>
        <h3>
          <Link href={`/produto/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-meta">
          <div className="product-price">
            <strong>{formatPrice(product.priceCents)}</strong>
            <span className="product-unit"> / {product.unit}</span>
          </div>
          <span className="availability">
            <span className="availability-dot" />
            {product.stock.available} disponíveis
          </span>
        </div>
        <Link
          className="button button-full button-secondary"
          href={`/produto/${product.id}`}
        >
          <span>Ver oferta</span>
          <ArrowRightIcon size={15} />
        </Link>
      </div>
    </article>
  );
}

export function StatusBadge({
  children,
  tone = 'success',
}: {
  children: React.ReactNode;
  tone?: 'success' | 'warning' | 'info';
}) {
  return (
    <span className={`status status-${tone}`}>
      <span>{children}</span>
    </span>
  );
}

export function SectionHeading({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div className="section-heading-text">
        {eyebrow && <span className="section-tag">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {children && <div className="section-heading-action">{children}</div>}
    </div>
  );
}

export function ProducerSubnav({
  active,
  pendingTasksCount = 0,
  onboardingApproved = true,
  paymentConnected = true,
}: {
  active:
    | 'painel'
    | 'onboarding'
    | 'catalogo'
    | 'novo'
    | 'estoque'
    | 'pedidos'
    | 'financeiro'
    | 'conta';
  pendingTasksCount?: number;
  onboardingApproved?: boolean;
  paymentConnected?: boolean;
}) {
  const items: { key: typeof active; label: string; href: string }[] = [
    { key: 'painel', label: 'Painel', href: '/produtor' },
    { key: 'onboarding', label: 'Onboarding e aprovação', href: '/produtor/onboarding' },
    { key: 'catalogo', label: 'Produtos e cestas', href: '/produtor/catalogo' },
    { key: 'novo', label: 'Nova oferta', href: '/produtor/catalogo/novo' },
    { key: 'estoque', label: 'Estoque semanal', href: '/produtor/estoque' },
    { key: 'pedidos', label: 'Pedidos a atender', href: '/produtor/pedidos' },
    { key: 'financeiro', label: 'Financeiro e repasse', href: '/produtor/financeiro' },
    { key: 'conta', label: 'Propriedade e auditoria', href: '/produtor/conta' },
  ];

  return (
    <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <nav
        aria-label="Menu do produtor"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {items.map((item) => {
          const isCurrent = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isCurrent ? 'page' : undefined}
              className={
                isCurrent
                  ? 'button button-small button-primary'
                  : 'button button-small button-secondary'
              }
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
        {pendingTasksCount > 0 && (
          <span style={{ marginLeft: 'auto' }}>
            <StatusBadge tone="warning">
              {pendingTasksCount}{' '}
              {pendingTasksCount === 1 ? 'pendência' : 'pendências'}
            </StatusBadge>
          </span>
        )}
      </nav>

      {(!onboardingApproved || !paymentConnected) && (
        <div className="info-alert" role="region" aria-label="Alerta de pré-requisito do produtor" style={{ marginBottom: 0 }}>
          <div style={{ flex: 1 }}>
            <strong>
              Publicação de novas ofertas bloqueada: pré-requisito pendente
            </strong>
            <p>
              {!onboardingApproved
                ? 'Sua propriedade ainda não está com status Aprovado no onboarding.'
                : ''}{' '}
              {!paymentConnected
                ? 'Sua conta de recebimento Mercado Pago ainda não está conectada.'
                : ''}
            </p>
          </div>
          <Link href="/produtor/onboarding" className="button button-small button-primary">
            Ver pendências
          </Link>
        </div>
      )}
    </div>
  );
}

export function AdminSubnav({
  active,
  openExceptionsCount = 0,
}: {
  active:
    | 'visao-geral'
    | 'pedidos'
    | 'zonas-slots'
    | 'rotas'
    | 'entregas'
    | 'romaneio';
  openExceptionsCount?: number;
}) {
  const items: { key: typeof active; label: string; href: string }[] = [
    { key: 'visao-geral', label: 'Visão geral', href: '/admin' },
    { key: 'pedidos', label: 'Pedidos e exceções', href: '/admin/pedidos' },
    { key: 'zonas-slots', label: 'Zonas e janelas', href: '/admin/zonas-slots' },
    { key: 'rotas', label: 'Rotas manuais', href: '/admin/rotas' },
    { key: 'entregas', label: 'Status de entregas', href: '/admin/entregas' },
    { key: 'romaneio', label: 'Romaneio diário', href: '/admin/romaneio' },
  ];

  return (
    <div style={{ marginBottom: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <nav
        aria-label="Menu de operações"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 'var(--radius-md)',
        }}
      >
        {items.map((item) => {
          const isCurrent = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isCurrent ? 'page' : undefined}
              className={
                isCurrent
                  ? 'button button-small button-primary'
                  : 'button button-small button-secondary'
              }
            >
              <span>{item.label}</span>
            </Link>
          );
        })}
        {openExceptionsCount > 0 && (
          <span style={{ marginLeft: 'auto' }}>
            <StatusBadge tone="warning">
              {openExceptionsCount}{' '}
              {openExceptionsCount === 1
                ? 'exceção aberta'
                : 'exceções abertas'}
            </StatusBadge>
          </span>
        )}
      </nav>
    </div>
  );
}

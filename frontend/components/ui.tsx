'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
  animateAppleSpring,
  PointerVelocityTracker,
  project,
  rubberband,
  triggerHaptic,
  type SpringController,
} from '@/lib/apple-fluid';
import {
  LogoIcon,
  SproutIcon,
  BasketIcon,
  PackageIcon,
  ArrowRightIcon,
  UserIcon,
  ExitIcon,
} from '@/components/icons';

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="Manà, início">
      <LogoIcon size={32} />
      <span className="logo-text">
        <span className="brand-name">Manà</span>
      </span>
    </Link>
  );
}

export function Header(_props: { app?: boolean } = {}) {
  void _props;
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
    window.addEventListener('mana:state', syncState);
    window.addEventListener('storage', syncState);
    return () => {
      window.removeEventListener('mana:state', syncState);
      window.removeEventListener('storage', syncState);
    };
  }, []);

  function handleLogout() {
    triggerHaptic(10);
    clearSession();
    router.push('/');
  }

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Logo />
        <nav className="main-nav" aria-label="Navegação principal">
          {user ? (
            <>
              <Link href="/catalogo">Catálogo</Link>
              <Link href="/cestas">Cestas</Link>
              {user.role === 'consumer' && (
                <>
                  <Link href="/app/assinaturas">Assinaturas</Link>
                  <Link href="/app/pedidos">Meus pedidos</Link>
                </>
              )}
              {user.role === 'producer' && (
                <Link href="/produtor">Produtor</Link>
              )}
            </>
          ) : (
            <>
              <Link href="/catalogo">Ofertas da semana</Link>
              <Link href="/cestas">Cestas</Link>
              <Link href="/#como-funciona">Como funciona</Link>
            </>
          )}
        </nav>
        <div className="nav-actions">
          <Link className="button button-small button-secondary hide-mobile" href="/app/carrinho">
            <BasketIcon size={18} />
            <span>
              Sacola
              {cartCount !== null && cartCount > 0 ? ` (${cartCount})` : ''}
            </span>
          </Link>
          {user ? (
            <>
              <Link
                className="button button-small button-secondary hide-mobile"
                href={
                  user.role === 'producer'
                    ? '/produtor/conta'
                    : '/app/conta'
                }
                title={user.email}
              >
                <UserIcon size={15} />
                <span>Minha conta</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="h-5 w-5 text-forest hover:text-crimson"
              >
                <ExitIcon className='h-5 w-5' />
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
            Alimentos frescos de pequenos produtores rurais, direto do campo
            para a sua mesa com procedência transparente.
          </p>
        </div>
        <div>
          <h3>Navegação</h3>
          <Link href="/catalogo">Catálogo</Link>
          <Link href="/cestas">Cestas e assinatura</Link>
          <Link href="/produtor">Painel do produtor</Link>
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
          <span className="footer-meta">
            Dados persistidos via SQLite local
          </span>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Manà · Rede de Agricultura Local</span>
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
  onboardingApproved?: boolean;
  paymentConnected?: boolean;
}) {
  const items: { key: typeof active; label: string; href: string }[] = [
    { key: 'painel', label: 'Painel', href: '/produtor' },
    { key: 'pedidos', label: 'Pedidos a atender', href: '/produtor/pedidos' },
    { key: 'catalogo', label: 'Produtos e Cestas', href: '/produtor/catalogo' },
    {
      key: 'onboarding',
      label: 'Documentos',
      href: '/produtor/documentos',
    },
    {
      key: 'financeiro',
      label: 'Financeiro',
      href: '/produtor/financeiro',
    },
  ];

  return (
    <div className="producer-subnav-wrap">
      <nav aria-label="Menu do produtor" className="producer-subnav">
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
      </nav>

      {(!onboardingApproved || !paymentConnected) && (
        <div
          className="info-alert"
          role="region"
          aria-label="Alerta de pré-requisito do produtor"
        >
          <div className="stack-xs">
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
          <Link
            href="/produtor/documentos"
            className="button button-small button-primary push-end"
          >
            Ver pendências
          </Link>
        </div>
      )}
    </div>
  );
}

/**
 * Apple Fluid Sheet Component
 */
export function FluidSheet({
  ariaLabelledBy,
  onDismiss,
  children,
}: {
  ariaLabelledBy?: string;
  onDismiss: () => void;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLElement | null>(null);
  const springRef = useRef<SpringController | null>(null);
  const currentYRef = useRef<number>(28);
  const velocityTrackerRef = useRef(new PointerVelocityTracker());
  const dragStateRef = useRef<{
    pointerId: number;
    grabOffsetY: number;
    startY: number;
    committed: boolean;
  } | null>(null);

  const applyTransform = (y: number) => {
    currentYRef.current = y;
    const el = sheetRef.current;
    if (!el) return;
    if (Math.abs(y) < 0.2) {
      el.style.transform = 'translate3d(0, 0, 0)';
    } else {
      el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    }
  };

  useEffect(() => {
    applyTransform(24);
    springRef.current = animateAppleSpring(
      24,
      0,
      (val) => applyTransform(val),
      undefined,
      { damping: 0.82, response: 0.32 }
    );
    return () => {
      springRef.current?.stop();
    };
  }, []);

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const sheetEl = sheetRef.current;
    if (!sheetEl) return;

    springRef.current?.stop();
    e.currentTarget.setPointerCapture(e.pointerId);

    const liveY = currentYRef.current;
    velocityTrackerRef.current.reset();
    velocityTrackerRef.current.record(e.clientX, e.clientY);

    dragStateRef.current = {
      pointerId: e.pointerId,
      grabOffsetY: e.clientY - liveY,
      startY: e.clientY,
      committed: false,
    };
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    const deltaFromStart = Math.abs(e.clientY - state.startY);
    if (!state.committed && deltaFromStart < 8) return;
    state.committed = true;

    velocityTrackerRef.current.record(e.clientX, e.clientY);
    const rawOffset = e.clientY - state.grabOffsetY;
    const height = sheetRef.current?.offsetHeight || 420;

    const nextY =
      rawOffset < 0
        ? rubberband(rawOffset, height, 0.55)
        : rawOffset;

    applyTransform(nextY);
  }

  function handlePointerRelease(e: React.PointerEvent<HTMLDivElement>) {
    const state = dragStateRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    dragStateRef.current = null;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    const { vy } = velocityTrackerRef.current.getVelocity();
    const currentY = currentYRef.current;
    const height = sheetRef.current?.offsetHeight || 420;

    const projectedY = currentY + project(vy, 0.99);
    const shouldDismiss = projectedY > Math.min(160, height * 0.35) && vy > -150;

    if (shouldDismiss) {
      triggerHaptic(12);
      springRef.current = animateAppleSpring(
        currentY,
        height * 0.65,
        (val) => applyTransform(val),
        () => onDismiss(),
        { damping: 1.0, response: 0.28, velocity: vy }
      );
    } else {
      if (Math.abs(currentY) > 12) triggerHaptic(6);
      springRef.current = animateAppleSpring(
        currentY,
        0,
        (val) => applyTransform(val),
        undefined,
        { damping: 0.8, response: 0.3, velocity: vy }
      );
    }
  }

  return (
    <section
      ref={sheetRef}
      className="dashboard-card fluid-sheet stack-md"
      aria-labelledby={ariaLabelledBy}
    >
      <div
        className="fluid-sheet-grab-bar"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerRelease}
        onPointerCancel={handlePointerRelease}
        title="Arraste para mover ou fechar o painel"
        aria-hidden="true"
      >
        <span className="fluid-sheet-pill" />
      </div>
      {children}
    </section>
  );
}

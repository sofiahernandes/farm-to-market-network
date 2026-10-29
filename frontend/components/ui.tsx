import Link from 'next/link';
import type { Product } from '@/lib/api';
import { formatPrice } from '@/lib/api';

export function Logo() {
  return (
    <Link href="/" className="logo" aria-label="AgriTech, início">
      <span className="logo-mark">↗</span>
      <span>
        Agri<span>Tech</span>
      </span>
    </Link>
  );
}

export function Header({ app = false }: { app?: boolean }) {
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Logo />
        <nav className="main-nav" aria-label="Navegação principal">
          {app ? (
            <>
              <Link href="/catalogo">Explorar</Link>
              <Link href="/app/pedidos">Pedidos</Link>
            </>
          ) : (
            <>
              <Link href="/#como-funciona">Como funciona</Link>
              <Link href="/catalogo">Ofertas</Link>
              <Link href="/#ajuda">Ajuda</Link>
            </>
          )}
        </nav>
        <div className="nav-actions">
          <Link className="cart-link" href="/app/carrinho">
            Sacola
          </Link>
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
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p className="muted footer-copy">
            Alimentos de pequenos produtores, do campo à sua porta.
          </p>
        </div>
        <div>
          <strong>AgriTech</strong>
          <Link href="/#como-funciona">Como funciona</Link>
          <Link href="/catalogo">Explorar ofertas</Link>
          <Link href="/#ajuda">Ajuda e contato</Link>
        </div>
        <div>
          <strong>Conta</strong>
          <Link href="/entrar">Entrar</Link>
          <Link href="/criar-conta">Criar conta</Link>
        </div>
        <div>
          <strong>Ambiente</strong>
          <span className="muted">Gateway de pagamento fake sandbox</span>
          <span className="muted">SQLite sandbox no backend</span>
        </div>
      </div>
      <div className="container footer-bottom">
        © 2026 AgriTech · Ambiente sandbox
      </div>
    </footer>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link
        href={`/produto/${product.id}`}
        className="product-art"
        aria-label={`Ver detalhes de ${product.name}`}
      >
        <span aria-hidden="true">🌱</span>
        <small>{product.category}</small>
      </Link>
      <div className="product-body">
        <div className="eyebrow">{product.category}</div>
        <h3>
          <Link href={`/produto/${product.id}`}>{product.name}</Link>
        </h3>
        <p className="muted">
          {product.producer.name} · {product.unit}
        </p>
        <div className="product-meta">
          <div>
            <strong>{formatPrice(product.priceCents)}</strong>
            <span> / {product.unit}</span>
          </div>
          <span className="availability">
            ● {product.stock.available} disponíveis
          </span>
        </div>
        <Link
          className="button button-full button-secondary"
          href={`/produto/${product.id}`}
        >
          Ver detalhes
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
      <span aria-hidden="true">●</span> {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}

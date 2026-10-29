import Link from 'next/link';
import type { Product } from '@/lib/api';
import { formatPrice } from '@/lib/api';
import {
  LogoIcon,
  SproutIcon,
  BasketIcon,
  PackageIcon,
  ArrowRightIcon,
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
  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Logo />
        <nav className="main-nav" aria-label="Navegação principal">
          {app ? (
            <>
              <Link href="/catalogo">Explorar ofertas</Link>
              <Link href="/app/pedidos">Meus pedidos</Link>
            </>
          ) : (
            <>
              <Link href="/catalogo">Ofertas da semana</Link>
              <Link href="/#como-funciona">Como funciona</Link>
              <Link href="/#produtores">Rede de produtores</Link>
            </>
          )}
        </nav>
        <div className="nav-actions">
          <Link className="cart-link" href="/app/carrinho">
            <BasketIcon size={18} />
            <span>Sacola</span>
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
        <div className="footer-brand-col">
          <Logo />
          <p className="footer-copy">
            Alimentos frescos de pequenos produtores rurais, direto do campo para a sua mesa com procedência transparente.
          </p>
        </div>
        <div>
          <h3>Navegação</h3>
          <Link href="/catalogo">Explorar ofertas</Link>
          <Link href="/#como-funciona">Como funciona</Link>
          <Link href="/#produtores">Produtores parceiros</Link>
        </div>
        <div>
          <h3>Conta</h3>
          <Link href="/entrar">Entrar no painel</Link>
          <Link href="/criar-conta">Cadastre-se</Link>
          <Link href="/app/pedidos">Histórico de pedidos</Link>
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
      <span className="status-dot" aria-hidden="true" />
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

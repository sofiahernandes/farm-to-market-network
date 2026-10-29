'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Footer, Header, StatusBadge } from '@/components/ui';
import {
  PackageIcon,
  SproutIcon,
  ShieldCheckIcon,
  CalendarIcon,
  ArrowRightIcon,
} from '@/components/icons';
import {
  api,
  formatDate,
  formatPrice,
  isAuthenticated,
  requireAuth,
  type Product,
  type Cart,
} from '@/lib/api';

export default function ProductDetail({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Product>(`/catalog/${params.id}`)
      .then(setProduct)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function add() {
    if (!isAuthenticated()) {
      requireAuth();
      return;
    }
    setMessage('');

    try {
      await api<Cart>('/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId: params.id, quantity }),
      });
      setMessage('Oferta adicionada à sua sacola.');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const isCesta = product?.category.toLowerCase().includes('cesta');

  return (
    <>
      <Header />
      <main className="page-main container">
        {loading && <p className="loading-indicator">Carregando oferta…</p>}
        {error && !product && (
          <div className="info-alert">
            <strong>Não foi possível carregar esta oferta.</strong>
            <p>{error}</p>
            <Link className="text-link" href="/catalogo">
              Voltar ao catálogo
            </Link>
          </div>
        )}
        {product && (
          <>
            <div className="breadcrumb">
              <Link href="/catalogo">Catálogo</Link>
              <span>/</span>
              {product.name}
            </div>
            <div className="detail-grid">
              <div className="detail-art">
                <div className="detail-art-inner">
                  {isCesta ? (
                    <PackageIcon size={96} className="detail-icon" />
                  ) : (
                    <SproutIcon size={96} className="detail-icon" />
                  )}
                  <span className="detail-category-badge">{product.category}</span>
                </div>
                <div className="detail-guarantee">
                  <ShieldCheckIcon size={16} />
                  <span>Agricultura verificada · Sem agrotóxicos abusivos</span>
                </div>
              </div>
              <div className="detail-copy">
                <span className="product-category-tag">{product.category}</span>
                <h1>{product.name}</h1>
                <p className="lead">{product.description}</p>
                <div className="producer-line">
                  <span className="producer-avatar">
                    {product.producer.name[0]}
                  </span>
                  <div>
                    <strong>{product.producer.name}</strong>
                    <span>Produtor regional parceiro · {product.unit}</span>
                  </div>
                </div>
                <div className="detail-price-box">
                  <div className="detail-price">
                    <strong>{formatPrice(product.priceCents)}</strong>
                    <span> / {product.unit}</span>
                  </div>
                  <StatusBadge
                    tone={product.stock.available > 0 ? 'success' : 'warning'}
                  >
                    {product.stock.available} disponíveis · entrega {formatDate(product.stock.deliveryDate)}
                  </StatusBadge>
                </div>
                <div className="detail-rule" />
                <div className="detail-controls">
                  <div className="detail-row">
                    <label htmlFor="quantity-input">
                      <strong>Quantidade</strong>
                    </label>
                    <input
                      id="quantity-input"
                      aria-label="Quantidade"
                      type="number"
                      min={1}
                      max={product.stock.available || 1}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, Number(e.target.value)))
                      }
                      className="quantity-input"
                    />
                  </div>
                  <button
                    disabled={!product.stock.available}
                    onClick={add}
                    className="button button-primary button-large button-full"
                  >
                    <span>Adicionar à sacola</span>
                    <ArrowRightIcon size={18} />
                  </button>
                </div>
                {message && (
                  <p className="status status-success status-message" role="status">
                    {message}{' '}
                    <Link className="text-link" href="/app/carrinho">
                      Ir para a sacola →
                    </Link>
                  </p>
                )}
                {error && (
                  <p className="danger-text" role="alert">
                    {error}
                  </p>
                )}
                <div className="sandbox-notice">
                  <CalendarIcon size={14} />
                  <span>Ambiente sandbox: nenhuma cobrança real será efetuada no cartão.</span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

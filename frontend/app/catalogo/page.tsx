'use client';

import { useEffect, useState } from 'react';
import { Footer, Header, ProductCard, SectionHeading } from '@/components/ui';
import { PinIcon, SearchIcon } from '@/components/icons';
import { api, type CatalogResponse } from '@/lib/api';

export default function Catalogo() {
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const id = setTimeout(() => {
      setLoading(true);
      setError('');
      const q = new URLSearchParams({ limit: '20' });
      if (search.trim()) q.set('search', search.trim());
      if (category) q.set('category', category);
      api<CatalogResponse>(`/catalog?${q}`)
        .then(setData)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(id);
  }, [search, category]);

  return (
    <>
      <Header />
      <main className="page-main container">
        <div className="breadcrumb">
          Início <span>/</span> Catálogo
        </div>
        <SectionHeading title="Escolha o que vai para sua mesa.">
          <span className="count-tag">
            {data?.pagination.count ? `${data.pagination.count} ofertas disponíveis` : ''}
          </span>
        </SectionHeading>
        <div className="catalog-toolbar">
          <label className="search-box">
            <SearchIcon size={18} className="search-icon" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por produto, variedade ou produtor"
              aria-label="Buscar produto ou descrição"
            />
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filtrar por categoria"
            className="category-select"
          >
            <option value="">Todas as categorias</option>
            <option value="Cestas">Cestas</option>
            <option value="Hortaliças">Hortaliças</option>
            <option value="Granja">Granja</option>
          </select>
        </div>
        <div className="zone-alert">
          <div className="zone-alert-icon">
            <PinIcon size={20} />
          </div>
          <div>
            <strong>Disponibilidade conforme o estoque do backend</strong>
            <p>O endereço é confirmado no checkout.</p>
          </div>
        </div>
        <section className="catalog-results" aria-live="polite">
          {loading && <p className="muted loading-indicator">Carregando ofertas…</p>}
          {error && (
            <div className="info-alert">
              <strong>Não foi possível carregar o catálogo.</strong>
              <p>{error}</p>
            </div>
          )}
          {!loading && !error && data?.data.length === 0 && (
            <div className="dashboard-card empty-card">
              <h2>Nenhuma oferta encontrada para essa busca.</h2>
              <p className="muted">Tente limpar os termos ou selecione outra categoria.</p>
            </div>
          )}
          {!loading && !error && data && data.data.length > 0 && (
            <div className="product-grid">
              {data.data.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

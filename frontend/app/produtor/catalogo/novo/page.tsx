'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Header,
  ProductCard,
  ProducerSubnav,
} from '@/components/ui';
import { CheckIcon } from '@/components/icons';
import {
  api,
  type ProducerDashboardData,
  type Product,
} from '@/lib/api';

export default function ProdutorNovaOfertaPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<ProducerDashboardData | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: 'Abóbora cabotiá orgânica',
    description:
      'Colhida madura no ponto ideal de doçura, cultivada sem agrotóxicos sintéticos.',
    category: 'Hortaliças',
    unit: 'kg',
    priceReais: '9.90',
    available: 16,
    lowStockThreshold: 4,
    seasonality: 'Safra de Outono/Primavera · Colheita na véspera',
    certification: 'Orgânico Participativo (OPAC)',
  });

  useEffect(() => {
    api<ProducerDashboardData>('/producer/dashboard')
      .then(setDashboard)
      .catch(() => {});
  }, []);

  const priceCents = Math.max(
    0,
    Math.round(Number(form.priceReais.replace(',', '.')) * 100) || 0
  );

  const previewProduct: Product = {
    id: 'preview-oferta',
    name: form.name || 'Nome da oferta',
    description: form.description || 'Descrição da oferta da colheita.',
    category: form.category,
    unit: form.unit || 'un',
    priceCents,
    producer: {
      id: dashboard?.producer.id ?? 'sitio-verde',
      name: dashboard?.producer.displayName ?? 'Sítio Verde',
    },
    stock: {
      available: Number(form.available) || 0,
      deliveryDate: new Date().toISOString(),
    },
    seasonality: form.seasonality,
    certification: form.certification,
  };

  async function saveOffer(publish: boolean) {
    setSubmitting(true);
    setError('');
    try {
      await api<Product>('/producer/offers', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          unit: form.unit,
          priceCents,
          available: Number(form.available),
          lowStockThreshold: Number(form.lowStockThreshold),
          seasonality: form.seasonality,
          certification: form.certification,
          active: publish,
        }),
      });
      router.push('/produtor/catalogo');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Header app />
      <main className="page-main container">
        <ProducerSubnav
          active="novo"
          onboardingApproved={
            dashboard?.producer.onboardingStatus === 'approved'
          }
          paymentConnected={
            dashboard?.producer.paymentAccountConnected ?? true
          }
        />

        <h1>Cadastrar nova oferta ou cesta fixa</h1>
        <p className="lead">
          Preencha as etapas de informações, preço, disponibilidade e certificação com pré-visualização em tempo real do card do catálogo.
        </p>

        {error && (
          <div className="info-alert" role="alert">
            <strong>Não foi possível publicar a oferta.</strong>
            <p>{error}</p>
          </div>
        )}

        <div className="checkout-layout">
          <form
            className="checkout-form dashboard-card"
            onSubmit={(e) => {
              e.preventDefault();
              saveOffer(true);
            }}
          >
            <h2>1. Informações e categoria</h2>
            <div className="form-group-grid">
              <label>
                Nome do produto ou cesta fixa
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Categoria
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                >
                  <option value="Hortaliças">Hortaliças</option>
                  <option value="Frutas">Frutas</option>
                  <option value="Granja">Granja</option>
                  <option value="Cestas">Cestas</option>
                </select>
              </label>
            </div>

            <label>
              Descrição transparente da colheita
              <input
                required
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </label>

            <h2>2. Preço, unidade e disponibilidade</h2>
            <div className="form-group-grid">
              <label>
                Preço de venda (R$)
                <input
                  required
                  value={form.priceReais}
                  onChange={(e) =>
                    setForm({ ...form, priceReais: e.target.value })
                  }
                />
              </label>
              <label>
                Unidade de medida (ex: kg, maço, cesta, dúzia)
                <input
                  required
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </label>
            </div>

            <div className="form-group-grid">
              <label>
                Quantidade disponível para o lote da semana
                <input
                  required
                  type="number"
                  min={0}
                  value={form.available}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      available: Math.max(0, Number(e.target.value)),
                    })
                  }
                />
              </label>
              <label>
                Alerta de estoque baixo (mínimo)
                <input
                  required
                  type="number"
                  min={0}
                  value={form.lowStockThreshold}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lowStockThreshold: Math.max(0, Number(e.target.value)),
                    })
                  }
                />
              </label>
            </div>

            <h2>3. Sazonalidade e certificação</h2>
            <div className="form-group-grid">
              <label>
                Sazonalidade / janela de colheita
                <input
                  required
                  value={form.seasonality}
                  onChange={(e) =>
                    setForm({ ...form, seasonality: e.target.value })
                  }
                />
              </label>
              <label>
                Certificação de origem
                <input
                  required
                  value={form.certification}
                  onChange={(e) =>
                    setForm({ ...form, certification: e.target.value })
                  }
                />
              </label>
            </div>

            <div className="hero-actions">
              <button
                type="submit"
                disabled={submitting}
                className="button button-primary"
              >
                <CheckIcon size={16} />
                <span>
                  {submitting ? 'Publicando…' : 'Publicar oferta no catálogo'}
                </span>
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => saveOffer(false)}
                className="button button-secondary"
              >
                Salvar rascunho (pausada)
              </button>
            </div>
          </form>

          <aside className="stack-sm">
            <strong className="section-label">
              Pré-visualização no catálogo do consumidor:
            </strong>
            <ProductCard product={previewProduct} />
          </aside>
        </div>
      </main>
    </>
  );
}

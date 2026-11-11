'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Footer,
  Header,
  ProducerSubnav,
  StatusBadge,
} from '@/components/ui';
import { CheckIcon, SproutIcon } from '@/components/icons';
import {
  api,
  formatDate,
  type ProducerDashboardData,
} from '@/lib/api';

export default function ProdutorEstoquePage() {
  const [data, setData] = useState<ProducerDashboardData | null>(null);
  const [draftStock, setDraftStock] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    api<ProducerDashboardData>('/producer/dashboard')
      .then((res) => {
        setData(res);
        const initial: Record<string, number> = {};
        for (const o of res.offers) {
          initial[o.id] = o.stock.available;
        }
        setDraftStock(initial);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  async function saveInventory(
    productId: string,
    newAvailable: number,
    expectedAvailable: number
  ) {
    setError('');
    setMessage('');
    try {
      const updated = await api<ProducerDashboardData>(
        `/producer/inventory/${productId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            available: Math.max(0, newAvailable),
            expectedAvailable,
          }),
        }
      );
      setData(updated);
      const nextDrafts: Record<string, number> = {};
      for (const o of updated.offers) {
        nextDrafts[o.id] = o.stock.available;
      }
      setDraftStock(nextDrafts);
      setMessage('Disponibilidade semanal salva e registrada na auditoria.');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <Header app />
      <main className="page-main container">
        <div className="breadcrumb">
          <Link href="/produtor">Painel do produtor</Link>
          <span>/</span>Estoque semanal
        </div>

        <ProducerSubnav
          active="estoque"
          pendingTasksCount={data?.producer.pendingTasksCount ?? 0}
          onboardingApproved={data?.producer.onboardingStatus === 'approved'}
          paymentConnected={data?.producer.paymentAccountConnected ?? true}
        />

        <h1>Disponibilidade semanal e controle de lote</h1>
        <p className="lead">
          Ajuste as quantidades colhidas para a semana. O sistema impede saldo negativo e protege contra conflitos de edição concorrente.
        </p>

        {message && (
          <p className="status status-success status-message" role="status" style={{ marginBottom: '20px' }}>
            <span>{message}</span>
          </p>
        )}
        {error && (
          <div className="info-alert" role="alert">
            <strong>Conflito ou erro de atualização de estoque.</strong>
            <p>{error}</p>
          </div>
        )}
        {loading && <p className="loading-indicator">Carregando saldos de estoque…</p>}

        {data && (
          <div className="status-history-list">
            {data.offers.map((offer) => {
              const currentAvail = offer.stock.available;
              const draftVal = draftStock[offer.id] ?? currentAvail;
              const diff = draftVal - currentAvail;
              const threshold = offer.stock.lowStockThreshold ?? 5;
              const isLow = currentAvail <= threshold;

              return (
                <section
                  className="dashboard-card order-card"
                  key={offer.id}
                  style={{ marginTop: '14px' }}
                >
                  <div className="card-heading">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="mini-art" aria-hidden="true">
                        <SproutIcon size={22} />
                      </div>
                      <div>
                        <span className="order-code">
                          Lote de entrega: {formatDate(offer.stock.deliveryDate)} · Alerta mínimo:{' '}
                          {threshold} {offer.unit}
                        </span>
                        <h2 style={{ marginBottom: '2px' }}>{offer.name}</h2>
                      </div>
                    </div>
                    <StatusBadge tone={isLow ? 'warning' : 'success'}>
                      {isLow
                        ? `Estoque baixo (${currentAvail} ${offer.unit})`
                        : `Disponível (${currentAvail} ${offer.unit})`}
                    </StatusBadge>
                  </div>

                  <div className="delivery-info" style={{ alignItems: 'center' }}>
                    <div>
                      <span>Saldo atual liberado</span>
                      <strong>
                        {currentAvail} {offer.unit}
                      </strong>
                    </div>
                    <div>
                      <span>Reservado em pedidos</span>
                      <strong>
                        {offer.stock.reserved ?? 0} {offer.unit}
                      </strong>
                    </div>
                    <div>
                      <span>Impacto previsto</span>
                      <strong>
                        {diff === 0
                          ? 'Sem alteração'
                          : diff > 0
                            ? `+${diff} ${offer.unit} no lote`
                            : `${diff} ${offer.unit} no lote`}
                      </strong>
                    </div>
                    <div
                      style={{
                        marginLeft: 'auto',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <label htmlFor={`stock-${offer.id}`} className="count-tag">
                        Nova qtd:
                      </label>
                      <input
                        id={`stock-${offer.id}`}
                        type="number"
                        min={0}
                        value={draftVal}
                        onChange={(e) =>
                          setDraftStock({
                            ...draftStock,
                            [offer.id]: Math.max(0, Number(e.target.value)),
                          })
                        }
                        className="quantity-input"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          saveInventory(offer.id, draftVal, currentAvail)
                        }
                        className="button button-small button-primary"
                      >
                        <CheckIcon size={14} />
                        <span>Salvar saldo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          saveInventory(offer.id, draftVal, currentAvail + 99)
                        }
                        className="button button-small button-secondary"
                        title="Simular conflito de concorrência"
                      >
                        Testar conflito
                      </button>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

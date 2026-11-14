'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Header, StatusBadge } from '@/components/ui';
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  PackageIcon,
  ShieldCheckIcon,
} from '@/components/icons';
import {
  api,
  formatDate,
  formatDateTime,
  formatPrice,
  requireAuth,
  type Subscription,
} from '@/lib/api';

function statusLabel(status: Subscription['status']) {
  switch (status) {
    case 'active':
      return { text: 'Assinatura ativa', tone: 'success' as const };
    case 'paused':
      return { text: 'Pausada', tone: 'warning' as const };
    case 'payment_failed':
      return { text: 'Falha na cobrança', tone: 'warning' as const };
    case 'cancelled':
      return { text: 'Cancelada', tone: 'info' as const };
  }
}

function cycleStatusBadge(status: Subscription['cycles'][number]['status']) {
  switch (status) {
    case 'confirmed':
      return { text: 'Pedido confirmado', tone: 'success' as const };
    case 'scheduled':
      return { text: 'Agendado', tone: 'info' as const };
    case 'stock_shortage':
      return { text: 'Falta de estoque no lote', tone: 'warning' as const };
    case 'payment_failed':
      return { text: 'Falha na cobrança', tone: 'warning' as const };
    case 'skipped':
      return { text: 'Ciclo pulado', tone: 'info' as const };
  }
}

export default function AssinaturasPage() {
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!requireAuth()) return;
    api<{ data: Subscription[] }>('/subscriptions')
      .then((res) => setSubs(res.data))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, []);

  function replaceSub(updated: Subscription) {
    setSubs((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
  }

  async function runAction(
    subId: string,
    endpoint: 'pause' | 'resume' | 'cancel' | 'generate-cycle',
    body?: Record<string, unknown>,
    successMsg?: string
  ) {
    setBusyId(subId);
    setError('');
    setMessage('');
    try {
      const updated = await api<Subscription>(
        `/subscriptions/${subId}/${endpoint}`,
        {
          method: 'POST',
          body: body ? JSON.stringify(body) : undefined,
        }
      );
      replaceSub(updated);
      if (successMsg) setMessage(successMsg);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const activeCount = subs.filter((s) => s.status === 'active').length;

  return (
    <>
      <Header app />
      <main className="page-main container">
        <div className="dashboard-intro">
          <div>
            <h1>Suas assinaturas de cestas fixas</h1>
            <p className="lead">
              Acompanhe a próxima cobrança, janela de entrega, regras de cutoff e o histórico de ciclos.
            </p>
          </div>
          <Link href="/cestas" className="button button-primary">
            <span>Conhecer cestas fixas</span>
            <ArrowRightIcon size={15} />
          </Link>
        </div>

        <div className="metric-grid">
          <div className="metric-card">
            <span className="metric-label">Assinaturas ativas</span>
            <strong>{activeCount}</strong>
            <small>Recorrência semanal ou mensal configurada</small>
          </div>
          <div className="metric-card">
            <span className="metric-label">Total de planos no histórico</span>
            <strong>{subs.length}</strong>
            <small>Ciclos reconciliados de forma idempotente</small>
          </div>
        </div>

        {message && (
          <p className="status status-success status-message" role="status">
            <span>{message}</span>
            <Link href="/app/pedidos" className="text-link">
              Ver pedidos gerados →
            </Link>
          </p>
        )}

        {error && (
          <div className="info-alert" role="alert">
            <strong>Ação não concluída.</strong>
            <p>{error}</p>
          </div>
        )}

        {loading && <p className="loading-indicator">Carregando assinaturas…</p>}

        {!loading && subs.length === 0 && (
          <section className="dashboard-card empty-card">
            <h2>Nenhuma assinatura ativa.</h2>
            <p className="muted">
              Escolha uma cesta fixa semanal ou mensal para receber alimentos frescos direto dos produtores.
            </p>
            <Link href="/cestas" className="button button-primary">
              <span>Conhecer cestas</span>
              <ArrowRightIcon size={15} />
            </Link>
          </section>
        )}

        {subs.map((sub) => {
          const badge = statusLabel(sub.status);
          const isBusy = busyId === sub.id;

          return (
            <section
              className="dashboard-card order-card stack-md"
              key={sub.id}
            >
              <div className="card-heading">
                <div className="stack-xs">
                  <span className="order-code">
                    Assinatura #{sub.id} ·{' '}
                    {sub.frequency === 'weekly' ? 'Plano Semanal' : 'Plano Mensal'}
                  </span>
                  <h2>{sub.basketName}</h2>
                  <span className="count-tag">
                    Produtor: {sub.producer.name} · {formatPrice(sub.priceCents)} por ciclo
                  </span>
                </div>
                <StatusBadge tone={badge.tone}>{badge.text}</StatusBadge>
              </div>

              <div className="delivery-info">
                <div>
                  <span>Próxima cobrança prevista</span>
                  <strong>
                    {sub.status === 'cancelled'
                      ? 'Encerrada'
                      : formatDate(sub.nextBillingAt)}
                  </strong>
                </div>
                <div>
                  <span>Próxima entrega programada</span>
                  <strong>
                    {sub.status === 'cancelled'
                      ? 'Encerrada'
                      : formatDate(sub.nextDeliveryAt)}
                  </strong>
                </div>
                <div>
                  <span>Endereço e janela</span>
                  <strong>
                    {sub.address.street}, {sub.address.number} · {sub.address.city}
                  </strong>
                </div>
              </div>

              <div className="zone-alert">
                <div className="zone-alert-icon">
                  <ClockIcon size={18} />
                </div>
                <div>
                  <strong>
                    Regra de cutoff ({sub.cutoffHours}h antes da entrega): limite em{' '}
                    {formatDateTime(sub.cutoffAt)}
                  </strong>
                  <p>
                    {sub.canModifyCurrentCycle
                      ? `Você está dentro do prazo e pode pausar ou cancelar antes do cutoff de ${sub.cutoffHours}h.`
                      : `Este ciclo já entrou na janela de colheita (${sub.cutoffHours}h antes da entrega) e não pode ser pausado ou cancelado.`}
                  </p>
                </div>
              </div>

              <div>
                <strong className="section-label">
                  Composição fixa da cesta ({sub.items.length} itens):
                </strong>
                <div className="cluster-sm">
                  {sub.items.map((item, idx) => (
                    <span
                      key={`${sub.id}-item-${idx}`}
                      className="footer-sandbox-tag"
                    >
                      <PackageIcon size={12} /> {item.name} ({item.quantity})
                    </span>
                  ))}
                </div>
              </div>

              <div className="section-divider cluster-sm">
                {sub.status === 'active' && (
                  <>
                    <button
                      type="button"
                      disabled={isBusy || !sub.canModifyCurrentCycle}
                      onClick={() =>
                        runAction(
                          sub.id,
                          'pause',
                          undefined,
                          'Assinatura pausada com sucesso respeitando o cutoff.'
                        )
                      }
                      className="button button-small button-secondary"
                    >
                      Pausar assinatura
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        runAction(
                          sub.id,
                          'generate-cycle',
                          undefined,
                          'Ciclo processado com sucesso: estoque reservado e pedido criado.'
                        )
                      }
                      className="button button-small button-primary"
                    >
                      <CalendarIcon size={14} />
                      <span>Gerar próximo ciclo (sandbox)</span>
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        runAction(
                          sub.id,
                          'generate-cycle',
                          {
                            cycleKey: `falha-${Date.now()}`,
                            simulatePaymentFailure: true,
                          },
                          'Falha de cobrança recorrente simulada no histórico.'
                        )
                      }
                      className="button button-small button-secondary"
                    >
                      Simular falha de cobrança
                    </button>
                  </>
                )}

                {(sub.status === 'paused' || sub.status === 'payment_failed') && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      runAction(
                        sub.id,
                        'resume',
                        undefined,
                        'Assinatura reativada para os próximos ciclos.'
                      )
                    }
                    className="button button-small button-primary"
                  >
                    <CheckIcon size={14} />
                    <span>Reativar assinatura</span>
                  </button>
                )}

                {sub.status !== 'cancelled' && (
                  <button
                    type="button"
                    disabled={isBusy || !sub.canModifyCurrentCycle}
                    onClick={() =>
                      runAction(
                        sub.id,
                        'cancel',
                        undefined,
                        'Assinatura cancelada dentro do prazo de cutoff.'
                      )
                    }
                    className="button button-small button-secondary danger-text"
                  >
                    Cancelar assinatura
                  </button>
                )}
              </div>

              <div className="section-divider">
                <strong className="section-label">
                  Histórico de ciclos ({sub.cycles.length})
                </strong>
                <div className="status-history-list">
                  {sub.cycles.map((cycle) => {
                    const cb = cycleStatusBadge(cycle.status);
                    return (
                      <div className="order-row" key={cycle.id}>
                        <div className="stack-xs">
                          <strong>
                            Ciclo {cycle.cycleKey} · Entrega {formatDate(cycle.deliveryDate)}
                          </strong>
                          <span>
                            {cycle.note || `Cobrança: ${cycle.paymentStatus}`} · {formatPrice(cycle.amountCents)}
                          </span>
                        </div>
                        <div className="cluster-md">
                          <StatusBadge tone={cb.tone}>{cb.text}</StatusBadge>
                          {cycle.orderId && (
                            <Link href={`/app/pedidos/${cycle.orderId}`} className="text-link">
                              Pedido #{cycle.orderId} →
                            </Link>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="sandbox-notice">
                <ShieldCheckIcon size={14} />
                <span>
                  Ciclos são idempotentes por chave de período: gerar o mesmo ciclo duas vezes não duplica reserva de estoque nem pedido.
                </span>
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  AdminSubnav,
  Footer,
  Header,
  SectionHeading,
  StatusBadge,
} from '@/components/ui';
import { CalendarIcon, MapPinIcon } from '@/components/icons';
import { api, type AdminDashboardData } from '@/lib/api';

export default function AdminZonasSlotsPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoneName, setZoneName] = useState('');
  const [postalCodePrefix, setPostalCodePrefix] = useState('');
  const [city, setCity] = useState('São Paulo');
  const [cutoffHours, setCutoffHours] = useState('36');

  const [slotZoneId, setSlotZoneId] = useState('zone-centro-sul');
  const [slotLabel, setSlotLabel] = useState('');
  const [slotCapacity, setSlotCapacity] = useState('35');

  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api<AdminDashboardData>('/admin/dashboard')
      .then((res) => {
        setData(res);
        if (res.zones[0]) setSlotZoneId(res.zones[0].id);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function createZone(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      const updated = await api<AdminDashboardData>('/admin/zones', {
        method: 'POST',
        body: JSON.stringify({
          name: zoneName,
          postalCodePrefix,
          city,
          cutoffHours: Number(cutoffHours),
        }),
      });
      setData(updated);
      setZoneName('');
      setPostalCodePrefix('');
      setFeedback('Nova zona de atendimento criada com sucesso.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleZone(id: string) {
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      const updated = await api<AdminDashboardData>(
        `/admin/zones/${id}/toggle`,
        { method: 'PATCH' }
      );
      setData(updated);
      setFeedback('Status da zona atualizado.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function createSlot(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      const updated = await api<AdminDashboardData>('/admin/slots', {
        method: 'POST',
        body: JSON.stringify({
          zoneId: slotZoneId,
          label: slotLabel,
          capacity: Number(slotCapacity),
        }),
      });
      setData(updated);
      setSlotLabel('');
      setFeedback(
        'Nova janela de entrega publicada e sincronizada com o checkout do consumidor.'
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleSlot(slotId: string, currentActive: boolean) {
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      const updated = await api<AdminDashboardData>(`/admin/slots/${slotId}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !currentActive }),
      });
      setData(updated);
      setFeedback('Disponibilidade da janela atualizada.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Header app />
      <main className="page-main container">
        <SectionHeading
          eyebrow="Cobertura Geográfica e Capacidade"
          title="Zonas de atendimento e janelas de entrega"
        />

        <AdminSubnav
          active="zonas-slots"
          openExceptionsCount={data?.metrics.openExceptionsCount ?? 0}
        />

        {feedback && (
          <div className="info-alert" role="status">
            <strong>{feedback}</strong>
          </div>
        )}
        {error && (
          <div className="zone-alert" style={{ marginBottom: '20px' }}>
            <p className="danger-text" style={{ margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        {loading || !data ? (
          <div className="dashboard-card">
            <p className="muted">Carregando zonas e janelas…</p>
          </div>
        ) : (
          <div className="checkout-layout" style={{ marginTop: 0 }}>
            <section className="dashboard-card">
              <div className="card-heading">
                <div>
                  <h2>Zonas de atendimento ({data.zones.length})</h2>
                  <p className="muted">
                    Recortes regionais atendidos por faixa de CEP.
                  </p>
                </div>
                <MapPinIcon size={18} />
              </div>

              <div
                className="status-history-list"
                style={{ marginBlock: '14px 20px' }}
              >
                {data.zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="order-row"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong>{zone.name}</strong>
                      <span
                        className="muted"
                        style={{ display: 'block', fontSize: '13px', marginTop: '2px' }}
                      >
                        CEP inicial: {zone.postalCodePrefix}* · {zone.city} ·
                        Limite de alteração: {zone.cutoffHours}h ({zone.ordersCount}{' '}
                        pedidos)
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0,
                      }}
                    >
                      <StatusBadge tone={zone.active ? 'success' : 'warning'}>
                        {zone.active ? 'Ativa' : 'Pausada'}
                      </StatusBadge>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleZone(zone.id)}
                        className="button button-small button-secondary"
                      >
                        {zone.active ? 'Pausar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form className="checkout-form" onSubmit={createZone}>
                <h3>Cadastrar nova zona de atendimento</h3>
                <div className="form-group-grid">
                  <label style={{ gridColumn: '1 / -1' }}>
                    Nome da zona
                    <input
                      required
                      value={zoneName}
                      onChange={(e) => setZoneName(e.target.value)}
                      placeholder="Ex.: Zona Sul · Vila Mariana/Moema"
                    />
                  </label>
                  <label>
                    Prefixo CEP (mín. 2 dígitos)
                    <input
                      required
                      value={postalCodePrefix}
                      onChange={(e) => setPostalCodePrefix(e.target.value)}
                      placeholder="Ex.: 04010"
                    />
                  </label>
                  <label>
                    Prazo limite (horas antes)
                    <input
                      required
                      type="number"
                      min={12}
                      value={cutoffHours}
                      onChange={(e) => setCutoffHours(e.target.value)}
                    />
                  </label>
                  <label style={{ gridColumn: '1 / -1' }}>
                    Município base
                    <input
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="button button-primary"
                >
                  Adicionar zona de atendimento
                </button>
              </form>
            </section>

            <section className="dashboard-card">
              <div className="card-heading">
                <div>
                  <h2>Janelas de entrega ({data.slots.length})</h2>
                  <p className="muted">
                    Capacidade máxima de pedidos por turno.
                  </p>
                </div>
                <CalendarIcon size={18} />
              </div>

              <div
                className="status-history-list"
                style={{ marginBlock: '14px 20px' }}
              >
                {data.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="order-row"
                    style={{
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <strong>{slot.label}</strong>
                      <span
                        className="muted"
                        style={{ display: 'block', fontSize: '13px', marginTop: '2px' }}
                      >
                        {slot.zoneName} · Ocupação: {slot.occupied}/
                        {slot.capacity} pedidos
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0,
                      }}
                    >
                      <StatusBadge tone={slot.active ? 'success' : 'warning'}>
                        {slot.active ? 'Aberta' : 'Fechada'}
                      </StatusBadge>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => toggleSlot(slot.id, slot.active)}
                        className="button button-small button-secondary"
                      >
                        {slot.active ? 'Fechar' : 'Abrir'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form className="checkout-form" onSubmit={createSlot}>
                <h3>Publicar nova janela de entrega</h3>
                <div className="form-group-grid">
                  <label style={{ gridColumn: '1 / -1' }}>
                    Zona vinculada
                    <select
                      value={slotZoneId}
                      onChange={(e) => setSlotZoneId(e.target.value)}
                    >
                      {data.zones.map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label style={{ gridColumn: '1 / -1' }}>
                    Rótulo de dia e horário
                    <input
                      required
                      value={slotLabel}
                      onChange={(e) => setSlotLabel(e.target.value)}
                      placeholder="Ex.: Quinta-feira · 14h às 18h (Expresso)"
                    />
                  </label>
                  <label style={{ gridColumn: '1 / -1' }}>
                    Capacidade máxima de pedidos
                    <input
                      required
                      type="number"
                      min={1}
                      value={slotCapacity}
                      onChange={(e) => setSlotCapacity(e.target.value)}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="button button-primary"
                >
                  Publicar janela no checkout
                </button>
              </form>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

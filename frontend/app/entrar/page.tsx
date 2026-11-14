'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui';
import { auth, saveSession } from '@/lib/api';
import {
  DEMO_CREDENTIALS,
  DEMO_PRODUCER_CREDENTIALS,
} from '@/lib/mock-data';

export default function Entrar() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const session = await auth.login({ email, password });
      saveSession(session);
      const next = new URLSearchParams(location.search).get('next');
      if (next) {
        router.push(next);
      } else if (session.user.role === 'producer') {
        router.push('/produtor');
      } else {
        router.push('/catalogo');
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page-main container">
        <section className="auth-card dashboard-card">
          <div className="stack-sm">
            <h1>Acesse sua conta Manà</h1>
            <p className="sandbox-notice" role="note">
              Demonstração local (senha {DEMO_CREDENTIALS.password}):
            </p>
            <div className="cluster-sm">
              <button
                type="button"
                onClick={() => {
                  setEmail(DEMO_CREDENTIALS.email);
                  setPassword(DEMO_CREDENTIALS.password);
                }}
                className="button button-small button-secondary"
              >
                Consumidor
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail(DEMO_PRODUCER_CREDENTIALS.email);
                  setPassword(DEMO_PRODUCER_CREDENTIALS.password);
                }}
                className="button button-small button-secondary"
              >
                Produtor
              </button>
            </div>
          </div>
          <form className="checkout-form" onSubmit={submit}>
            <label>
              Email
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
              />
            </label>
            <label>
              Senha
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </label>
            {error && (
              <p className="danger-text" role="alert">
                {error}
              </p>
            )}
            <button
              disabled={loading}
              className="button button-primary button-full"
            >
              {loading ? 'Entrando…' : 'Entrar na conta'}
            </button>
          </form>
          <p className="muted auth-footer">
            Ainda não tem conta?{' '}
            <Link className="text-link" href="/criar-conta">
              Cadastre-se gratuitamente
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui';
import { auth, saveSession } from '@/lib/api';
import { DEMO_CREDENTIALS } from '@/lib/mock-data';

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
      saveSession(await auth.login({ email, password }));
      const next = new URLSearchParams(location.search).get('next');
      router.push(next || '/catalogo');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="page-main container narrow">
        <div className="breadcrumb">
          <Link href="/">Início</Link>
          <span>/</span>Entrar
        </div>
        <section className="auth-card dashboard-card">
          <p className="sandbox-notice" role="note">
            Demonstração local: <strong>{DEMO_CREDENTIALS.email}</strong> · senha:{' '}
            <strong>{DEMO_CREDENTIALS.password}</strong>
          </p>
          <h1>Acesse sua conta AgriTech</h1>
          <p className="lead">Gerencie suas compras locais, sacola ativa e histórico de entregas.</p>
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

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui';
import { auth, saveSession } from '@/lib/api';

export default function CriarConta() {
  const router = useRouter();

  const [f, setF] = useState({ email: '', cpf: '', password: '' }),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      saveSession(await auth.register(f));
      router.push('/catalogo');
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
          <span>/</span>Criar conta
        </div>
        <section className="auth-card dashboard-card">
          <h1>Cadastre-se no AgriTech</h1>
          <p className="lead">
            Crie sua conta para montar sua sacola semanal e apoiar pequenos produtores rurais.
          </p>
          <form className="checkout-form" onSubmit={submit}>
            <label>
              Email
              <input
                required
                type="email"
                value={f.email}
                onChange={(e) => setF({ ...f, email: e.target.value })}
                placeholder="seu.email@exemplo.com"
              />
            </label>
            <label>
              CPF
              <input
                required
                value={f.cpf}
                onChange={(e) => setF({ ...f, cpf: e.target.value })}
                placeholder="000.000.000-00"
              />
            </label>
            <label>
              Senha<small>Mínimo de 8 caracteres</small>
              <input
                required
                minLength={8}
                type="password"
                value={f.password}
                onChange={(e) => setF({ ...f, password: e.target.value })}
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
              {loading ? 'Criando sua conta…' : 'Finalizar cadastro'}
            </button>
          </form>
          <p className="muted auth-footer">
            Já tem uma conta cadastrada?{' '}
            <Link className="text-link" href="/entrar">
              Entrar
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}

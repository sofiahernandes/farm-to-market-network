'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/ui';
import { auth, saveSession } from '@/lib/api';
import { DEMO_CPF } from '@/lib/mock-data';

export default function CriarConta() {
  const router = useRouter();

  const [f, setF] = useState({
      role: 'consumer' as 'consumer' | 'producer',
      displayName: '',
      email: '',
      cpf: DEMO_CPF,
      password: '',
    }),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const session = await auth.register(f);
      saveSession(session);
      router.push(session.user.role === 'producer' ? '/produtor' : '/catalogo');
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
        <div className="breadcrumb">
          <Link href="/">Início</Link>
          <span>/</span>Criar conta
        </div>
        <section className="auth-card dashboard-card">
          <p className="sandbox-notice" role="note">
            CPF de teste válido pré-preenchido: <strong>{DEMO_CPF}</strong>
          </p>
          <h1>Cadastre-se no AgriTech</h1>
          <p className="lead">
            Escolha seu perfil para comprar direto da colheita ou comercializar a produção do seu sítio.
          </p>
          <form className="checkout-form" onSubmit={submit}>
            <label>
              Perfil da conta
              <select
                value={f.role}
                onChange={(e) =>
                  setF({
                    ...f,
                    role: e.target.value as 'consumer' | 'producer',
                  })
                }
              >
                <option value="consumer">Consumidor (comprar alimentos e assinar cestas)</option>
                <option value="producer">Produtor Rural (publicar ofertas e gerenciar colheita)</option>
              </select>
            </label>
            {f.role === 'producer' && (
              <label>
                Nome da propriedade ou sítio
                <input
                  required
                  value={f.displayName}
                  onChange={(e) =>
                    setF({ ...f, displayName: e.target.value })
                  }
                  placeholder="Ex: Sítio Boa Terra"
                />
              </label>
            )}
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

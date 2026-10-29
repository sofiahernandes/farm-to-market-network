import Link from 'next/link';
import { Footer, Header, SectionHeading } from '@/components/ui';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div>
              <div className="hero-kicker">
                <span className="pulse-dot" /> Alimentação local, com clareza
              </div>
              <h1>
                Do campo à sua porta, <em>sem atalhos.</em>
              </h1>
              <p className="hero-lead">
                Encontre produtos e cestas fixas de pequenos produtores da sua
                região. Você escolhe com calma, acompanha cada etapa e recebe na
                janela combinada.
              </p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/catalogo">
                  Explorar ofertas <span>↗</span>
                </Link>
                <Link className="text-link" href="#como-funciona">
                  Como funciona <span>↓</span>
                </Link>
              </div>
              <div className="hero-note">
                <span className="avatar-stack" aria-hidden="true">
                  <i>🌱</i>
                  <i>🥕</i>
                  <i>🍅</i>
                </span>
                <span>
                  <strong>Pequenos produtores, grandes cuidados.</strong>
                  <br />
                  <span className="muted">
                    Ofertas com origem e disponibilidade visíveis
                  </span>
                </span>
              </div>
            </div>
            <div
              className="hero-visual"
              aria-label="Ilustração de uma cesta de alimentos frescos"
            >
              <div className="sun-shape" />
              <div className="hero-sticker">
                colheita
                <br />
                <strong>da semana</strong>
              </div>
              <div className="basket">
                🥬<span>🍅</span>
                <b>🥕</b>
                <small>🌿</small>
              </div>
              <div className="visual-caption">
                <span>01</span>
                <strong>Escolha local</strong>
                <span className="line" />
                <span>com data e origem</span>
              </div>
            </div>
          </div>
        </section>
        <section className="trust-strip">
          <div className="container trust-grid">
            <span>Feito para o seu bairro</span>
            <span>•</span>
            <span>Sem promessas vazias</span>
            <span>•</span>
            <span>Gateway de pagamento fake sandbox</span>
          </div>
        </section>
        <section id="como-funciona" className="section container">
          <SectionHeading
            eyebrow="Um jeito mais simples"
            title="Você sabe o que compra, de quem vem e quando chega."
          />
          <div className="steps-grid">
            <div className="step">
              <span>01</span>
              <h3>Explore</h3>
              <p>
                Veja ofertas elegíveis para sua região, com preço, unidade e
                disponibilidade.
              </p>
            </div>
            <div className="step">
              <span>02</span>
              <h3>Escolha</h3>
              <p>
                Monte sua sacola ou assine uma cesta fixa com itens e preço
                definidos.
              </p>
            </div>
            <div className="step">
              <span>03</span>
              <h3>Acompanhe</h3>
              <p>
                Escolha uma janela e acompanhe o pedido até a entrega na sua
                porta.
              </p>
            </div>
          </div>
        </section>
        <section id="produtores" className="section section-soft">
          <div className="container">
            <SectionHeading
              eyebrow="Da nossa rede"
              title="Ofertas que respeitam a estação."
            >
              <Link className="text-link" href="/catalogo">
                Ver catálogo completo ↗
              </Link>
            </SectionHeading>
            <p className="lead">
              Consulte as ofertas persistidas no catálogo e veja origem,
              unidade, preço e disponibilidade.
            </p>
          </div>
        </section>
        <section id="ajuda" className="cta-section container">
          <div>
            <div className="eyebrow">Para quem produz</div>
            <h2>Compre de quem produz perto de você.</h2>
            <p>
              Explore ofertas persistidas com origem, unidade, preço e
              disponibilidade claros.
            </p>
          </div>
          <Link className="button button-light" href="/catalogo">
            Explorar ofertas ↗
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}

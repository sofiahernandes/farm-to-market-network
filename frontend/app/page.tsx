import Link from 'next/link';
import { Footer, Header } from '@/components/ui';
import {
  ArrowRightIcon,
  BasketIcon,
  CalendarIcon,
  PackageIcon,
  ShieldCheckIcon,
  SproutIcon,
  TruckIcon,
} from '@/components/icons';

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="hero-content">
              <h1>
                Do campo à sua porta, com origem e colheita transparentes.
              </h1>
              <p className="hero-lead">
                Conectamos consumidores a produtores rurais locais. Alimentos
                frescos da safra, sem intermediários excessivos, com rastreabilidade
                clara do produtor até a sua mesa.
              </p>
              <div className="hero-actions">
                <Link className="button button-primary" href="/catalogo">
                  <span>Explorar ofertas da semana</span>
                  <ArrowRightIcon size={16} />
                </Link>
                <Link className="button button-secondary" href="#como-funciona">
                  <span>Como funciona</span>
                </Link>
              </div>
              <div className="hero-highlights">
                <div className="highlight-item">
                  <SproutIcon size={18} />
                  <span>Produtores locais identificados</span>
                </div>
                <div className="highlight-item">
                  <CalendarIcon size={18} />
                  <span>Colheita sob demanda</span>
                </div>
                <div className="highlight-item">
                  <TruckIcon size={18} />
                  <span>Entregas em janelas programadas</span>
                </div>
              </div>
            </div>

            <div className="hero-visual" aria-label="Painel de ofertas da colheita semanal">
              <div className="harvest-board">
                <div className="harvest-board-header">
                  <div>
                    <span className="harvest-board-tag">Distribuição Regional</span>
                    <h2>Colheita da Semana</h2>
                  </div>
                  <span className="harvest-status-live">
                    <span className="status-dot" />
                    Pedidos abertos
                  </span>
                </div>

                <div className="harvest-items">
                  <div className="harvest-item">
                    <div className="harvest-item-icon">
                      <PackageIcon size={22} />
                    </div>
                    <div className="harvest-item-info">
                      <div className="harvest-item-top">
                        <strong>Cesta Agroecológica Familiar</strong>
                        <span className="harvest-price">R$ 68,00</span>
                      </div>
                      <p>Sítio das Paineiras · 5,8 kg de verduras e raízes da estação</p>
                    </div>
                  </div>

                  <div className="harvest-item">
                    <div className="harvest-item-icon">
                      <SproutIcon size={22} />
                    </div>
                    <div className="harvest-item-info">
                      <div className="harvest-item-top">
                        <strong>Folhagens & Ervas Frescas</strong>
                        <span className="harvest-price">R$ 24,00</span>
                      </div>
                      <p>Horta Vale Verde · Maço selecionado colhido no dia</p>
                    </div>
                  </div>

                  <div className="harvest-item">
                    <div className="harvest-item-icon">
                      <BasketIcon size={22} />
                    </div>
                    <div className="harvest-item-info">
                      <div className="harvest-item-top">
                        <strong>Ovos Caipiras de Pasto</strong>
                        <span className="harvest-price">R$ 18,50</span>
                      </div>
                      <p>Granja Santa Clara · Dúzia selecionada, aves livres</p>
                    </div>
                  </div>
                </div>

                <div className="harvest-board-footer">
                  <div className="harvest-delivery-note">
                    <CalendarIcon size={16} />
                    <span>Próxima rota de entrega: Terça-feira, 08h–12h</span>
                  </div>
                  <Link href="/catalogo" className="harvest-explore-link">
                    <span>Ver todas as ofertas</span>
                    <ArrowRightIcon size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <div className="container trust-grid">
            <div className="trust-cell">
              <SproutIcon size={18} />
              <span>Agricultura familiar e regional</span>
            </div>
            <div className="trust-cell">
              <ShieldCheckIcon size={18} />
              <span>Preço transparente sem taxas ocultas</span>
            </div>
            <div className="trust-cell">
              <TruckIcon size={18} />
              <span>Janelas de entrega confirmadas</span>
            </div>
            <div className="trust-cell">
              <CalendarIcon size={18} />
              <span>Ambiente sandbox para testes</span>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="section container">
          <div className="section-header-compact">
            <h2>Você sabe o que compra, de quem vem e quando chega.</h2>
            <p className="lead">
              Sem surpresas na entrega e sem complicações. Um fluxo direto do produtor rural para você.
            </p>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num">1</div>
              <h3>Explore a safra atual</h3>
              <p>
                Consulte as ofertas ativas na sua região com informação clara de produtor,
                preço por unidade e estoque real disponível.
              </p>
            </div>
            <div className="step-card">
              <div className="step-num">2</div>
              <h3>Monte sua sacola de itens</h3>
              <p>
                Escolha itens avulsos ou cestas compostas de acordo com a necessidade da sua casa,
                sem fidelidade forçada.
              </p>
            </div>
            <div className="step-card">
              <div className="step-num">3</div>
              <h3>Receba fresco em sua porta</h3>
              <p>
                Os produtores colhem especialmente para o lote do dia e entregam na janela combinada
                diretamente no seu endereço.
              </p>
            </div>
          </div>
        </section>

        <section id="produtores" className="section section-soft">
          <div className="container">
            <div className="network-banner">
              <div>
                <h2>Ofertas que respeitam o ciclo natural da terra.</h2>
                <p className="lead">
                  Ao comprar pelo AgriTech, você apoia produtores familiares locais e garante alimentos
                  mais saborosos e nutritivos.
                </p>
              </div>
              <Link className="button button-primary" href="/catalogo">
                <span>Conferir catálogo completo</span>
                <ArrowRightIcon size={16} />
              </Link>
            </div>
          </div>
        </section>

        <section id="ajuda" className="section container">
          <div className="cta-section">
            <div className="cta-copy">
              <h2>Alimentos saudáveis com comércio justo.</h2>
              <p>
                Acompanhe a sua sacola e veja como é fácil receber alimentos de alta qualidade
                com origem garantida.
              </p>
            </div>
            <div className="cta-actions">
              <Link className="button button-light" href="/catalogo">
                <span>Explorar ofertas</span>
                <ArrowRightIcon size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

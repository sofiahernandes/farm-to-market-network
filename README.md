<div align="center">
  <h1>AgriTech</h1>
  <p>Farm-to-Market Agricultural Network: Connecting family <br/>
  agriculture directly to urban consumers and retailers.
  </p>
</div>

<br/>

### What it is

AgriTech is a hybrid agricultural marketplace and logistics platform designed to optimize end-to-end distribution between small-scale family farmers, urban households, and local businesses.

By replacing traditional, static collection points and eliminating predatory intermediaries ("atravessadores"), AgriTech establishes a dynamic, direct distribution network with fair profit margins for producers and affordable, freshly harvested food for consumers.

The platform operates across three main pillars:

1. Direct-to-Consumer (B2C) Subscriptions: Urban consumers subscribe to periodic (weekly or monthly) baskets of fresh, organic, and seasonal produce delivered directly to their doorsteps, customizable by items, frequency, and delivery windows.
2. Regional Wholesale (B2B): Local restaurants, grocery stores (_hortifrútis_), and markets purchase fresh harvest in bulk directly from rural producers, establishing predictable purchase volumes and absorbing seasonal harvest surpluses.
3. Smart Logistics & Route Optimization: An intelligent operations layer aggregates orders, dynamically groups deliveries by urban sectors (North, South, East, and West zones), and coordinates farm gate pickups to doorstep deliveries.

<br/>

### Why it exists

Brazil's food supply chain suffers from severe structural bottlenecks that penalize those who plant and those who eat:

- Income Disparity: According to the IBGE Agricultural Census, family farming represents approximately 77% of all agricultural establishments in Brazil, yet these families retain only 23% of the total agricultural income generated in the country.
- The Middleman "Toll" (_O Pedágio do Intermediário_): Smallholder farmers often lack the logistical scale, dedicated refrigerated vehicles, or time to sell directly in urban centers. As academic studies (such as those from UFRA) demonstrate, this vulnerability leaves farmers held hostage by middlemen at the farm gate, who unilaterally dictate rock-bottom purchase prices and capture the vast majority of resale margins.
- Critical Post-Harvest Food Loss: Embrapa reports that post-harvest losses of fresh fruits and vegetables in Brazil reach between 40% and 50% of total production. This massive waste happens precisely in the bottleneck between the farm gate and urban centers due to inadequate cold storage and delayed commercialization.

> _"Connecting the productive base directly to the final market is the only way to save food from the trash and guarantee financial fairness for those who plant."_

AgriTech aligns supply with actual demand, ensuring every crop harvested has a guaranteed buyer and shortening the farm-to-table transit time.

<br/>

---

### Platform Modules & Sitemap

The platform is organized into four dedicated operational scopes:

```
AgriTech
│
├── Institutional Portal (/)
│   ├── Landing Page & Hero
│   ├── The Problem in Numbers (IBGE & Embrapa Data)
│   ├── How It Works ("Do campo à porta")
│   ├── For Producers & For Consumers
│   └── Social & Environmental Impact Metrics
│
├── Consumer Marketplace (/app - B2C)
│   ├── Explore Producers & Fresh Harvest (Zone & Category Filters)
│   ├── Ready & Custom Baskets (Fruit, Organic, Vegetable, Mixed)
│   ├── Subscription Configurator (Weekly / Monthly, Delivery Windows)
│   ├── Checkout & Flexible Recurring Billing (Credit Card, PIX)
│   ├── Subscriber Dashboard (Live Order Status, History, Pause / Cancel)
│   └── "My Impact" (Metric of food waste prevented & producer transparency)
│
├── Producer Hub (/produtor)
│   ├── Main Dashboard (Monthly revenue, retained R$, forecasted demand)
│   ├── Supply & Harvest Management (Weekly stock inputs, batch statuses)
│   ├── Product & Crop Catalog (Photos, pricing, MOQ, organic certification)
│   ├── Harvest Fulfillment Queue (Volume confirmation, lot label printing)
│   ├── Proposal Tickets (Deliberate custom volume and price offers from buyers)
│   └── Financial Statement (Direct split payout records)
│
└── Operations & Logistics (/admin)
    ├── Operational Overview (Deliveries today, open exceptions, avoided losses)
    ├── Route Planning & Sectorization (Interactive map, urban zone clustering)
    ├── Order & Subscription Consolidation
    └── Performance Scorecards & Supply Chain BI
```

<br/>

---

### Key Features

#### 1. Flexible Basket Builder & Subscriptions (B2C)

- Select from curated seasonal baskets (Fruit, Organic, Vegetable, Mixed) or build a custom basket.
- Swap unwanted items and append seasonal add-ons.
- Choose preferred delivery days and timeslots with transparent recurring billing.
- Self-service subscription controls: pause temporarily or cancel anytime up to 7 days prior to delivery.

#### 2. Wholesale Catalog & MOQ Rules (B2B)

- Bulk ordering for restaurants and supermarkets with clearly defined Minimum Order Quantities (MOQ).
- Filter by harvest date, availability, and specific regional cooperatives.
- Invoicing and corporate payment options (bank slip, PIX, corporate card).

#### 3. Commercial Proposal Tickets

- Buyers can send a Proposal Ticket directly from product listings to request customized quantities or negotiate prices for volume orders.
- Producers manage tickets centrally (Pending, Accepted, Rejected) with a 3-click workflow, including an optional explanatory note.
- Approved tickets automatically convert into checkout items in the buyer's cart.

#### 4. Zone-Based Route Clustering & Live Tracking

- Automated route grouping dividing urban destinations into North, South, East, and West delivery corridors.
- Multi-stage order tracking:
  - `Em preparação na fazenda` (Preparing at farm)
  - `A caminho` (In transit)
  - `Entregue` (Delivered)
- End-consumer receipt confirmation to ensure supply chain integrity.

#### 5. Automated Financial Split

- Direct split payment engine built with PCI-DSS compliance.
- Platform fee is automatically deducted while net proceeds are transferred directly to the family farmer's account.

<br/>

---

### User Personas

The system design was modeled around real user personas identified during requirements elicitation:

| Persona                  | Role                           | Core Need & Impact                                                                                                                                                                                     |
| :----------------------- | :----------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Seu Francisco (58 yrs)   | Small Family Farmer            | Cultivates greens in the green belt. Uses the Producer Dashboard and Forecasted Demand tab to harvest only confirmed orders, cutting post-harvest losses to zero and eliminating middleman price cuts. |
| Marina Costa (28 yrs)    | Agronomist & Farm Manager      | Manages a 100% organic family property. Uploads organic certifications directly to the platform and uses demand projections to safely invest in new greenhouse structures.                             |
| Jordana Alves (34 yrs)   | Systems Analyst (Consumer)     | Seeks fresh, pesticide-free food for her family. Subscribes to the Weekly Family Basket, tracks deliveries in real-time, and monitors her direct social impact through the "Meu Impacto" panel.        |
| Carlos Mendes (45 yrs)   | Restaurant Owner (B2B Buyer)   | Requires consistent, high-volume deliveries of fresh vegetables. Uses regional wholesale to buy directly from growers, scheduling precise unloading windows and supporting local agriculture.          |
| Dona Lurdes (62 yrs)     | Rural Producer (Fruits & Jams) | Produces seasonal fruit and artisanal preserves. Uses the simplified mobile interface to publish harvest stock, boosting family revenue by selling straight to consumers and restaurants.              |
| Ricardo Valente (35 yrs) | Logistics & Operations Manager | Oversees urban distribution routes, resolves fulfillment exceptions, and analyzes supply-demand metrics to build predictive planting models.                                                           |

<br/>

---

### Tech Stack & Architecture

- Frontend: [Next.js](https://nextjs.org/) (App Router), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), and [Tailwind CSS](https://tailwindcss.com/). Hosted on Vercel.
- Backend: RESTful JSON API hosted on Render.
- Database: PostgreSQL with strict ACID transactions to ensure inventory consistency and prevent overselling during peak traffic.
- Security & Standards:
  - JWT Authentication with automatic 2-hour session expiration.
  - End-to-end encryption in transit (HTTPS / TLS 1.3) and at rest (AES-256).
  - Strict Cross-Origin Resource Sharing (CORS) rules.
  - LGPD compliant data handling and transparent user data deletion.
- Design Principles:
  - Mobile-First Responsiveness: Compatible with Android 9.0+ and iOS 13+.
  - High-Contrast Outdoor UI: Designed with high contrast and legible typography for seamless use under direct sunlight in the field.
  - Performance: Sub-2s response times, lazy-loaded catalog pagination, and client-side media compression before upload.

<br/>

---

### Future Roadmap

1. Predictive Planting Intelligence:
   Machine learning algorithms crossing historical consumer demand patterns with soil and seasonal variables to provide rural producers with precise guidance on _what, when, and how much_ to plant. Every seed placed in the soil will have a guaranteed buyer.
2. Autonomous Drone Delivery:
   Exploring aerial drone dispatch for rapid transit of high-perishability products across challenging rural terrains and congested urban belts.

<br/>

---

## How to run it locally

### 0. Prerequisites

- [Node.js](https://nodejs.org/) (version 18.x or later recommended)
- [npm](https://www.npmjs.com/) or [Yarn](https://classic.yarnpkg.com/lang/en/)
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/sofiahernandes/farm-to-market-network.git
cd farm-to-market-network
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
# or
yarn install
```

### 3. Start the Development Server

```bash
npm run dev
# or
yarn dev
```

### 4. Open in Your Browser

Visit [http://localhost:3000](http://localhost:3000) to view the application running locally.

<br/>

---

## License

<a href="https://github.com/sofiahernandes/farm-to-market-network">AgriTech</a> © 2026 by <a href="https://github.com/analicecoimbra">Analice Coimbra Carneiro</a>, <a href="https://github.com/alicelobwp">Mariah Alice Pimentel Lôbo Pereira</a>, <a href="https://github.com/sofiahernandes">Sofia Botechia Hernandes</a> and <a href="https://github.com/viick04">Victória Duarte Vieira Azevedo</a> is licensed under [MIT](LICENSE).

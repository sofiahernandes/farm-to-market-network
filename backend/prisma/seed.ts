import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash } from 'crypto';

function hashCpf(cpf: string): string {
  return createHash('sha256').update(cpf.replace(/\D/g, '')).digest('hex');
}

export async function seedDatabase(externalDb?: PrismaClient) {
  const db = externalDb ?? new PrismaClient();
  const shouldDisconnect = !externalDb;

  try {
    const passwordHash = await bcrypt.hash('mana123', 10);

    // Clean transactional/ephemeral tables first so re-seeding always restores a clean initial state
    await db.inventoryAllocation.deleteMany();
    await db.orderStatusHistory.deleteMany();
    await db.payment.deleteMany();
    await db.delivery.deleteMany();
    await db.orderItem.deleteMany();
    await db.subscriptionCycle.deleteMany();
    await db.subscription.deleteMany();
    await db.order.deleteMany();
    await db.cartItem.deleteMany();
    await db.cart.deleteMany();
    await db.lgpdDeletionRequest.deleteMany();
    await db.operationalException.deleteMany();
    await db.auditLog.deleteMany();
    await db.manualRoute.deleteMany();
    await db.address.deleteMany();
    await db.deliverySlot.deleteMany();
    await db.serviceZone.deleteMany();
    await db.basket.deleteMany();
    await db.inventory.deleteMany();
    await db.product.deleteMany();
    await db.producerCertification.deleteMany();
    await db.producer.deleteMany();
    await db.user.deleteMany();

    // 1. Demo Users (Consumer, Producer, Operations)
    const consumer = await db.user.create({
      data: {
        id: 'mock-consumer',
        email: 'jornada@mana.local',
        cpfHash: hashCpf('52998224725'),
        maskedCpf: '***.982.247-25',
        passwordHash,
        role: 'consumer',
      },
    });

    const producerUser = await db.user.create({
      data: {
        id: 'user-producer',
        email: 'produtor@mana.local',
        cpfHash: hashCpf('12345678909'),
        maskedCpf: '***.482.299-26',
        passwordHash,
        role: 'producer',
      },
    });

    await db.user.create({
      data: {
        id: 'user-ops',
        email: 'operacoes@mana.local',
        cpfHash: hashCpf('98765432100'),
        maskedCpf: '***.550.250-97',
        passwordHash,
        role: 'operations',
      },
    });

    // 2. Producer & Certifications
    const producer = await db.producer.create({
      data: {
        id: 'sitio-verde',
        displayName: 'Sítio Verde · Agricultura Familiar',
        city: 'Ibiúna',
        state: 'SP',
        story:
          'Propriedade familiar de 6 hectares dedicada a hortaliças orgânicas e cestas agroecológicas colhidas na véspera da entrega.',
        legalIdMasked: '***.982.247-25 · DAP/CAF Ativo',
        onboardingStatus: 'approved',
        paymentAccountConnected: true,
        splitFeatureFlagEnabled: false,
        platformFeePercent: 10,
      },
    });

    await db.producerCertification.createMany({
      data: [
        {
          id: 'cert-opac',
          producerId: producer.id,
          name: 'Certificação Orgânica Participativa (OPAC)',
          issuer: 'Rede Agroecológica Regional',
          validUntil: '2027-08-15',
          status: 'valid',
        },
        {
          id: 'cert-caf',
          producerId: producer.id,
          name: 'Cadastro Nacional da Agricultura Familiar (CAF)',
          issuer: 'MDA · Governo Federal',
          validUntil: '2027-03-30',
          status: 'valid',
        },
      ],
    });

    // 3. Service Zones
    const zoneCentroSul = await db.serviceZone.create({
      data: {
        id: 'zone-centro-sul',
        name: 'Zona Centro-Sul · Piloto',
        postalCodePrefix: '01310',
        city: 'São Paulo',
        cutoffHours: 36,
        active: true,
        producerId: producer.id,
      },
    });

    const zoneOeste = await db.serviceZone.create({
      data: {
        id: 'zone-oeste',
        name: 'Zona Oeste · Pinheiros/Butantã',
        postalCodePrefix: '05400',
        city: 'São Paulo',
        cutoffHours: 36,
        active: true,
        producerId: producer.id,
      },
    });

    // 4. Delivery Slots
    const slot1 = await db.deliverySlot.create({
      data: {
        id: 'seed-slot',
        zoneId: zoneCentroSul.id,
        label: 'Quarta-feira · 08h às 12h (Colheita de terça)',
        startsAt: new Date('2026-11-18T11:00:00.000Z'),
        endsAt: new Date('2026-11-18T15:00:00.000Z'),
        capacity: 50,
        active: true,
      },
    });

    await db.deliverySlot.create({
      data: {
        id: 'slot-quinta-tarde',
        zoneId: zoneCentroSul.id,
        label: 'Quinta-feira · 14h às 18h (Colheita de quinta)',
        startsAt: new Date('2026-11-19T17:00:00.000Z'),
        endsAt: new Date('2026-11-19T21:00:00.000Z'),
        capacity: 30,
        active: true,
      },
    });

    await db.deliverySlot.create({
      data: {
        id: 'slot-sabado-manha',
        zoneId: zoneOeste.id,
        label: 'Sábado · 08h às 12h (Especial Feira do Produtor)',
        startsAt: new Date('2026-11-21T11:00:00.000Z'),
        endsAt: new Date('2026-11-21T15:00:00.000Z'),
        capacity: 25,
        active: true,
      },
    });

    // 5. Products & Weekly Inventory
    const familiarItems = [
      {
        productId: 'mock-alface',
        name: 'Alface crespa hidropônica',
        quantity: '2 maços',
        origin: 'Sítio Verde',
        category: 'Hortaliças',
      },
      {
        name: 'Couve manteiga orgânica',
        quantity: '1 maço',
        origin: 'Sítio Verde',
        category: 'Hortaliças',
      },
      {
        productId: 'mock-tomate',
        name: 'Tomate italiano maduro',
        quantity: '1 kg',
        origin: 'Sítio Verde',
        category: 'Hortaliças',
      },
      {
        productId: 'mock-cenoura',
        name: 'Cenoura orgânica com rama',
        quantity: '700 g',
        origin: 'Sítio Verde',
        category: 'Raízes',
      },
      {
        name: 'Batata-doce rosada',
        quantity: '800 g',
        origin: 'Sítio Verde',
        category: 'Raízes',
      },
      {
        name: 'Banana prata climatizada',
        quantity: '1 dúzia',
        origin: 'Chácara Sol',
        category: 'Frutas',
      },
      {
        name: 'Cheiro-verde (salsinha e cebolinha)',
        quantity: '1 maço',
        origin: 'Sítio Verde',
        category: 'Temperos',
      },
      {
        productId: 'mock-ovos',
        name: 'Ovos caipiras de galinhas livres',
        quantity: '1 dúzia',
        origin: 'Granja Livre',
        category: 'Granja',
      },
    ];

    const individualItems = [
      {
        productId: 'mock-alface',
        name: 'Alface americana orgânica',
        quantity: '1 pé',
        origin: 'Sítio Verde',
        category: 'Hortaliças',
      },
      {
        name: 'Rúcula selvagem',
        quantity: '1 maço',
        origin: 'Sítio Verde',
        category: 'Hortaliças',
      },
      {
        productId: 'mock-tomate',
        name: 'Tomate cereja doce',
        quantity: '400 g',
        origin: 'Sítio Verde',
        category: 'Hortaliças',
      },
      {
        productId: 'mock-cenoura',
        name: 'Cenoura baby orgânica',
        quantity: '500 g',
        origin: 'Sítio Verde',
        category: 'Raízes',
      },
      {
        productId: 'mock-morango',
        name: 'Morango fresco de estufa',
        quantity: '1 bandeja (300 g)',
        origin: 'Vale Fértil',
        category: 'Frutas',
      },
    ];

    const agroItems = [
      {
        productId: 'mock-alface',
        name: 'Mix de folhas (alface, rúcula e agrião)',
        quantity: '3 maços',
        origin: 'Sítio Verde',
        category: 'Hortaliças',
      },
      {
        name: 'Brócolis ninja',
        quantity: '2 cabeças',
        origin: 'Sítio Verde',
        category: 'Hortaliças',
      },
      {
        productId: 'mock-tomate',
        name: 'Tomate italiano de rama',
        quantity: '1,5 kg',
        origin: 'Sítio Verde',
        category: 'Hortaliças',
      },
      {
        name: 'Mandioca descascada a vácuo',
        quantity: '1 kg',
        origin: 'Sítio Verde',
        category: 'Raízes',
      },
      {
        productId: 'mock-cenoura',
        name: 'Beterraba e cenoura orgânicas',
        quantity: '1,2 kg',
        origin: 'Sítio Verde',
        category: 'Raízes',
      },
      {
        productId: 'mock-morango',
        name: 'Morango e frutas cítricas da época',
        quantity: '1,2 kg',
        origin: 'Vale Fértil',
        category: 'Frutas',
      },
      {
        productId: 'mock-ovos',
        name: 'Ovos caipiras vermelhos',
        quantity: '1 dúzia',
        origin: 'Granja Livre',
        category: 'Granja',
      },
      {
        name: 'Ervas frescas (manjericão, alecrim e hortelã)',
        quantity: '2 maços',
        origin: 'Sítio Verde',
        category: 'Temperos',
      },
    ];

    const productSeeds = [
      {
        id: 'mock-cesta',
        name: 'Cesta da semana · Colheita completa',
        description:
          'Seleção de 8 itens frescos da estação: folhas verdes, raízes, legumes, ovos caipiras e temperos recém-colhidos para a semana da família.',
        category: 'Cestas',
        unit: 'cesta (4,5 kg)',
        priceCents: 6490,
        available: 12,
        lowStockThreshold: 5,
        certification: 'Orgânico Participativo (OPAC)',
        seasonality: 'Ano todo · Composição sazonal',
        basketItemsJson: JSON.stringify(familiarItems),
      },
      {
        id: 'mock-cesta-individual',
        name: 'Cesta Individual · Essencial da Horta',
        description:
          'Seleção compacta com 5 itens orgânicos frescos para 1 a 2 pessoas.',
        category: 'Cestas',
        unit: 'cesta (2,5 kg)',
        priceCents: 4490,
        available: 18,
        lowStockThreshold: 5,
        certification: 'Orgânico Participativo (OPAC)',
        seasonality: 'Ano todo · Colheita semanal',
        basketItemsJson: JSON.stringify(individualItems),
      },
      {
        id: 'mock-cesta-agro',
        name: 'Cesta Agroecológica Completa · Grande Família',
        description:
          'Seleção abundante com 11 itens de agricultura familiar regenerativa.',
        category: 'Cestas',
        unit: 'cesta (7 kg)',
        priceCents: 9290,
        available: 9,
        lowStockThreshold: 4,
        certification: 'Orgânico Brasil · Auditoria',
        seasonality: 'Safra de Outono/Inverno',
        basketItemsJson: JSON.stringify(agroItems),
      },
      {
        id: 'mock-tomate',
        name: 'Tomate italiano de rama',
        description:
          'Colhido maduro na véspera da entrega, polpa firme e adocicada, ideal para molhos lentos e saladas.',
        category: 'Hortaliças',
        unit: 'kg',
        priceCents: 1390,
        available: 28,
        lowStockThreshold: 8,
        certification: 'Sem agrotóxicos · Transição agroecológica',
        seasonality: 'Safra plena',
        basketItemsJson: null,
      },
      {
        id: 'mock-alface',
        name: 'Alface crespa hidropônica',
        description:
          'Folhas crocantes e lavadas na fonte, cultivadas sem agrotóxicos em estufa familiar protegida.',
        category: 'Hortaliças',
        unit: 'maço (250 g)',
        priceCents: 650,
        available: 34,
        lowStockThreshold: 10,
        certification: 'Cultivo protegido sem defensivos',
        seasonality: 'Ano todo',
        basketItemsJson: null,
      },
      {
        id: 'mock-ovos',
        name: 'Ovos caipiras de galinhas livres',
        description:
          'Dúzia de ovos de postura a pasto, gemas alaranjadas e alimentação vegetal controlada.',
        category: 'Granja',
        unit: 'dúzia',
        priceCents: 1890,
        available: 16,
        lowStockThreshold: 6,
        certification: 'Bem-estar animal · Pastoreio livre',
        seasonality: 'Postura diária',
        basketItemsJson: null,
      },
      {
        id: 'mock-morango',
        name: 'Morango fresco de estufa elevada',
        description:
          'Morangos doces e aromáticos colhidos no ponto certo, sem resíduos químicos.',
        category: 'Frutas',
        unit: 'bandeja (300 g)',
        priceCents: 1490,
        available: 19,
        lowStockThreshold: 6,
        certification: 'Manejo biológico integrado',
        seasonality: 'Safra de clima ameno',
        basketItemsJson: null,
      },
      {
        id: 'mock-cenoura',
        name: 'Cenoura orgânica com rama',
        description:
          'Raízes jovens e adocicadas, perfeitas para assar inteiras ou ralar cruas; ramas aproveitáveis em pestos.',
        category: 'Raízes',
        unit: 'maço (700 g)',
        priceCents: 990,
        available: 5,
        lowStockThreshold: 6,
        certification: 'Orgânico Participativo (OPAC)',
        seasonality: 'Colheita semanal',
        basketItemsJson: null,
      },
    ];

    const deliveryRefDate = new Date('2026-11-18T11:00:00.000Z');
    for (const p of productSeeds) {
      await db.product.create({
        data: {
          id: p.id,
          producerId: producer.id,
          name: p.name,
          description: p.description,
          category: p.category,
          unit: p.unit,
          priceCents: p.priceCents,
          active: true,
          certification: p.certification,
          seasonality: p.seasonality,
          basketItemsJson: p.basketItemsJson,
        },
      });

      await db.inventory.create({
        data: {
          productId: p.id,
          deliveryDate: deliveryRefDate,
          available: p.available,
          reserved: 0,
          lowStockThreshold: p.lowStockThreshold,
        },
      });
    }

    // 6. Fixed Baskets
    const basketSeeds = [
      {
        id: 'basket-individual',
        slug: 'cesta-individual-horta',
        productId: 'mock-cesta-individual',
        name: 'Cesta Individual · Essencial da Horta',
        subtitle:
          'Ideal para 1 a 2 pessoas · 5 itens selecionados (aprox. 2,5 kg)',
        description:
          'Composição fixa semanal ou mensal com folhas lavadas, legumes da estação e fruta fresca.',
        priceCents: 4490,
        servesLabel: '1 a 2 pessoas',
        cutoffHours: 36,
        itemsJson: JSON.stringify(individualItems),
      },
      {
        id: 'basket-familiar',
        slug: 'cesta-familiar-colheita',
        productId: 'mock-cesta',
        name: 'Cesta da Semana · Colheita Completa',
        subtitle: 'Ideal para 3 a 4 pessoas · 8 itens variados (aprox. 4,5 kg)',
        description:
          'Nossa cesta fixa mais assinada: combina hortaliças folhosas, legumes de época, raízes, ovos caipiras e temperos frescos.',
        priceCents: 6490,
        servesLabel: '3 a 4 pessoas',
        cutoffHours: 36,
        itemsJson: JSON.stringify(familiarItems),
      },
      {
        id: 'basket-agroecologica',
        slug: 'cesta-agroecologica-completa',
        productId: 'mock-cesta-agro',
        name: 'Cesta Agroecológica · Grande Família',
        subtitle:
          'Ideal para 4 a 6 pessoas · 11 itens completos (aprox. 7 kg)',
        description:
          'Abundância direto do campo com diversidade de folhas, raízes, frutas da época, ovos de pasto e ervas aromáticas.',
        priceCents: 9290,
        servesLabel: '4 a 6 pessoas',
        cutoffHours: 48,
        itemsJson: JSON.stringify(agroItems),
      },
    ];

    for (const b of basketSeeds) {
      await db.basket.create({
        data: {
          id: b.id,
          slug: b.slug,
          productId: b.productId,
          producerId: producer.id,
          name: b.name,
          subtitle: b.subtitle,
          description: b.description,
          priceCents: b.priceCents,
          servesLabel: b.servesLabel,
          cutoffHours: b.cutoffHours,
          itemsJson: b.itemsJson,
          active: true,
        },
      });
    }

    // 7. Consumer Saved Address
    const defaultAddress = await db.address.create({
      data: {
        id: 'addr-1',
        userId: consumer.id,
        zoneId: zoneCentroSul.id,
        label: 'Casa · Bela Vista',
        isDefault: true,
        postalCode: '01310-100',
        street: 'Avenida Paulista',
        number: '1000',
        complement: 'Apto. 42',
        city: 'São Paulo',
        state: 'SP',
      },
    });

    // 8. Consumer Initial Cart
    const cart = await db.cart.create({
      data: { userId: consumer.id },
    });

    await db.cartItem.createMany({
      data: [
        { cartId: cart.id, productId: 'mock-cesta', quantity: 1 },
        { cartId: cart.id, productId: 'mock-tomate', quantity: 2 },
      ],
    });

    // 9. Manual Route
    const route1 = await db.manualRoute.create({
      data: {
        id: 'route-cs-01',
        name: 'Rota 01 · Centro-Sul Manhã',
        zoneId: zoneCentroSul.id,
        slotId: slot1.id,
        driverName: 'Carlos Mendes · VUC Refrigerado',
        status: 'open',
      },
    });

    // 10. Initial Orders (AG-1048 and AG-1037)
    const order1048 = await db.order.create({
      data: {
        id: 'AG-1048',
        userId: consumer.id,
        addressId: defaultAddress.id,
        deliverySlotId: slot1.id,
        routeId: route1.id,
        status: 'Em preparação',
        operationalStage: 'preparing',
        producerSeparated: false,
        totalCents: 8470,
        idempotencyKey: 'mock-AG-1048',
        createdAt: new Date('2026-10-28T13:00:00.000Z'),
      },
    });

    await db.orderItem.createMany({
      data: [
        {
          orderId: order1048.id,
          productId: 'mock-cesta',
          quantity: 1,
          unitPriceCents: 6490,
        },
        {
          orderId: order1048.id,
          productId: 'mock-cenoura',
          quantity: 2,
          unitPriceCents: 990,
        },
      ],
    });

    await db.payment.create({
      data: {
        orderId: order1048.id,
        provider: 'Pagamento sandbox',
        providerPaymentId: 'sandbox_AG-1048',
        status: 'approved',
        amountCents: 8470,
        idempotencyKey: 'pay-AG-1048',
      },
    });

    await db.delivery.create({
      data: {
        orderId: order1048.id,
        status: 'scheduled',
        confirmedAt: new Date('2026-10-28T13:00:00.000Z'),
      },
    });

    await db.orderStatusHistory.createMany({
      data: [
        {
          orderId: order1048.id,
          toStatus: 'Pedido confirmado',
          actor: 'Sistema',
          changedAt: new Date('2026-10-28T13:00:00.000Z'),
        },
        {
          orderId: order1048.id,
          toStatus: 'Em preparação',
          actor: 'Produtor',
          changedAt: new Date('2026-10-28T14:00:00.000Z'),
        },
      ],
    });

    const order1037 = await db.order.create({
      data: {
        id: 'AG-1037',
        userId: consumer.id,
        addressId: defaultAddress.id,
        deliverySlotId: slot1.id,
        status: 'Entregue',
        operationalStage: 'delivered',
        producerSeparated: true,
        totalCents: 7980,
        idempotencyKey: 'mock-AG-1037',
        createdAt: new Date('2026-10-21T13:00:00.000Z'),
      },
    });

    await db.orderItem.createMany({
      data: [
        {
          orderId: order1037.id,
          productId: 'mock-cesta',
          quantity: 1,
          unitPriceCents: 6490,
        },
        {
          orderId: order1037.id,
          productId: 'mock-morango',
          quantity: 1,
          unitPriceCents: 1490,
        },
      ],
    });

    await db.payment.create({
      data: {
        orderId: order1037.id,
        provider: 'Pagamento sandbox',
        providerPaymentId: 'sandbox_AG-1037',
        status: 'approved',
        amountCents: 7980,
        idempotencyKey: 'pay-AG-1037',
      },
    });

    await db.delivery.create({
      data: {
        orderId: order1037.id,
        status: 'delivered',
        confirmedAt: new Date('2026-10-21T14:00:00.000Z'),
      },
    });

    await db.orderStatusHistory.createMany({
      data: [
        {
          orderId: order1037.id,
          toStatus: 'Pedido confirmado',
          actor: 'Sistema',
          changedAt: new Date('2026-10-21T13:00:00.000Z'),
        },
        {
          orderId: order1037.id,
          toStatus: 'Entregue',
          actor: 'Operações',
          changedAt: new Date('2026-10-21T14:00:00.000Z'),
        },
      ],
    });

    // 11. Active Subscription (SUB-2041)
    const futureDelivery = new Date(Date.now() + 5 * 86400000);
    const futureBilling = new Date(Date.now() + 3 * 86400000);

    await db.subscription.create({
      data: {
        id: 'SUB-2041',
        userId: consumer.id,
        basketId: 'basket-familiar',
        addressId: defaultAddress.id,
        deliverySlotId: slot1.id,
        frequency: 'weekly',
        priceCents: 6490,
        status: 'active',
        cutoffHours: 36,
        nextBillingAt: futureBilling,
        nextDeliveryAt: futureDelivery,
        idempotencyKey: 'seed-sub-2041',
      },
    });

    await db.subscriptionCycle.create({
      data: {
        id: 'CYC-101',
        subscriptionId: 'SUB-2041',
        cycleKey: '2026-10-21',
        deliveryDate: new Date('2026-10-21T11:00:00.000Z'),
        billingDate: new Date('2026-10-19T11:00:00.000Z'),
        amountCents: 6490,
        status: 'confirmed',
        paymentStatus: 'approved',
        orderId: 'AG-1037',
        note: 'Ciclo entregue e confirmado.',
        createdAt: new Date('2026-10-19T11:00:00.000Z'),
      },
    });

    // 12. Operational Exception & Audit Trail
    await db.operationalException.create({
      data: {
        id: 'exc-seed-1',
        type: 'stock_shortage',
        severity: 'medium',
        referenceId: 'AG-1048',
        title: 'Substituição preventiva de item sazonal em cesta fixa',
        description:
          'A alface crespa hidropônica atingiu o limite de colheita no Sítio Verde; sugerida substituição equivalente por alface americana orgânica.',
        status: 'open',
        createdAt: new Date('2026-10-28T08:10:00.000Z'),
      },
    });

    await db.auditLog.createMany({
      data: [
        {
          id: 'aud-1',
          actorUserId: producerUser.id,
          action: 'onboarding.approved',
          resourceType: 'Onboarding',
          resourceId: 'sitio-verde',
          summary:
            'Onboarding da propriedade Sítio Verde aprovado pela operação.',
          metadata: { producerId: 'sitio-verde' },
          createdAt: new Date('2026-10-15T10:00:00.000Z'),
        },
        {
          id: 'aud-2',
          actorUserId: producerUser.id,
          action: 'inventory.updated',
          resourceType: 'Inventory',
          resourceId: 'mock-cesta',
          summary:
            'Disponibilidade semanal da Cesta da semana atualizada para 12 unidades.',
          metadata: { available: 12 },
          createdAt: new Date('2026-10-28T09:15:00.000Z'),
        },
      ],
    });
  } finally {
    if (shouldDisconnect) {
      await db.$disconnect();
    }
  }
}

if (require.main === module) {
  seedDatabase().then(() => {
    console.log(
      'Seed completo concluído: 3 contas demo, Sítio Verde, 2 zonas, 3 janelas, 8 produtos, 3 cestas fixas, 2 pedidos, 1 assinatura ativa e trilha de auditoria.'
    );
  });
}

import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OptionalAuthGuard } from '../../common/guards/auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { calculatePlatformFeeCents } from '../../domain/rules';

@Injectable()
class ProducerService {
  constructor(private db: PrismaService) {}

  private async logAudit(
    action: string,
    resourceType: 'Onboarding' | 'Product' | 'Inventory' | 'Order',
    resourceId: string,
    summary: string
  ) {
    await this.db.auditLog.create({
      data: {
        actorUserId: 'user-producer',
        action,
        resourceType,
        resourceId,
        summary,
        metadata: { summary },
      },
    });
  }

  async dashboard() {
    const producer = await this.db.producer.findFirst({
      where: { id: 'sitio-verde' },
      include: { certifications: true },
    });
    if (!producer) {
      throw new NotFoundException('Propriedade produtora não encontrada.');
    }

    const products = await this.db.product.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        producer: true,
        inventory: { orderBy: { deliveryDate: 'asc' }, take: 1 },
      },
    });

    const offers = products.map((p) => {
      const inv = p.inventory[0];
      return {
        id: p.id,
        name: p.name,
        description: p.description ?? '',
        category: p.category,
        unit: p.unit,
        priceCents: p.priceCents,
        active: p.active,
        certification: p.certification,
        seasonality: p.seasonality,
        basketItems: p.basketItemsJson
          ? JSON.parse(p.basketItemsJson)
          : undefined,
        producer: { id: p.producer.id, name: p.producer.displayName },
        stock: {
          available: inv ? Math.max(0, inv.available - inv.reserved) : 0,
          reserved: inv?.reserved ?? 0,
          lowStockThreshold: inv?.lowStockThreshold ?? 5,
          deliveryDate: inv?.deliveryDate
            ? new Date(inv.deliveryDate).toISOString()
            : null,
        },
      };
    });

    const unitMap = new Map(offers.map((o) => [o.id, o.unit]));

    const orders = await this.db.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        address: true,
        deliverySlot: true,
      },
    });

    const fulfillmentQueue = orders.map((order) => {
      const items = order.items.map((i) => ({
        productId: i.productId,
        name: i.product.name,
        quantity: i.quantity,
        unit: unitMap.get(i.productId) ?? i.product.unit ?? 'un',
        unitPriceCents: i.unitPriceCents,
      }));
      const producerGrossCents = items.reduce(
        (sum, i) => sum + i.quantity * i.unitPriceCents,
        0
      );
      return {
        orderId: order.id,
        status: order.status,
        producerSeparated:
          order.producerSeparated || order.status === 'Entregue',
        deliverySlot: {
          id: order.deliverySlot.id,
          startsAt: order.deliverySlot.startsAt.toISOString(),
          endsAt: order.deliverySlot.endsAt.toISOString(),
        },
        customerCity: order.address.city,
        items,
        producerGrossCents,
      };
    });

    const harvestMap = new Map<
      string,
      {
        productId: string;
        name: string;
        unit: string;
        totalQuantity: number;
        ordersCount: number;
      }
    >();
    for (const fq of fulfillmentQueue) {
      if (fq.status === 'Entregue') continue;
      for (const item of fq.items) {
        const prev = harvestMap.get(item.productId);
        if (prev) {
          prev.totalQuantity += item.quantity;
          prev.ordersCount += 1;
        } else {
          harvestMap.set(item.productId, {
            productId: item.productId,
            name: item.name,
            unit: item.unit,
            totalQuantity: item.quantity,
            ordersCount: 1,
          });
        }
      }
    }

    const payouts = fulfillmentQueue.map((fq) => {
      const feeCents = calculatePlatformFeeCents(
        fq.producerGrossCents,
        producer.platformFeePercent
      );
      const netCents = fq.producerGrossCents - feeCents;
      const isDelivered = fq.status === 'Entregue';
      return {
        id: `PAY-${fq.orderId}`,
        orderId: fq.orderId,
        createdAt: fq.deliverySlot.startsAt,
        scheduledAt: new Date(
          new Date(fq.deliverySlot.startsAt).getTime() + 2 * 86400000
        ).toISOString(),
        grossCents: fq.producerGrossCents,
        feePercent: producer.platformFeePercent,
        feeCents,
        netCents,
        status: !producer.paymentAccountConnected
          ? 'pending_split_approval'
          : isDelivered
            ? 'paid'
            : 'scheduled',
        itemsSummary: fq.items.map((i) => `${i.quantity}× ${i.name}`).join(', '),
      };
    });

    const lowStockOffers = offers.filter(
      (o) => o.stock.available <= (o.stock.lowStockThreshold ?? 5)
    );
    const pendingFulfillment = fulfillmentQueue.filter(
      (f) => !f.producerSeparated
    );

    const pendingReasons: string[] = [];
    if (producer.onboardingStatus !== 'approved') {
      pendingReasons.push(
        'Cadastro da propriedade aguarda aprovação operacional'
      );
    }
    if (!producer.paymentAccountConnected) {
      pendingReasons.push('Conta de recebimento Mercado Pago não conectada');
    }
    if (lowStockOffers.length > 0) {
      pendingReasons.push(
        `${lowStockOffers.length} oferta(s) com alerta de baixo estoque`
      );
    }
    if (pendingFulfillment.length > 0) {
      pendingReasons.push(
        `${pendingFulfillment.length} pedido(s) aguardando colheita e separação`
      );
    }

    const grossSalesCents = payouts.reduce((s, p) => s + p.grossCents, 0);
    const netPayoutCents = payouts.reduce((s, p) => s + p.netCents, 0);

    const auditRows = await this.db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return {
      producer: {
        id: producer.id,
        displayName: producer.displayName,
        city: producer.city,
        state: producer.state,
        story: producer.story,
        legalIdMasked: producer.legalIdMasked,
        onboardingStatus: producer.onboardingStatus,
        paymentAccountConnected: producer.paymentAccountConnected,
        splitFeatureFlagEnabled: producer.splitFeatureFlagEnabled,
        platformFeePercent: producer.platformFeePercent,
        pendingTasksCount: pendingReasons.length,
        pendingReasons,
        certifications: producer.certifications.map((c) => ({
          id: c.id,
          name: c.name,
          issuer: c.issuer,
          validUntil: c.validUntil,
          status: c.status,
        })),
      },
      metrics: {
        activeOffersCount: offers.filter((o) => o.active !== false).length,
        pausedOffersCount: offers.filter((o) => o.active === false).length,
        lowStockCount: lowStockOffers.length,
        pendingFulfillmentCount: pendingFulfillment.length,
        grossSalesCents,
        netPayoutCents,
      },
      offers,
      fulfillmentQueue,
      harvestSummary: Array.from(harvestMap.values()),
      payouts,
      auditLogs: auditRows.map((a) => ({
        id: a.id,
        action: a.action,
        resourceType: a.resourceType,
        resourceId: a.resourceId,
        summary:
          a.summary ??
          (typeof a.metadata === 'object' &&
          a.metadata !== null &&
          'summary' in a.metadata
            ? String((a.metadata as any).summary)
            : `Alteração registrada em ${a.resourceType} (${a.resourceId}).`),
        createdAt: a.createdAt.toISOString(),
      })),
    };
  }

  async updateOnboarding(body: any) {
    const producer = await this.db.producer.findFirstOrThrow({
      where: { id: 'sitio-verde' },
    });

    const updated = await this.db.producer.update({
      where: { id: producer.id },
      data: {
        displayName: body?.displayName?.trim() || producer.displayName,
        city: body?.city?.trim() || producer.city,
        state: body?.state?.trim() || producer.state,
        story: body?.story?.trim() || producer.story,
        onboardingStatus: body?.onboardingStatus ?? producer.onboardingStatus,
        paymentAccountConnected:
          typeof body?.paymentAccountConnected === 'boolean'
            ? body.paymentAccountConnected
            : producer.paymentAccountConnected,
      },
    });

    await this.logAudit(
      'onboarding.updated',
      'Onboarding',
      updated.id,
      `Status de onboarding: ${updated.onboardingStatus} · Conta Mercado Pago conectada: ${updated.paymentAccountConnected ? 'Sim' : 'Não'}.`
    );

    return this.dashboard();
  }

  async createOffer(body: any) {
    const producer = await this.db.producer.findFirstOrThrow({
      where: { id: 'sitio-verde' },
    });
    const wantsPublish = body?.active !== false;
    if (
      wantsPublish &&
      (producer.onboardingStatus !== 'approved' ||
        !producer.paymentAccountConnected)
    ) {
      throw new BadRequestException(
        'Conclua a aprovação do onboarding e conecte a conta de recebimento antes de publicar ofertas.'
      );
    }

    const name = body?.name?.trim();
    const unit = body?.unit?.trim();
    const category = body?.category?.trim() || 'Hortaliças';
    const priceCents = Number(body?.priceCents ?? 0);
    const available = Number(body?.available ?? 0);

    if (!name || !unit) {
      throw new BadRequestException(
        'Informe o nome e a unidade de comercialização da oferta.'
      );
    }
    if (!Number.isInteger(priceCents) || priceCents <= 0) {
      throw new BadRequestException('O preço da oferta deve ser maior que zero.');
    }
    if (!Number.isInteger(available) || available < 0) {
      throw new BadRequestException(
        'A disponibilidade inicial não pode ser negativa.'
      );
    }

    const newId = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const deliveryDate = new Date('2099-01-01T00:00:00.000Z');
    const lowStockThreshold = Number(body?.lowStockThreshold ?? 5);

    const created = await this.db.product.create({
      data: {
        id: newId,
        producerId: producer.id,
        name,
        description:
          body?.description?.trim() ||
          `Colheita fresca de ${name} produzida por ${producer.displayName}.`,
        category,
        unit,
        priceCents,
        active: wantsPublish,
        certification:
          body?.certification?.trim() || 'Orgânico Participativo (OPAC)',
        seasonality:
          body?.seasonality?.trim() || 'Safra atual · Colheita sob demanda',
        basketItemsJson: Array.isArray(body?.basketItems)
          ? JSON.stringify(body.basketItems)
          : null,
      },
    });

    await this.db.inventory.create({
      data: {
        productId: created.id,
        deliveryDate,
        available,
        reserved: 0,
        lowStockThreshold,
      },
    });

    await this.logAudit(
      wantsPublish ? 'offer.published' : 'offer.draft_saved',
      'Product',
      created.id,
      `${wantsPublish ? 'Oferta publicada' : 'Rascunho salvo'}: ${name} (${unit}) por R$ ${(priceCents / 100).toFixed(2)} com lote de ${available}.`
    );

    return {
      id: created.id,
      name: created.name,
      description: created.description ?? '',
      category: created.category,
      unit: created.unit,
      priceCents: created.priceCents,
      active: created.active,
      certification: created.certification,
      seasonality: created.seasonality,
      basketItems: created.basketItemsJson
        ? JSON.parse(created.basketItemsJson)
        : undefined,
      producer: { id: producer.id, name: producer.displayName },
      stock: {
        available,
        reserved: 0,
        lowStockThreshold,
        deliveryDate: deliveryDate.toISOString(),
      },
    };
  }

  async toggleOfferStatus(productId: string) {
    const product = await this.db.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Oferta não encontrada.');

    const nextActive = !product.active;
    const producer = await this.db.producer.findFirstOrThrow({
      where: { id: 'sitio-verde' },
    });
    if (
      nextActive &&
      (producer.onboardingStatus !== 'approved' ||
        !producer.paymentAccountConnected)
    ) {
      throw new BadRequestException(
        'Conclua a aprovação do onboarding e conecte a conta de recebimento antes de publicar ofertas.'
      );
    }

    await this.db.product.update({
      where: { id: productId },
      data: { active: nextActive },
    });

    await this.logAudit(
      nextActive ? 'offer.activated' : 'offer.paused',
      'Product',
      productId,
      `Oferta "${product.name}" ${nextActive ? 'reativada no catálogo' : 'pausada pelo produtor'}.`
    );

    return this.dashboard();
  }

  async updateOffer(productId: string, body: any) {
    const product = await this.db.product.findUnique({
      where: { id: productId },
    });
    if (!product) throw new NotFoundException('Oferta não encontrada.');

    const priceCents =
      body?.priceCents !== undefined
        ? Number(body.priceCents)
        : product.priceCents;
    if (!Number.isInteger(priceCents) || priceCents <= 0) {
      throw new BadRequestException('Preço inválido.');
    }

    const updated = await this.db.product.update({
      where: { id: productId },
      data: {
        name: body?.name?.trim() || product.name,
        description: body?.description?.trim() || product.description,
        unit: body?.unit?.trim() || product.unit,
        seasonality: body?.seasonality?.trim() || product.seasonality,
        certification: body?.certification?.trim() || product.certification,
        priceCents,
      },
    });

    await this.db.basket.updateMany({
      where: { productId },
      data: { priceCents },
    });

    await this.logAudit(
      'offer.updated',
      'Product',
      productId,
      `Oferta "${updated.name}" atualizada (preço: R$ ${(priceCents / 100).toFixed(2)}).`
    );

    return this.dashboard();
  }

  async updateInventory(productId: string, body: any) {
    const product = await this.db.product.findUnique({
      where: { id: productId },
      include: { inventory: { orderBy: { deliveryDate: 'asc' }, take: 1 } },
    });
    if (!product) throw new NotFoundException('Oferta não encontrada.');

    const inv = product.inventory[0];
    const currentAvailable = inv
      ? Math.max(0, inv.available - inv.reserved)
      : 0;

    if (
      body?.expectedAvailable !== undefined &&
      Number(body.expectedAvailable) !== currentAvailable
    ) {
      throw new ConflictException(
        'A disponibilidade mudou enquanto você editava. Atualize os dados antes de salvar.'
      );
    }

    const nextAvailable = Number(body?.available);
    if (!Number.isInteger(nextAvailable) || nextAvailable < 0) {
      throw new BadRequestException(
        'O estoque disponível não pode ser negativo.'
      );
    }

    if (inv) {
      await this.db.inventory.update({
        where: { id: inv.id },
        data: {
          available: nextAvailable + inv.reserved,
          lowStockThreshold:
            body?.lowStockThreshold !== undefined
              ? Math.max(0, Number(body.lowStockThreshold))
              : inv.lowStockThreshold,
        },
      });
    } else {
      await this.db.inventory.create({
        data: {
          productId,
          deliveryDate: new Date('2099-01-01T00:00:00.000Z'),
          available: nextAvailable,
          reserved: 0,
          lowStockThreshold:
            body?.lowStockThreshold !== undefined
              ? Math.max(0, Number(body.lowStockThreshold))
              : 5,
        },
      });
    }

    await this.logAudit(
      'inventory.updated',
      'Inventory',
      productId,
      `Estoque semanal de "${product.name}" alterado de ${currentAvailable} para ${nextAvailable} (${product.unit}).`
    );

    return this.dashboard();
  }

  async markSeparated(orderId: string) {
    const order = await this.db.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Pedido não encontrado.');

    if (!order.producerSeparated) {
      await this.db.order.update({
        where: { id: orderId },
        data: { producerSeparated: true },
      });

      if (order.status !== 'Entregue') {
        await this.db.orderStatusHistory.create({
          data: {
            orderId,
            toStatus: 'Colheita e separação concluídas pelo produtor',
            actor: 'Produtor',
          },
        });
      }

      await this.logAudit(
        'fulfillment.separated',
        'Order',
        orderId,
        `Lote do pedido #${orderId} colhido, separado e etiquetado para coleta.`
      );
    }

    return this.dashboard();
  }
}

@UseGuards(OptionalAuthGuard)
@Controller('producer')
class ProducerController {
  constructor(private s: ProducerService) {}

  @Get('dashboard')
  dashboard() {
    return this.s.dashboard();
  }

  @Patch('onboarding')
  updateOnboarding(@Body() body: any) {
    return this.s.updateOnboarding(body);
  }

  @Post('offers')
  createOffer(@Body() body: any) {
    return this.s.createOffer(body);
  }

  @Post('offers/:id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.s.toggleOfferStatus(id);
  }

  @Patch('offers/:id')
  updateOffer(@Param('id') id: string, @Body() body: any) {
    return this.s.updateOffer(id, body);
  }

  @Patch('inventory/:productId')
  updateInventory(@Param('productId') productId: string, @Body() body: any) {
    return this.s.updateInventory(productId, body);
  }

  @Post('orders/:id/mark-separated')
  markSeparated(@Param('id') id: string) {
    return this.s.markSeparated(id);
  }
}

@Module({
  imports: [AuthModule],
  controllers: [ProducerController],
  providers: [ProducerService],
})
export class ProducerModule {}

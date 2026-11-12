import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Headers,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OptionalAuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { isBeforeCutoff } from '../../domain/rules';

@Injectable()
class SubscriptionsService {
  constructor(private db: PrismaService) {}

  private shapeSubscription(sub: any, now = new Date()) {
    const nextDelivery = new Date(sub.nextDeliveryAt);
    const cutoffAt = new Date(
      nextDelivery.getTime() - sub.cutoffHours * 3600000
    );
    const items = sub.basket?.itemsJson
      ? JSON.parse(sub.basket.itemsJson)
      : [];

    return {
      id: sub.id,
      basketId: sub.basketId,
      basketName: sub.basket?.name ?? 'Cesta Fixa',
      producer: {
        id: sub.basket?.producer?.id ?? 'sitio-verde',
        name:
          sub.basket?.producer?.displayName ??
          'Sítio Verde · Agricultura Familiar',
      },
      frequency: sub.frequency,
      priceCents: sub.priceCents,
      status: sub.status,
      cutoffHours: sub.cutoffHours,
      cutoffAt: cutoffAt.toISOString(),
      canModifyCurrentCycle: isBeforeCutoff(now, nextDelivery, sub.cutoffHours),
      nextBillingAt: new Date(sub.nextBillingAt).toISOString(),
      nextDeliveryAt: nextDelivery.toISOString(),
      address: {
        postalCode: sub.address.postalCode,
        street: sub.address.street,
        number: sub.address.number,
        complement: sub.address.complement ?? undefined,
        city: sub.address.city,
        state: sub.address.state,
      },
      deliverySlot: {
        id: sub.deliverySlot.id,
        label: sub.deliverySlot.label,
        startsAt: new Date(sub.deliverySlot.startsAt).toISOString(),
        endsAt: new Date(sub.deliverySlot.endsAt).toISOString(),
      },
      items,
      cycles: (sub.cycles ?? []).map((c: any) => ({
        id: c.id,
        cycleKey: c.cycleKey,
        deliveryDate: new Date(c.deliveryDate).toISOString(),
        billingDate: new Date(c.billingDate).toISOString(),
        amountCents: c.amountCents,
        status: c.status,
        paymentStatus: c.paymentStatus,
        orderId: c.orderId ?? null,
        note: c.note ?? undefined,
        createdAt: new Date(c.createdAt).toISOString(),
      })),
      createdAt: new Date(sub.createdAt).toISOString(),
      updatedAt: new Date(sub.updatedAt).toISOString(),
    };
  }

  private include() {
    return {
      basket: { include: { producer: true } },
      address: true,
      deliverySlot: true,
      cycles: { orderBy: { createdAt: 'desc' } },
    } as any;
  }

  async list(userId: string) {
    const rows = await this.db.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: this.include(),
    });
    return {
      data: rows.map((s) => this.shapeSubscription(s)),
    };
  }

  async create(
    userId: string,
    idempotencyKey: string | undefined,
    body: {
      basketId: string;
      frequency: 'weekly' | 'monthly';
      address: {
        postalCode: string;
        street: string;
        number: string;
        complement?: string;
        city: string;
        state: string;
      };
      deliverySlotId?: string;
    }
  ) {
    if (idempotencyKey) {
      const existing = await this.db.subscription.findFirst({
        where: {
          OR: [{ idempotencyKey }, { id: idempotencyKey }],
        },
        include: this.include(),
      });
      if (existing) return this.shapeSubscription(existing);
    }

    const basket = await this.db.basket.findFirst({
      where: { id: body?.basketId, active: true },
      include: {
        product: {
          include: { inventory: { orderBy: { deliveryDate: 'asc' }, take: 1 } },
        },
      },
    });
    if (!basket) throw new NotFoundException('Cesta fixa não encontrada.');
    if (!['weekly', 'monthly'].includes(body?.frequency)) {
      throw new BadRequestException('Escolha a frequência semanal ou mensal.');
    }

    const addr = body?.address;
    if (
      !addr?.postalCode?.trim() ||
      !addr?.street?.trim() ||
      !addr?.number?.trim() ||
      !addr?.city?.trim() ||
      !addr?.state?.trim()
    ) {
      throw new BadRequestException(
        'Preencha todos os campos obrigatórios do endereço.'
      );
    }

    const inv = basket.product.inventory[0];
    const available = Math.max(0, (inv?.available ?? 0) - (inv?.reserved ?? 0));
    if (!inv || available < 1) {
      throw new ConflictException(
        `Sem disponibilidade no lote atual para ${basket.name}.`
      );
    }

    await this.db.inventory.update({
      where: { id: inv.id },
      data: { available: Math.max(0, inv.available - 1) },
    });

    const slot =
      (body.deliverySlotId
        ? await this.db.deliverySlot.findFirst({
            where: { id: body.deliverySlotId, active: true },
          })
        : null) ??
      (await this.db.deliverySlot.findFirst({
        where: { active: true },
        orderBy: { startsAt: 'asc' },
      }));
    if (!slot) throw new NotFoundException('Janela de entrega não encontrada.');

    const savedAddress = await this.db.address.create({
      data: {
        userId,
        zoneId: slot.zoneId,
        postalCode: addr.postalCode.trim(),
        street: addr.street.trim(),
        number: addr.number.trim(),
        complement: addr.complement?.trim() || null,
        city: addr.city.trim(),
        state: addr.state.trim().toUpperCase(),
      },
    });

    const now = new Date();
    const orderId = `AG-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialOrder = await this.db.order.create({
      data: {
        id: orderId,
        userId,
        addressId: savedAddress.id,
        deliverySlotId: slot.id,
        status: 'Em preparação',
        operationalStage: 'preparing',
        totalCents: basket.priceCents,
        idempotencyKey: `sub-order-${orderId}`,
      },
    });

    await this.db.orderItem.create({
      data: {
        orderId: initialOrder.id,
        productId: basket.productId,
        quantity: 1,
        unitPriceCents: basket.priceCents,
      },
    });
    await this.db.payment.create({
      data: {
        orderId: initialOrder.id,
        provider: 'Pagamento sandbox',
        providerPaymentId: `sandbox_${initialOrder.id}`,
        status: 'approved',
        amountCents: basket.priceCents,
        idempotencyKey: `pay-${initialOrder.id}`,
      },
    });
    await this.db.delivery.create({
      data: {
        orderId: initialOrder.id,
        status: 'scheduled',
        confirmedAt: now,
      },
    });
    await this.db.orderStatusHistory.createMany({
      data: [
        {
          orderId: initialOrder.id,
          toStatus: 'Pedido confirmado',
          actor: 'Sistema',
        },
        {
          orderId: initialOrder.id,
          toStatus: 'Em preparação',
          actor: 'Produtor',
        },
      ],
    });

    const nextDays = body.frequency === 'weekly' ? 7 : 30;
    const nextDelivery = new Date(now.getTime() + nextDays * 86400000);
    const nextBilling = new Date(
      nextDelivery.getTime() - basket.cutoffHours * 3600000
    );

    const subId = `SUB-${Math.floor(2100 + Math.random() * 7800)}`;
    const sub = await this.db.subscription.create({
      data: {
        id: subId,
        userId,
        basketId: basket.id,
        addressId: savedAddress.id,
        deliverySlotId: slot.id,
        frequency: body.frequency,
        priceCents: basket.priceCents,
        status: 'active',
        cutoffHours: basket.cutoffHours,
        nextBillingAt: nextBilling,
        nextDeliveryAt: nextDelivery,
        idempotencyKey: idempotencyKey || subId,
      },
    });

    await this.db.subscriptionCycle.create({
      data: {
        id: `CYC-${Math.floor(200 + Math.random() * 800)}`,
        subscriptionId: sub.id,
        cycleKey: now.toISOString().slice(0, 10),
        deliveryDate: slot.startsAt,
        billingDate: now,
        amountCents: basket.priceCents,
        status: 'confirmed',
        paymentStatus: 'approved',
        orderId: initialOrder.id,
        note: '1º ciclo confirmado na adesão (estoque reservado).',
      },
    });

    const full = await this.db.subscription.findUniqueOrThrow({
      where: { id: sub.id },
      include: this.include(),
    });
    return this.shapeSubscription(full);
  }

  async pause(id: string) {
    const sub = await this.db.subscription.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!sub) throw new NotFoundException('Assinatura não encontrada.');
    if (sub.status === 'cancelled') {
      throw new BadRequestException('Assinatura cancelada não pode ser pausada.');
    }
    if (
      !isBeforeCutoff(new Date(), new Date(sub.nextDeliveryAt), sub.cutoffHours)
    ) {
      throw new BadRequestException(
        `Prazo de alteração encerrado. Você só pode pausar até ${sub.cutoffHours}h antes da próxima entrega.`
      );
    }
    const updated = await this.db.subscription.update({
      where: { id },
      data: { status: 'paused' },
      include: this.include(),
    });
    return this.shapeSubscription(updated);
  }

  async resume(id: string) {
    const sub = await this.db.subscription.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!sub) throw new NotFoundException('Assinatura não encontrada.');
    if (sub.status === 'cancelled') {
      throw new BadRequestException(
        'Assinatura cancelada não pode ser reativada. Inicie uma nova assinatura em Cestas.'
      );
    }
    const updated = await this.db.subscription.update({
      where: { id },
      data: { status: 'active' },
      include: this.include(),
    });
    return this.shapeSubscription(updated);
  }

  async cancel(id: string) {
    const sub = await this.db.subscription.findUnique({
      where: { id },
      include: this.include(),
    });
    if (!sub) throw new NotFoundException('Assinatura não encontrada.');
    if (
      !isBeforeCutoff(new Date(), new Date(sub.nextDeliveryAt), sub.cutoffHours)
    ) {
      throw new BadRequestException(
        `Prazo de cancelamento encerrado para o ciclo atual (limite de ${sub.cutoffHours}h antes da entrega).`
      );
    }
    const updated = await this.db.subscription.update({
      where: { id },
      data: { status: 'cancelled' },
      include: this.include(),
    });
    return this.shapeSubscription(updated);
  }

  async generateCycle(
    id: string,
    body: { cycleKey?: string; simulatePaymentFailure?: boolean }
  ) {
    const sub = await this.db.subscription.findUnique({
      where: { id },
      include: {
        ...this.include(),
        basket: {
          include: {
            producer: true,
            product: {
              include: {
                inventory: { orderBy: { deliveryDate: 'asc' }, take: 1 },
              },
            },
          },
        },
      },
    });
    if (!sub) throw new NotFoundException('Assinatura não encontrada.');
    if (sub.status !== 'active') {
      throw new BadRequestException(
        'Apenas assinaturas ativas podem gerar um novo ciclo de entrega.'
      );
    }

    const cycleKey =
      body?.cycleKey ||
      new Date(sub.nextDeliveryAt).toISOString().slice(0, 10) ||
      'next-cycle';

    const existingCycle = await this.db.subscriptionCycle.findUnique({
      where: {
        subscriptionId_cycleKey: { subscriptionId: sub.id, cycleKey },
      },
    });
    if (existingCycle) {
      return this.shapeSubscription(sub);
    }

    const now = new Date();
    if (body?.simulatePaymentFailure) {
      await this.db.subscriptionCycle.create({
        data: {
          id: `CYC-${Math.floor(200 + Math.random() * 800)}`,
          subscriptionId: sub.id,
          cycleKey,
          deliveryDate: sub.nextDeliveryAt,
          billingDate: now,
          amountCents: sub.priceCents,
          status: 'payment_failed',
          paymentStatus: 'failed',
          orderId: null,
          note: 'Falha na cobrança recorrente sandbox. Verifique o meio de pagamento.',
        },
      });
      const updated = await this.db.subscription.update({
        where: { id: sub.id },
        data: { status: 'payment_failed' },
        include: this.include(),
      });
      return this.shapeSubscription(updated);
    }

    const inv = (sub.basket as any)?.product?.inventory?.[0];
    const available = Math.max(0, (inv?.available ?? 0) - (inv?.reserved ?? 0));
    if (!inv || available < 1) {
      await this.db.subscriptionCycle.create({
        data: {
          id: `CYC-${Math.floor(200 + Math.random() * 800)}`,
          subscriptionId: sub.id,
          cycleKey,
          deliveryDate: sub.nextDeliveryAt,
          billingDate: now,
          amountCents: sub.priceCents,
          status: 'stock_shortage',
          paymentStatus: 'pending',
          orderId: null,
          note: 'Estoque insuficiente da cesta no lote da semana. Nenhuma cobrança efetuada.',
        },
      });
      const updated = await this.db.subscription.findUniqueOrThrow({
        where: { id: sub.id },
        include: this.include(),
      });
      return this.shapeSubscription(updated);
    }

    await this.db.inventory.update({
      where: { id: inv.id },
      data: { available: Math.max(0, inv.available - 1) },
    });

    const orderId = `AG-${Math.floor(1000 + Math.random() * 9000)}`;
    const cycleOrder = await this.db.order.create({
      data: {
        id: orderId,
        userId: sub.userId,
        addressId: sub.addressId,
        deliverySlotId: sub.deliverySlotId,
        status: 'Em preparação',
        operationalStage: 'preparing',
        totalCents: sub.priceCents,
        idempotencyKey: `cycle-${sub.id}-${cycleKey}`,
      },
    });
    await this.db.orderItem.create({
      data: {
        orderId: cycleOrder.id,
        productId: (sub.basket as any).productId,
        quantity: 1,
        unitPriceCents: sub.priceCents,
      },
    });
    await this.db.payment.create({
      data: {
        orderId: cycleOrder.id,
        provider: 'Pagamento sandbox',
        providerPaymentId: `sandbox_${cycleOrder.id}`,
        status: 'approved',
        amountCents: sub.priceCents,
        idempotencyKey: `pay-${cycleOrder.id}`,
      },
    });
    await this.db.delivery.create({
      data: {
        orderId: cycleOrder.id,
        status: 'scheduled',
        confirmedAt: now,
      },
    });
    await this.db.orderStatusHistory.createMany({
      data: [
        {
          orderId: cycleOrder.id,
          toStatus: 'Pedido confirmado (ciclo recorrente)',
          actor: 'Sistema',
        },
        {
          orderId: cycleOrder.id,
          toStatus: 'Em preparação',
          actor: 'Produtor',
        },
      ],
    });

    await this.db.subscriptionCycle.create({
      data: {
        id: `CYC-${Math.floor(200 + Math.random() * 800)}`,
        subscriptionId: sub.id,
        cycleKey,
        deliveryDate: sub.nextDeliveryAt,
        billingDate: now,
        amountCents: sub.priceCents,
        status: 'confirmed',
        paymentStatus: 'approved',
        orderId: cycleOrder.id,
        note: 'Ciclo recorrente confirmado e estoque reservado.',
      },
    });

    const stepDays = sub.frequency === 'weekly' ? 7 : 30;
    const nextDelivery = new Date(
      new Date(sub.nextDeliveryAt).getTime() + stepDays * 86400000
    );
    const nextBilling = new Date(
      nextDelivery.getTime() - sub.cutoffHours * 3600000
    );

    const updated = await this.db.subscription.update({
      where: { id: sub.id },
      data: {
        nextDeliveryAt: nextDelivery,
        nextBillingAt: nextBilling,
      },
      include: this.include(),
    });
    return this.shapeSubscription(updated);
  }

  async accountProfile(userId: string) {
    const user =
      (await this.db.user.findUnique({ where: { id: userId } })) ??
      (await this.db.user.findUnique({ where: { id: 'mock-consumer' } }));
    const targetUserId = user?.id ?? 'mock-consumer';

    const addresses = await this.db.address.findMany({
      where: { userId: targetUserId },
      include: { zone: true },
      orderBy: { createdAt: 'asc' },
    });
    const lgpdRequests = await this.db.lgpdDeletionRequest.findMany({
      where: { userId: targetUserId },
      orderBy: { requestedAt: 'desc' },
    });

    return {
      user: {
        id: targetUserId,
        email: user?.email ?? 'consumidor@agritech.local',
        role: user?.role ?? 'consumer',
      },
      maskedCpf: user?.maskedCpf ?? '***.982.247-25',
      paymentGatewayStatus: {
        provider: 'Adapter Fake Sandbox (Mercado Pago não conectado)',
        mode: 'sandbox' as const,
        storesCardData: false as const,
        description:
          'Nenhum dado bruto de cartão de crédito é armazenado pelo AgriTech. Cobranças avulsas e recorrentes operam em modo de simulação local.',
      },
      addresses: addresses.map((a) => ({
        id: a.id,
        label: a.label,
        zoneName: a.zone?.name ?? 'Zona Centro-Sul · Piloto',
        isDefault: a.isDefault,
        postalCode: a.postalCode,
        street: a.street,
        number: a.number,
        complement: a.complement ?? undefined,
        city: a.city,
        state: a.state,
      })),
      lgpdRequests: lgpdRequests.map((r) => ({
        id: r.id,
        protocol: r.protocol,
        reason: r.reason,
        status: r.status,
        requestedAt: r.requestedAt.toISOString(),
        completedAt: r.completedAt ? r.completedAt.toISOString() : undefined,
      })),
    };
  }

  async addAddress(userId: string, body: any) {
    if (
      !body?.postalCode?.trim() ||
      !body?.street?.trim() ||
      !body?.number?.trim() ||
      !body?.city?.trim() ||
      !body?.state?.trim()
    ) {
      throw new BadRequestException(
        'Preencha todos os campos obrigatórios do endereço.'
      );
    }
    const zones = await this.db.serviceZone.findMany();
    const cleanPostal = body.postalCode.replace(/\D/g, '');
    const matchedZone =
      zones.find((z) =>
        cleanPostal.startsWith(z.postalCodePrefix.replace(/\D/g, '').slice(0, 2))
      ) ?? zones[0];

    await this.db.address.create({
      data: {
        userId,
        zoneId: matchedZone?.id,
        label: body.label?.trim() || 'Endereço adicional',
        isDefault: false,
        postalCode: body.postalCode.trim(),
        street: body.street.trim(),
        number: body.number.trim(),
        complement: body.complement?.trim() || null,
        city: body.city.trim(),
        state: body.state.trim().toUpperCase(),
      },
    });

    const profile = await this.accountProfile(userId);
    return { data: profile.addresses };
  }

  async removeAddress(userId: string, id: string) {
    await this.db.address.deleteMany({
      where: { id, userId },
    });
    const profile = await this.accountProfile(userId);
    return { data: profile.addresses };
  }

  async createLgpdRequest(userId: string, body: { reason?: string }) {
    const existing = await this.db.lgpdDeletionRequest.findFirst({
      where: { userId, status: 'pending_review' },
    });
    if (existing) {
      throw new ConflictException(
        'Já existe uma solicitação LGPD em análise para esta conta.'
      );
    }
    const reason =
      body?.reason?.trim() ||
      'Solicitação de exclusão e anonimização de dados pessoais conforme LGPD.';
    const protocol = `LGPD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const created = await this.db.lgpdDeletionRequest.create({
      data: {
        userId,
        protocol,
        reason,
        status: 'pending_review',
      },
    });

    await this.db.operationalException.create({
      data: {
        id: `exc-lgpd-${created.id}`,
        type: 'lgpd_request',
        severity: 'high',
        referenceId: protocol,
        title: `Solicitação LGPD de exclusão/anonimização (${protocol})`,
        description: reason,
        status: 'open',
      },
    });

    return {
      id: created.id,
      protocol: created.protocol,
      reason: created.reason,
      status: created.status,
      requestedAt: created.requestedAt.toISOString(),
    };
  }
}

@UseGuards(OptionalAuthGuard)
@Controller('subscriptions')
class SubscriptionsController {
  constructor(private s: SubscriptionsService) {}

  @Get()
  list(@CurrentUser() u: any) {
    return this.s.list(u.sub);
  }

  @Post()
  create(
    @CurrentUser() u: any,
    @Headers('x-idempotency-key') key: string | undefined,
    @Body() body: any
  ) {
    return this.s.create(u.sub, key, body);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string) {
    return this.s.pause(id);
  }

  @Post(':id/resume')
  resume(@Param('id') id: string) {
    return this.s.resume(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.s.cancel(id);
  }

  @Post(':id/generate-cycle')
  generateCycle(@Param('id') id: string, @Body() body: any) {
    return this.s.generateCycle(id, body);
  }
}

@UseGuards(OptionalAuthGuard)
@Controller('account')
class AccountController {
  constructor(private s: SubscriptionsService) {}

  @Get('profile')
  profile(@CurrentUser() u: any) {
    return this.s.accountProfile(u.sub);
  }

  @Post('addresses')
  addAddress(@CurrentUser() u: any, @Body() body: any) {
    return this.s.addAddress(u.sub, body);
  }

  @Delete('addresses/:id')
  removeAddress(@CurrentUser() u: any, @Param('id') id: string) {
    return this.s.removeAddress(u.sub, id);
  }

  @Post('lgpd-deletion-request')
  lgpdRequest(@CurrentUser() u: any, @Body() body: any) {
    return this.s.createLgpdRequest(u.sub, body);
  }
}

@Module({
  imports: [AuthModule],
  controllers: [SubscriptionsController, AccountController],
  providers: [SubscriptionsService],
})
export class SubscriptionsModule {}

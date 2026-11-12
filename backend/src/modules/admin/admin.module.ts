import {
  BadRequestException,
  Body,
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
import {
  ORDER_STATUS_FLOW,
  OrderStatus,
  canTransitionOrder,
} from '../../domain/rules';

function stageToConsumerLabel(stage: OrderStatus): string {
  switch (stage) {
    case 'pending_payment':
      return 'Aguardando pagamento';
    case 'confirmed':
      return 'Pedido confirmado';
    case 'preparing':
      return 'Em preparação';
    case 'in_transit':
      return 'A caminho';
    case 'delivered':
      return 'Entregue';
  }
}

function consumerLabelToStage(status: string): OrderStatus {
  const s = (status ?? '').toLowerCase();
  if (s.includes('entregue') || s === 'delivered') return 'delivered';
  if (s.includes('caminho') || s.includes('rota') || s === 'in_transit')
    return 'in_transit';
  if (s.includes('prepar') || s === 'preparing') return 'preparing';
  if (s.includes('aguardando') || s === 'pending_payment')
    return 'pending_payment';
  return 'confirmed';
}

@Injectable()
class AdminService {
  constructor(private db: PrismaService) {}

  private async logAudit(
    action: string,
    resourceType: 'Onboarding' | 'Product' | 'Inventory' | 'Order',
    resourceId: string,
    summary: string
  ) {
    await this.db.auditLog.create({
      data: {
        actorUserId: 'user-ops',
        action,
        resourceType,
        resourceId,
        summary,
        metadata: { summary },
      },
    });
  }

  async dashboard() {
    const zonesRaw = await this.db.serviceZone.findMany({
      orderBy: { name: 'asc' },
    });
    const slotsRaw = await this.db.deliverySlot.findMany({
      orderBy: { startsAt: 'asc' },
      include: { zone: true },
    });
    const routesRaw = await this.db.manualRoute.findMany({
      orderBy: { createdAt: 'desc' },
      include: { zone: true, slot: true, orders: true },
    });
    const ordersRaw = await this.db.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        items: { include: { product: { include: { producer: true } } } },
        payment: true,
        delivery: true,
        address: { include: { zone: true } },
        deliverySlot: true,
        route: true,
        statusHistory: { orderBy: { changedAt: 'asc' } },
      },
    });

    const orders = ordersRaw.map((o) => {
      const cleanPostal = o.address.postalCode.replace(/\D/g, '');
      const matchedZone =
        o.address.zone ??
        zonesRaw.find((z) =>
          cleanPostal.startsWith(
            z.postalCodePrefix.replace(/\D/g, '').slice(0, 2)
          )
        ) ??
        zonesRaw[0];
      const stage =
        (o.operationalStage as OrderStatus) || consumerLabelToStage(o.status);

      return {
        id: o.id,
        status: o.status,
        operationalStage: stage,
        routeId: o.routeId ?? null,
        routeName: o.route?.name ?? null,
        zoneName: matchedZone?.name ?? 'Zona Centro-Sul · Piloto',
        totalCents: o.totalCents,
        idempotencyKey: o.idempotencyKey,
        producerSeparated: o.producerSeparated || o.status === 'Entregue',
        customerEmail: o.user?.email ?? 'consumidor@agritech.local',
        items: o.items.map((i) => ({
          productId: i.productId,
          name: i.product.name,
          quantity: i.quantity,
          unit: i.product.unit,
          producerName: i.product.producer.displayName,
          unitPriceCents: i.unitPriceCents,
        })),
        payment: o.payment
          ? { provider: o.payment.provider, status: o.payment.status }
          : { provider: 'Pagamento sandbox', status: 'approved' },
        delivery: o.delivery
          ? {
              status: o.delivery.status,
              confirmedAt: o.delivery.confirmedAt
                ? o.delivery.confirmedAt.toISOString()
                : null,
            }
          : { status: 'scheduled', confirmedAt: null },
        address: {
          postalCode: o.address.postalCode,
          street: o.address.street,
          number: o.address.number,
          complement: o.address.complement ?? undefined,
          city: o.address.city,
          state: o.address.state,
        },
        deliverySlot: {
          id: o.deliverySlot.id,
          label: o.deliverySlot.label,
          startsAt: o.deliverySlot.startsAt.toISOString(),
          endsAt: o.deliverySlot.endsAt.toISOString(),
        },
        statusHistory: o.statusHistory.map((h) => ({
          toStatus: h.toStatus,
          createdAt: h.changedAt.toISOString(),
          actor: h.actor ?? undefined,
        })),
      };
    });

    const zones = zonesRaw.map((z) => ({
      id: z.id,
      name: z.name,
      postalCodePrefix: z.postalCodePrefix,
      city: z.city,
      cutoffHours: z.cutoffHours,
      active: z.active,
      ordersCount: orders.filter((o) => o.zoneName === z.name).length,
    }));

    const slots = slotsRaw.map((s) => ({
      id: s.id,
      zoneId: s.zoneId,
      zoneName: s.zone.name,
      label: s.label,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt.toISOString(),
      capacity: s.capacity,
      occupied: orders.filter((o) => o.deliverySlot.id === s.id).length,
      active: s.active,
    }));

    const routes = routesRaw.map((r) => ({
      id: r.id,
      name: r.name,
      zoneId: r.zoneId,
      zoneName: r.zone.name,
      slotId: r.slotId,
      slotLabel: r.slot.label,
      driverName: r.driverName,
      status: r.status,
      orderIds: r.orders.map((o) => o.id),
      createdAt: r.createdAt.toISOString(),
    }));

    const storedExceptions = await this.db.operationalException.findMany({
      orderBy: { createdAt: 'desc' },
    });
    const failedCycles = await this.db.subscriptionCycle.findMany({
      where: { status: { in: ['payment_failed', 'stock_shortage'] } },
    });

    const exceptions = storedExceptions.map((e) => ({
      id: e.id,
      type: e.type,
      severity: e.severity,
      referenceId: e.referenceId,
      title: e.title,
      description: e.description,
      status: e.status,
      resolutionNote: e.resolutionNote ?? undefined,
      createdAt: e.createdAt.toISOString(),
      resolvedAt: e.resolvedAt ? e.resolvedAt.toISOString() : undefined,
    }));

    for (const cyc of failedCycles) {
      const refId = `${cyc.subscriptionId}:${cyc.id}`;
      if (!exceptions.some((e) => e.referenceId === refId)) {
        exceptions.push({
          id: `exc-${cyc.subscriptionId}-${cyc.id}`,
          type:
            cyc.status === 'payment_failed'
              ? 'payment_failure'
              : 'stock_shortage',
          severity: 'high',
          referenceId: refId,
          title:
            cyc.status === 'payment_failed'
              ? `Falha na cobrança recorrente da assinatura ${cyc.subscriptionId}`
              : `Ruptura de estoque no ciclo ${cyc.cycleKey} da assinatura ${cyc.subscriptionId}`,
          description:
            cyc.note ?? 'Incidente operacional registrado no ciclo recorrente.',
          status: 'open',
          resolutionNote: undefined,
          createdAt: cyc.createdAt.toISOString(),
          resolvedAt: undefined,
        });
      }
    }

    const manifest = orders.map((o) => ({
      orderId: o.id,
      status: o.status,
      operationalStage: o.operationalStage,
      customerEmail: o.customerEmail,
      zoneName: o.zoneName,
      routeName: o.routeName ?? 'Sem rota atribuída',
      slotLabel: o.deliverySlot.label,
      addressLine: `${o.address.street}, ${o.address.number}${o.address.complement ? ` (${o.address.complement})` : ''} - ${o.address.city}/${o.address.state}`,
      postalCode: o.address.postalCode,
      producerSeparated: o.producerSeparated,
      itemsSummary: o.items
        .map((i) => `${i.quantity}× ${i.name} (${i.unit})`)
        .join('; '),
      producersSummary: Array.from(
        new Set(o.items.map((i) => i.producerName))
      ).join(', '),
      totalCents: o.totalCents,
    }));

    const totalSlotCapacity = slots
      .filter((s) => s.active)
      .reduce((sum, s) => sum + s.capacity, 0);
    const occupiedSlotsCount = slots
      .filter((s) => s.active)
      .reduce((sum, s) => sum + s.occupied, 0);

    const auditRows = await this.db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return {
      metrics: {
        totalOrdersCount: orders.length,
        inTransitCount: orders.filter(
          (o) => o.operationalStage === 'in_transit'
        ).length,
        deliveredCount: orders.filter(
          (o) => o.operationalStage === 'delivered'
        ).length,
        openExceptionsCount: exceptions.filter((e) => e.status === 'open')
          .length,
        activeZonesCount: zones.filter((z) => z.active).length,
        totalSlotCapacity,
        occupiedSlotsCount,
      },
      zones,
      slots,
      routes,
      orders,
      exceptions,
      manifest,
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

  async createZone(body: any) {
    const name = body?.name?.trim();
    const postalCodePrefix = (body?.postalCodePrefix ?? '').replace(/\D/g, '');
    const city = body?.city?.trim() || 'São Paulo';
    const cutoffHours = Number(body?.cutoffHours ?? 36);
    if (!name || postalCodePrefix.length < 2) {
      throw new BadRequestException(
        'Informe o nome da zona e ao menos 2 dígitos iniciais do CEP.'
      );
    }

    const created = await this.db.serviceZone.create({
      data: {
        id: `zone-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        postalCodePrefix,
        city,
        cutoffHours:
          Number.isInteger(cutoffHours) && cutoffHours > 0 ? cutoffHours : 36,
        active: true,
        producerId: 'sitio-verde',
      },
    });

    await this.logAudit(
      'zone.created',
      'Onboarding',
      created.id,
      `Zona de atendimento "${created.name}" (CEP ${created.postalCodePrefix}*) criada por Operações.`
    );
    return this.dashboard();
  }

  async toggleZone(zoneId: string) {
    const zone = await this.db.serviceZone.findUnique({
      where: { id: zoneId },
    });
    if (!zone)
      throw new NotFoundException('Zona de atendimento não encontrada.');

    const updated = await this.db.serviceZone.update({
      where: { id: zoneId },
      data: { active: !zone.active },
    });

    await this.logAudit(
      updated.active ? 'zone.activated' : 'zone.paused',
      'Onboarding',
      zoneId,
      `Zona "${updated.name}" ${updated.active ? 'ativada' : 'pausada'} por Operações.`
    );
    return this.dashboard();
  }

  async createSlot(body: any) {
    const zoneId = body?.zoneId?.trim();
    const label = body?.label?.trim();
    const capacity = Number(body?.capacity ?? 30);
    if (!zoneId || !label) {
      throw new BadRequestException(
        'Selecione a zona e informe o rótulo da janela de entrega.'
      );
    }
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new BadRequestException(
        'A capacidade da janela deve ser maior que zero.'
      );
    }
    const zone = await this.db.serviceZone.findUnique({
      where: { id: zoneId },
    });
    if (!zone) throw new NotFoundException('Zona de atendimento inválida.');

    const created = await this.db.deliverySlot.create({
      data: {
        id: `slot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        zoneId: zone.id,
        label,
        startsAt: body?.startsAt
          ? new Date(body.startsAt)
          : new Date('2026-11-20T12:00:00.000Z'),
        endsAt: body?.endsAt
          ? new Date(body.endsAt)
          : new Date('2026-11-20T16:00:00.000Z'),
        capacity,
        active: true,
      },
    });

    await this.logAudit(
      'slot.created',
      'Inventory',
      created.id,
      `Janela de entrega "${created.label}" criada na ${zone.name} com capacidade de ${capacity} pedidos.`
    );
    return this.dashboard();
  }

  async updateSlot(slotId: string, body: any) {
    const slot = await this.db.deliverySlot.findUnique({
      where: { id: slotId },
    });
    if (!slot) throw new NotFoundException('Janela de entrega não encontrada.');

    const nextCapacity =
      body?.capacity !== undefined ? Number(body.capacity) : slot.capacity;
    if (!Number.isInteger(nextCapacity) || nextCapacity <= 0) {
      throw new BadRequestException(
        'A capacidade deve ser um número inteiro positivo.'
      );
    }
    const nextActive =
      typeof body?.active === 'boolean' ? body.active : slot.active;

    const updated = await this.db.deliverySlot.update({
      where: { id: slotId },
      data: { capacity: nextCapacity, active: nextActive },
    });

    await this.logAudit(
      'slot.updated',
      'Inventory',
      slotId,
      `Janela "${updated.label}" atualizada (capacidade: ${nextCapacity}, ativa: ${nextActive ? 'Sim' : 'Não'}).`
    );
    return this.dashboard();
  }

  async createRoute(body: any) {
    const name = body?.name?.trim();
    const zoneId = body?.zoneId?.trim();
    const slotId = body?.slotId?.trim();
    const driverName = body?.driverName?.trim() || 'Motorista da Frota Local';
    if (!name || !zoneId || !slotId) {
      throw new BadRequestException(
        'Informe o nome da rota, a zona e a janela de entrega correspondente.'
      );
    }

    const zone = await this.db.serviceZone.findUnique({
      where: { id: zoneId },
    });
    const slot = await this.db.deliverySlot.findUnique({
      where: { id: slotId },
    });
    if (!zone || !slot) {
      throw new NotFoundException('Zona ou janela de entrega não encontrada.');
    }

    const created = await this.db.manualRoute.create({
      data: {
        id: `route-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name,
        zoneId: zone.id,
        slotId: slot.id,
        driverName,
        status: 'open',
      },
    });

    await this.logAudit(
      'route.created',
      'Order',
      created.id,
      `Rota manual "${created.name}" (${zone.name}) criada com motorista ${driverName}.`
    );
    return this.dashboard();
  }

  async assignRoute(orderId: string, body: { routeId?: string }) {
    const order = await this.db.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido não encontrado.');

    const routeId = body?.routeId?.trim() || null;
    let routeName: string | null = null;
    if (routeId) {
      const route = await this.db.manualRoute.findUnique({
        where: { id: routeId },
      });
      if (!route) throw new NotFoundException('Rota manual não encontrada.');
      routeName = route.name;
    }

    await this.db.order.update({
      where: { id: orderId },
      data: { routeId },
    });

    await this.logAudit(
      'route.assigned',
      'Order',
      orderId,
      routeName
        ? `Pedido #${orderId} alocado manualmente na rota "${routeName}".`
        : `Pedido #${orderId} desvinculado de rota manual.`
    );
    return this.dashboard();
  }

  async advanceOrderStatus(orderId: string, body: { stage?: OrderStatus }) {
    const targetStage = body?.stage;
    if (!targetStage || !ORDER_STATUS_FLOW.includes(targetStage)) {
      throw new BadRequestException('Estágio operacional inválido.');
    }

    const order = await this.db.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Pedido não encontrado.');

    const currentStage =
      (order.operationalStage as OrderStatus) ||
      consumerLabelToStage(order.status);

    if (!canTransitionOrder(currentStage, targetStage)) {
      throw new BadRequestException(
        `Transição inválida de "${stageToConsumerLabel(currentStage)}" para "${stageToConsumerLabel(targetStage)}". Respeite a sequência operacional.`
      );
    }

    const nextConsumerLabel = stageToConsumerLabel(targetStage);
    const now = new Date();

    await this.db.order.update({
      where: { id: orderId },
      data: {
        status: nextConsumerLabel,
        operationalStage: targetStage,
      },
    });

    if (targetStage === 'delivered') {
      await this.db.delivery.upsert({
        where: { orderId },
        update: { status: 'delivered', confirmedAt: now },
        create: { orderId, status: 'delivered', confirmedAt: now },
      });
    }

    await this.db.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus: `${nextConsumerLabel} (atualizado por Operações)`,
        actor: 'Operações',
        changedAt: now,
      },
    });

    await this.logAudit(
      `order.status.${targetStage}`,
      'Order',
      orderId,
      `Status do pedido #${orderId} avançado para "${nextConsumerLabel}" pela equipe de Operações.`
    );

    return this.dashboard();
  }

  async resolveException(excId: string, body: { resolutionNote?: string }) {
    const resolutionNote =
      body?.resolutionNote?.trim() ||
      'Exceção tratada e registrada pela central de Operações.';
    const now = new Date();

    const dash = await this.dashboard();
    const target = dash.exceptions.find((e) => e.id === excId);
    if (!target) {
      throw new NotFoundException('Exceção operacional não encontrada.');
    }

    await this.db.operationalException.upsert({
      where: { id: excId },
      update: {
        status: 'resolved',
        resolutionNote,
        resolvedAt: now,
      },
      create: {
        id: excId,
        type: target.type,
        severity: target.severity,
        referenceId: target.referenceId,
        title: target.title,
        description: target.description,
        status: 'resolved',
        resolutionNote,
        resolvedAt: now,
      },
    });

    if (target.type === 'lgpd_request') {
      await this.db.lgpdDeletionRequest.updateMany({
        where: { protocol: target.referenceId },
        data: { status: 'completed', completedAt: now },
      });
    }

    await this.logAudit(
      'exception.resolved',
      'Order',
      target.referenceId,
      `Exceção "${target.title}" resolvida: ${resolutionNote}`
    );

    return this.dashboard();
  }
}

@UseGuards(OptionalAuthGuard)
@Controller('admin')
class AdminController {
  constructor(private s: AdminService) {}

  @Get('dashboard')
  dashboard() {
    return this.s.dashboard();
  }

  @Post('zones')
  createZone(@Body() body: any) {
    return this.s.createZone(body);
  }

  @Patch('zones/:id/toggle')
  toggleZone(@Param('id') id: string) {
    return this.s.toggleZone(id);
  }

  @Post('slots')
  createSlot(@Body() body: any) {
    return this.s.createSlot(body);
  }

  @Patch('slots/:id')
  updateSlot(@Param('id') id: string, @Body() body: any) {
    return this.s.updateSlot(id, body);
  }

  @Post('routes')
  createRoute(@Body() body: any) {
    return this.s.createRoute(body);
  }

  @Post('orders/:id/assign-route')
  assignRoute(@Param('id') id: string, @Body() body: any) {
    return this.s.assignRoute(id, body);
  }

  @Post('orders/:id/status')
  advanceStatus(@Param('id') id: string, @Body() body: any) {
    return this.s.advanceOrderStatus(id, body);
  }

  @Post('exceptions/:id/resolve')
  resolveException(@Param('id') id: string, @Body() body: any) {
    return this.s.resolveException(id, body);
  }
}

@Module({
  imports: [AuthModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

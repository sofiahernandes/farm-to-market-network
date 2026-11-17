import {
  Controller,
  Get,
  Module,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import { IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PrismaService } from '../../prisma/prisma.service';

class CatalogQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsString() category?: string;
  @IsOptional() @Type(() => Number) @Min(1) @Max(100) limit = 20;
  @IsOptional() @Type(() => Number) @Min(0) offset = 0;
}

@Controller()
class CatalogController {
  constructor(private db: PrismaService) {}

  private shapeProduct(p: any) {
    const inventory = p.inventory?.[0];
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      category: p.category,
      unit: p.unit,
      priceCents: p.priceCents,
      active: p.active,
      certification: p.certification ?? 'Orgânico Participativo (OPAC)',
      seasonality: p.seasonality ?? 'Safra atual · Colheita sob demanda',
      basketId: p.baskets?.[0]?.id ?? undefined,
      basketItems: p.basketItemsJson
        ? JSON.parse(p.basketItemsJson)
        : undefined,
      producer: { id: p.producer.id, name: p.producer.displayName },
      stock: {
        available: inventory
          ? Math.max(0, inventory.available - inventory.reserved)
          : 0,
        reserved: inventory?.reserved ?? 0,
        lowStockThreshold: inventory?.lowStockThreshold ?? 5,
        deliveryDate: inventory?.deliveryDate
          ? new Date(inventory.deliveryDate).toISOString()
          : null,
      },
    };
  }

  private shapeBasket(b: any) {
    const inventory = b.product?.inventory?.[0];
    const rawItems = JSON.parse(b.itemsJson || '[]');
    return {
      id: b.id,
      slug: b.slug,
      productId: b.productId,
      name: b.name,
      subtitle: b.subtitle,
      description: b.description,
      seasonality:
        b.product?.seasonality ?? b.subtitle ?? 'Safra atual · Colheita semanal',
      priceCents: b.product?.priceCents ?? b.priceCents,
      servesLabel: b.servesLabel,
      cutoffHours: b.cutoffHours,
      frequencies: JSON.parse(b.frequenciesJson || '["weekly","monthly"]'),
      producer: { id: b.producer.id, name: b.producer.displayName },
      stock: {
        available: inventory
          ? Math.max(0, inventory.available - inventory.reserved)
          : 0,
        deliveryDate: inventory?.deliveryDate
          ? new Date(inventory.deliveryDate).toISOString()
          : '2026-11-18T11:00:00.000Z',
      },
      items: rawItems.map((it: any) => ({
        ...it,
        origin: it.origin ?? 'Sítio Verde',
      })),
    };
  }

  @Get('catalog')
  async list(@Query() q: CatalogQueryDto) {
    const where: any = { active: true };
    if (q.category) where.category = q.category;
    const rows = await this.db.product.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        producer: true,
        baskets: { select: { id: true }, take: 1 },
        inventory: { orderBy: { deliveryDate: 'asc' }, take: 1 },
      },
    });

    const search = q.search?.toLocaleLowerCase('pt-BR')?.trim() ?? '';
    const filtered = search
      ? rows.filter((p) =>
          `${p.name} ${p.description ?? ''} ${p.producer.displayName}`
            .toLocaleLowerCase('pt-BR')
            .includes(search)
        )
      : rows;

    const paged = filtered.slice(q.offset, q.offset + q.limit);

    return {
      data: paged.map((p) => this.shapeProduct(p)),
      pagination: {
        limit: q.limit,
        offset: q.offset,
        count: paged.length,
        nextOffset:
          q.offset + q.limit < filtered.length ? q.offset + q.limit : null,
      },
    };
  }

  @Get('catalog/:id')
  async get(@Param('id') id: string) {
    const p = await this.db.product.findFirst({
      where: { id, active: true },
      include: {
        producer: true,
        baskets: { select: { id: true }, take: 1 },
        inventory: { orderBy: { deliveryDate: 'asc' }, take: 1 },
      },
    });
    if (!p) throw new NotFoundException('Oferta não encontrada.');
    return this.shapeProduct(p);
  }

  @Get('delivery-slots')
  async listDeliverySlots() {
    const slots = await this.db.deliverySlot.findMany({
      where: { active: true },
      orderBy: { startsAt: 'asc' },
    });
    return {
      data: slots.map((s) => ({
        id: s.id,
        label: s.label,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
      })),
    };
  }

  @Get('baskets')
  async listBaskets() {
    const rows = await this.db.basket.findMany({
      where: { active: true },
      include: {
        producer: true,
        product: {
          include: {
            inventory: { orderBy: { deliveryDate: 'asc' }, take: 1 },
          },
        },
      },
    });
    const visible = rows.filter((b) => b.product?.active !== false);
    return {
      data: visible.map((b) => this.shapeBasket(b)),
    };
  }

  @Get('baskets/:id')
  async getBasket(@Param('id') id: string) {
    const b = await this.db.basket.findFirst({
      where: { id, active: true },
      include: {
        producer: true,
        product: {
          include: {
            inventory: { orderBy: { deliveryDate: 'asc' }, take: 1 },
          },
        },
      },
    });
    if (!b || b.product?.active === false) {
      throw new NotFoundException('Cesta fixa não encontrada.');
    }
    return this.shapeBasket(b);
  }
}

@Module({ controllers: [CatalogController] })
export class CatalogModule {}

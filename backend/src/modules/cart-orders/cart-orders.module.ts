import { AuthModule } from '../auth/auth.module';
import {
  BadRequestException,
  ConflictException,
  Controller,
  Delete,
  Get,
  Headers,
  Injectable,
  Module,
  NotFoundException,
  Param,
  Patch,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsObject, IsOptional, IsString, Min } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthGuard } from '../../common/guards/auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

class AddCartItemDto {
  @IsString() productId!: string;
  @IsInt() @Min(1) quantity!: number;
}

class UpdateCartItemDto {
  @IsInt() quantity!: number;
}

class AddressDto {
  @IsString() postalCode!: string;
  @IsString() street!: string;
  @IsString() number!: string;
  @IsOptional() @IsString() complement?: string;
  @IsString() city!: string;
  @IsString() state!: string;
}

class CheckoutDto {
  @IsObject() address!: AddressDto;
  @IsOptional() @IsString() deliverySlotId?: string;
}

@Injectable()
class CartOrdersService {
  constructor(private db: PrismaService) {}

  async cart(userId: string) {
    const cart = await this.db.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                inventory: { orderBy: { deliveryDate: 'asc' }, take: 1 },
              },
            },
          },
        },
      },
    });
    const items = cart?.items ?? [];

    return {
      data: items.map((i) => ({
        productId: i.productId,
        name: i.product.name,
        quantity: i.quantity,
        unitPriceCents: i.product.priceCents,
        subtotalCents: i.quantity * i.product.priceCents,
        available: Math.max(
          0,
          (i.product.inventory[0]?.available ?? 0) -
            (i.product.inventory[0]?.reserved ?? 0)
        ),
      })),
      totalCents: items.reduce(
        (s, i) => s + i.quantity * i.product.priceCents,
        0
      ),
      currency: 'BRL',
    };
  }

  async add(userId: string, dto: AddCartItemDto) {
    const product = await this.db.product.findFirst({
      where: { id: dto.productId, active: true },
      include: { inventory: { orderBy: { deliveryDate: 'asc' }, take: 1 } },
    });
    if (!product) throw new NotFoundException('Oferta não encontrada.');
    const inv = product.inventory[0];
    const available = Math.max(0, (inv?.available ?? 0) - (inv?.reserved ?? 0));

    const cart = await this.db.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    const existing = await this.db.cartItem.findUnique({
      where: {
        cartId_productId: { cartId: cart.id, productId: dto.productId },
      },
    });
    const nextQty = (existing?.quantity ?? 0) + dto.quantity;
    if (nextQty > available) {
      throw new BadRequestException(
        `Quantidade indisponível. O lote de ${product.name} possui ${available} disponível(is).`
      );
    }

    await this.db.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.id, productId: dto.productId },
      },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      },
      update: { quantity: nextQty },
    });

    return this.cart(userId);
  }

  async updateQuantity(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto
  ) {
    const cart = await this.db.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    if (dto.quantity <= 0) {
      await this.db.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
      return this.cart(userId);
    }

    const product = await this.db.product.findFirst({
      where: { id: productId, active: true },
      include: { inventory: { orderBy: { deliveryDate: 'asc' }, take: 1 } },
    });
    if (!product) throw new NotFoundException('Oferta não encontrada.');
    const inv = product.inventory[0];
    const available = Math.max(0, (inv?.available ?? 0) - (inv?.reserved ?? 0));
    if (dto.quantity > available) {
      throw new BadRequestException(
        `Quantidade máxima disponível no lote: ${available}.`
      );
    }

    await this.db.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.id, productId },
      },
      create: {
        cartId: cart.id,
        productId,
        quantity: dto.quantity,
      },
      update: { quantity: dto.quantity },
    });

    return this.cart(userId);
  }

  async remove(userId: string, productId: string) {
    const cart = await this.db.cart.findUnique({ where: { userId } });
    if (!cart) return this.cart(userId);
    await this.db.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });

    return this.cart(userId);
  }

  async checkout(userId: string, key: string | undefined, dto: CheckoutDto) {
    const idempotencyKey = key?.trim() || `chk-${Date.now()}`;
    const existing = await this.db.order.findUnique({
      where: { idempotencyKey },
      include: this.include(),
    });
    if (existing) {
      if (existing.userId !== userId)
        throw new ConflictException('Chave de idempotência já utilizada.');
      return this.output(existing);
    }

    return this.db.$transaction(async (tx) => {
      const again = await tx.order.findUnique({
        where: { idempotencyKey },
        include: this.include(),
      });
      if (again) return this.output(again);

      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
      if (!cart?.items.length) {
        throw new BadRequestException('Sua sacola está vazia.');
      }

      if (
        !dto.address?.postalCode?.trim() ||
        !dto.address?.street?.trim() ||
        !dto.address?.number?.trim() ||
        !dto.address?.city?.trim() ||
        !dto.address?.state?.trim()
      ) {
        throw new BadRequestException(
          'Preencha todos os campos obrigatórios do endereço.'
        );
      }

      const slot =
        (dto.deliverySlotId
          ? await tx.deliverySlot.findFirst({
              where: { id: dto.deliverySlotId, active: true },
            })
          : null) ??
        (await tx.deliverySlot.findFirst({
          where: { active: true },
          orderBy: { startsAt: 'asc' },
        }));
      if (!slot) {
        throw new NotFoundException('Janela de entrega não encontrada.');
      }

      const zone = await tx.serviceZone.findUnique({
        where: { id: slot.zoneId },
      });

      const address = await tx.address.create({
        data: {
          userId,
          zoneId: zone?.id,
          postalCode: dto.address.postalCode.trim(),
          street: dto.address.street.trim(),
          number: dto.address.number.trim(),
          complement: dto.address.complement?.trim() || null,
          city: dto.address.city.trim(),
          state: dto.address.state.trim().toUpperCase(),
        },
      });

      const total = cart.items.reduce(
        (s, i) => s + i.quantity * i.product.priceCents,
        0
      );

      const orderId = `AG-${Math.floor(1000 + Math.random() * 9000)}`;
      const order = await tx.order.create({
        data: {
          id: orderId,
          userId,
          addressId: address.id,
          deliverySlotId: slot.id,
          totalCents: total,
          idempotencyKey,
          status: 'Em preparação',
          operationalStage: 'preparing',
        },
      });

      for (const item of cart.items) {
        const inv = await tx.inventory.findFirst({
          where: { productId: item.productId },
          orderBy: { deliveryDate: 'asc' },
        });
        const available = Math.max(
          0,
          (inv?.available ?? 0) - (inv?.reserved ?? 0)
        );
        if (!inv || item.quantity > available) {
          throw new ConflictException(
            `Estoque insuficiente para ${item.product.name}. Disponível no lote: ${available}.`
          );
        }

        await tx.inventory.update({
          where: { id: inv.id },
          data: { available: Math.max(0, inv.available - item.quantity) },
        });

        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            unitPriceCents: item.product.priceCents,
          },
        });
        await tx.inventoryAllocation.create({
          data: {
            inventoryId: inv.id,
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
          },
        });
      }

      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: 'Pagamento sandbox',
          providerPaymentId: `sandbox_${order.id}`,
          status: 'approved',
          amountCents: total,
          idempotencyKey: `pay-${idempotencyKey}`,
        },
      });
      await tx.delivery.create({
        data: {
          orderId: order.id,
          status: 'scheduled',
          confirmedAt: new Date(),
        },
      });
      await tx.orderStatusHistory.createMany({
        data: [
          {
            orderId: order.id,
            toStatus: 'Pedido confirmado',
            actor: 'Sistema',
          },
          {
            orderId: order.id,
            toStatus: 'Em preparação',
            actor: 'Produtor',
          },
        ],
      });
      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: 'order.status.confirmed',
          resourceType: 'Order',
          resourceId: order.id,
          summary: `Pedido #${order.id} confirmado no checkout (R$ ${(total / 100).toFixed(2)}).`,
          metadata: { idempotencyKey, totalCents: total },
        },
      });
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return this.output(
        await tx.order.findUniqueOrThrow({
          where: { id: order.id },
          include: this.include(),
        })
      );
    });
  }

  async confirmDelivery(userId: string, orderId: string) {
    const order = await this.db.order.findFirst({
      where: { id: orderId },
      include: this.include(),
    });
    if (!order) throw new NotFoundException('Pedido não encontrado.');

    if (order.status !== 'Entregue') {
      const now = new Date();
      await this.db.order.update({
        where: { id: order.id },
        data: {
          status: 'Entregue',
          operationalStage: 'delivered',
        },
      });
      await this.db.delivery.upsert({
        where: { orderId: order.id },
        update: { status: 'delivered', confirmedAt: now },
        create: { orderId: order.id, status: 'delivered', confirmedAt: now },
      });
      await this.db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          toStatus: 'Entregue (confirmado pelo consumidor)',
          actor: 'Consumidor',
          changedAt: now,
        },
      });
    }

    const updated = await this.db.order.findUniqueOrThrow({
      where: { id: order.id },
      include: this.include(),
    });
    return this.output(updated);
  }

  include() {
    return {
      items: { include: { product: true } },
      payment: true,
      delivery: true,
      address: { include: { zone: true } },
      deliverySlot: true,
      route: true,
      statusHistory: { orderBy: { changedAt: 'asc' } },
    } as any;
  }

  output(o: any) {
    return {
      id: o.id,
      status: o.status,
      operationalStage: o.operationalStage ?? 'preparing',
      routeId: o.routeId ?? null,
      routeName: o.route?.name ?? null,
      zoneName: o.address?.zone?.name ?? 'Zona Centro-Sul · Piloto',
      totalCents: o.totalCents,
      idempotencyKey: o.idempotencyKey,
      items: o.items.map((i: any) => ({
        productId: i.productId,
        name: i.product.name,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
      })),
      payment: o.payment
        ? { provider: o.payment.provider, status: o.payment.status }
        : { provider: 'Pagamento sandbox', status: 'approved' },
      delivery: o.delivery
        ? {
            status: o.delivery.status,
            confirmedAt: o.delivery.confirmedAt
              ? new Date(o.delivery.confirmedAt).toISOString()
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
        startsAt: new Date(o.deliverySlot.startsAt).toISOString(),
        endsAt: new Date(o.deliverySlot.endsAt).toISOString(),
      },
      statusHistory: (o.statusHistory ?? []).map((h: any) => ({
        toStatus: h.toStatus,
        createdAt: new Date(h.changedAt).toISOString(),
        actor: h.actor ?? undefined,
      })),
    };
  }

  async orders(userId: string) {
    const rows = await this.db.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: this.include(),
    });

    return { data: rows.map((x) => this.output(x)) };
  }

  async order(userId: string, id: string) {
    const x = await this.db.order.findFirst({
      where: { id },
      include: this.include(),
    });
    if (!x) throw new NotFoundException('Pedido não encontrado.');

    return this.output(x);
  }
}

@UseGuards(AuthGuard)
@Controller('cart')
class CartController {
  constructor(private s: CartOrdersService) {}
  @Get() get(@CurrentUser() u: any) {
    return this.s.cart(u.sub);
  }
  @Post('items') add(@CurrentUser() u: any, @Body() d: AddCartItemDto) {
    return this.s.add(u.sub, d);
  }
  @Patch('items/:productId') update(
    @CurrentUser() u: any,
    @Param('productId') id: string,
    @Body() d: UpdateCartItemDto
  ) {
    return this.s.updateQuantity(u.sub, id, d);
  }
  @Delete('items/:productId') remove(
    @CurrentUser() u: any,
    @Param('productId') id: string
  ) {
    return this.s.remove(u.sub, id);
  }
}

@UseGuards(AuthGuard)
@Controller('checkout')
class CheckoutController {
  constructor(private s: CartOrdersService) {}
  @Post() checkout(
    @CurrentUser() u: any,
    @Headers('x-idempotency-key') k: string | undefined,
    @Body() d: CheckoutDto
  ) {
    return this.s.checkout(u.sub, k, d);
  }
}

@UseGuards(AuthGuard)
@Controller('orders')
class OrdersController {
  constructor(private s: CartOrdersService) {}
  @Get() list(@CurrentUser() u: any) {
    return this.s.orders(u.sub);
  }
  @Get(':id') get(@CurrentUser() u: any, @Param('id') id: string) {
    return this.s.order(u.sub, id);
  }
  @Post(':id/confirm-delivery') confirmDelivery(
    @CurrentUser() u: any,
    @Param('id') id: string
  ) {
    return this.s.confirmDelivery(u.sub, id);
  }
}

@Module({
  imports: [AuthModule],
  controllers: [CartController, CheckoutController, OrdersController],
  providers: [CartOrdersService],
  exports: [CartOrdersService],
})
export class CartOrdersModule {}

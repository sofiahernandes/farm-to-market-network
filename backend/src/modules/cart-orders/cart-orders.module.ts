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
  @IsString() deliverySlotId!: string;
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
    });
    if (!product) throw new NotFoundException('Oferta não encontrada');
    const cart = await this.db.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
    await this.db.cartItem.upsert({
      where: {
        cartId_productId: { cartId: cart.id, productId: dto.productId },
      },
      create: {
        cartId: cart.id,
        productId: dto.productId,
        quantity: dto.quantity,
      },
      update: { quantity: { increment: dto.quantity } },
    });

    return this.cart(userId);
  }

  async remove(userId: string, productId: string) {
    const cart = await this.db.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException('Carrinho não encontrado');
    await this.db.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });

    return this.cart(userId);
  }

  async checkout(userId: string, key: string, dto: CheckoutDto) {
    if (!key?.trim())
      throw new BadRequestException('x-idempotency-key é obrigatório');
    const existing = await this.db.order.findUnique({
      where: { idempotencyKey: key },
      include: this.include(),
    });
    if (existing) {
      if (existing.userId !== userId)
        throw new ConflictException('Chave de idempotência já utilizada');
      return this.output(existing);
    }

    return this.db.$transaction(
      async (tx) => {
        const again = await tx.order.findUnique({
          where: { idempotencyKey: key },
          include: this.include(),
        });
        if (again) return this.output(again);
        const cart = await tx.cart.findUnique({
          where: { userId },
          include: { items: { include: { product: true } } },
        });
        if (!cart?.items.length)
          throw new BadRequestException('Carrinho vazio');
        const slot = await tx.deliverySlot.findFirst({
          where: { id: dto.deliverySlotId, active: true },
        });
        if (!slot)
          throw new NotFoundException('Janela de entrega não encontrada');
        const zone = await tx.serviceZone.findUnique({
          where: { id: slot.zoneId },
        });
        const address = await tx.address.create({
          data: { userId, zoneId: zone?.id, ...dto.address },
        });
        const total = cart.items.reduce(
          (s, i) => s + i.quantity * i.product.priceCents,
          0
        );
        const order = await tx.order.create({
          data: {
            userId,
            addressId: address.id,
            deliverySlotId: slot.id,
            totalCents: total,
            idempotencyKey: key,
            status: 'confirmed',
          },
        });
        for (const item of cart.items) {
          const inv = await tx.inventory.findFirst({
            where: {
              productId: item.productId,
              deliveryDate: { gte: new Date() },
            },
            orderBy: { deliveryDate: 'asc' },
          });
          if (!inv)
            throw new ConflictException(
              `Sem estoque para ${item.product.name}`
            );
          const updated = await tx.inventory.updateMany({
            where: {
              id: inv.id,
              available: { gte: inv.reserved + item.quantity },
            },
            data: { reserved: { increment: item.quantity } },
          });
          if (updated.count !== 1)
            throw new ConflictException(
              `Estoque insuficiente para ${item.product.name}`
            );
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
            provider: 'fake-sandbox',
            providerPaymentId: `sandbox_${order.id}`,
            status: 'approved',
            amountCents: total,
            idempotencyKey: key,
          },
        });
        await tx.delivery.create({
          data: {
            orderId: order.id,
            status: 'scheduled',
            confirmedAt: new Date(),
          },
        });
        await tx.orderStatusHistory.create({
          data: { orderId: order.id, toStatus: 'confirmed' },
        });
        await tx.auditLog.create({
          data: {
            actorUserId: userId,
            action: 'checkout.confirmed',
            resourceType: 'Order',
            resourceId: order.id,
            metadata: { idempotencyKey: key, totalCents: total },
          },
        });
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        return this.output(
          await tx.order.findUniqueOrThrow({
            where: { id: order.id },
            include: this.include(),
          })
        );
      },
      { isolationLevel: 'Serializable' }
    );
  }

  include() {
    return {
      items: { include: { product: true } },
      payment: true,
      delivery: true,
      address: true,
      deliverySlot: true,
      statusHistory: true,
    } as any;
  }

  output(o: any) {
    return {
      id: o.id,
      status: o.status,
      totalCents: o.totalCents,
      idempotencyKey: o.idempotencyKey,
      items: o.items.map((i: any) => ({
        productId: i.productId,
        name: i.product.name,
        quantity: i.quantity,
        unitPriceCents: i.unitPriceCents,
      })),
      payment: o.payment,
      delivery: o.delivery,
      address: o.address,
      deliverySlot: o.deliverySlot,
      statusHistory: o.statusHistory,
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
      where: { id, userId },
      include: this.include(),
    });
    if (!x) throw new NotFoundException('Pedido não encontrado');

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
    @Headers('x-idempotency-key') k: string,
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
}

@Module({
  imports: [AuthModule],
  controllers: [CartController, CheckoutController, OrdersController],
  providers: [CartOrdersService],
})
export class CartOrdersModule {}

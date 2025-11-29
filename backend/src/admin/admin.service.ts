import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { DiscountCode } from '../discount/entities/discount-code.entity';
import { Discount } from '../discount/entities/discount.entity';
import { DiscountService } from '../discount/discount.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(DiscountCode)
    private discountCodeRepository: Repository<DiscountCode>,
    @InjectRepository(Discount)
    private discountRepository: Repository<Discount>,
    private discountService: DiscountService,
  ) {}

  // Generate discount code manually (admin function)
  async generateDiscountCode(orderId: string) {
    return this.discountService.generateDiscountCodeManually(orderId);
  }

  // Get statistics: items purchased, total purchase amount, discount codes, total discount amount
  async getStatistics() {
    // Optimized query: Get total items purchased using SUM
    const totalItemsResult = await this.orderItemRepository
      .createQueryBuilder('orderItem')
      .select('SUM(orderItem.quantity)', 'total')
      .getRawOne();
    const totalItemsPurchased = parseInt(totalItemsResult?.total || '0', 10);

    // Optimized query: Get total purchase amount using SUM
    const totalPurchaseResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.total)', 'total')
      .getRawOne();
    const totalPurchaseAmount = parseFloat(totalPurchaseResult?.total || '0');

    // Get all discount codes (old system)
    const discountCodes = await this.discountCodeRepository.find({
      order: { createdAt: 'DESC' },
      take: 100, // Limit to recent 100
    });

    // Get all new discounts resct 100
    const discounts = await this.discountRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });

    // Optimized query: Get total discount amount using SUM
    const totalDiscountResult = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.discountAmount)', 'total')
      .getRawOne();
    const totalDiscountAmount = parseFloat(totalDiscountResult?.total || '0');

    return {
      totalItemsPurchased,
      totalPurchaseAmount,
      discountCodes: discountCodes.map((dc) => ({
        code: dc.code,
        isUsed: dc.isUsed,
        createdAt: dc.createdAt,
        usedAt: dc.usedAt,
      })),
      discounts: discounts.map((d) => ({
        id: d.id,
        name: d.name,
        code: d.code,
        type: d.type,
        value: d.value,
        isActive: d.isActive,
        expiresAt: d.expiresAt,
        createdAt: d.createdAt,
      })),
      totalDiscountAmount,
    };
  }
}


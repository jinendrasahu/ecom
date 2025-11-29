import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscountCode } from './entities/discount-code.entity';
import { Order } from '../order/entities/order.entity';

@Injectable()
export class DiscountService {
  // This is the nth order value - can be configured via environment variable
  private readonly NTH_ORDER = parseInt(process.env.NTH_ORDER) || 5;

  constructor(
    @InjectRepository(DiscountCode)
    private discountCodeRepository: Repository<DiscountCode>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  // Generate a unique discount code
  private generateDiscountCode(): string {
    const prefix = 'DISCOUNT';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
  }

  // Check if order is nth order and generate discount code
  async checkAndGenerateDiscountCode(orderId: string): Promise<DiscountCode | null> {
    // Count total orders from the Order table
    const totalOrders = await this.orderRepository.count();

    // Check if this is the nth order
    if (totalOrders % this.NTH_ORDER === 0) {
      // Generate new discount code
      let code = this.generateDiscountCode();
      
      // Ensure code is unique
      let existing = await this.discountCodeRepository.findOne({
        where: { code },
      });
      
      while (existing) {
        code = this.generateDiscountCode();
        existing = await this.discountCodeRepository.findOne({
          where: { code },
        });
      }

      const discountCode = this.discountCodeRepository.create({
        code,
        orderId,
        isUsed: false,
      });

      return this.discountCodeRepository.save(discountCode);
    }

    return null;
  }

  // Validate and use discount code
  async validateAndUseDiscount(code: string): Promise<DiscountCode | null> {
    const discount = await this.discountCodeRepository.findOne({
      where: { code },
    });

    if (!discount || discount.isUsed) {
      return null;
    }

    // Mark as used
    discount.isUsed = true;
    discount.usedAt = new Date();
    // In a real app, you'd set usedBy to the actual userId
    discount.usedBy = 'user';

    return this.discountCodeRepository.save(discount);
  }

  // Get all discount codes
  async getAllDiscountCodes(): Promise<DiscountCode[]> {
    return this.discountCodeRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  // Manually generate discount code (admin function)
  async generateDiscountCodeManually(orderId: string): Promise<DiscountCode> {
    let code = this.generateDiscountCode();
    
    // Ensure code is unique
    let existing = await this.discountCodeRepository.findOne({
      where: { code },
    });
    
    // I can optimiz this but as we are allowing manual discount code generation infrequently, this is acceptable
    while (existing) {
      code = this.generateDiscountCode();
      existing = await this.discountCodeRepository.findOne({
        where: { code },
      });
    }

    const discountCode = this.discountCodeRepository.create({
      code,
      orderId,
      isUsed: false,
    });

    return this.discountCodeRepository.save(discountCode);
  }
}


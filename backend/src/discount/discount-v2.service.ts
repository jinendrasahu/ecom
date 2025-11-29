import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Discount, DiscountType, DiscountConditionType } from './entities/discount.entity';
import { UserDiscount } from './entities/user-discount.entity';
import { User } from '../auth/entities/user.entity';
import { Order } from '../order/entities/order.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

@Injectable()
export class DiscountV2Service {
  constructor(
    @InjectRepository(Discount)
    private discountRepository: Repository<Discount>,
    @InjectRepository(UserDiscount)
    private userDiscountRepository: Repository<UserDiscount>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  // Create a new discount
  async create(createDiscountDto: CreateDiscountDto): Promise<Discount> {
    // Check if code already exists
    const existing = await this.discountRepository.findOne({
      where: { code: createDiscountDto.code },
    });

    if (existing) {
      throw new BadRequestException('Discount code already exists');
    }

    const discount = this.discountRepository.create({
      ...createDiscountDto,
      isListedToUser: createDiscountDto.isListedToUser ?? false,
      expiresAt: createDiscountDto.expiresAt
        ? new Date(createDiscountDto.expiresAt)
        : null,
    });

    const savedDiscount = await this.discountRepository.save(discount);

    // If discount has conditions and is not global, evaluate and assign to eligible users
    if (
      !createDiscountDto.isGlobal &&
      savedDiscount.conditionType &&
      savedDiscount.conditionValue
    ) {
      await this.evaluateAndAssignDiscount(savedDiscount.id);
    }

    return savedDiscount;
  }

  // Update a discount
  async update(id: string, updateDiscountDto: UpdateDiscountDto): Promise<Discount> {
    const discount = await this.discountRepository.findOne({ where: { id } });

    if (!discount) {
      throw new NotFoundException('Discount not found');
    }

    // Check code uniqueness if code is being updated
    if (updateDiscountDto.code && updateDiscountDto.code !== discount.code) {
      const existing = await this.discountRepository.findOne({
        where: { code: updateDiscountDto.code },
      });

      if (existing) {
        throw new BadRequestException('Discount code already exists');
      }
    }

    const wasGlobal = discount.isGlobal;
    const hadCondition = discount.conditionType && discount.conditionValue;

    Object.assign(discount, {
      ...updateDiscountDto,
      expiresAt: updateDiscountDto.expiresAt
        ? new Date(updateDiscountDto.expiresAt)
        : discount.expiresAt,
    });

    const savedDiscount = await this.discountRepository.save(discount);

    // If discount conditions changed or was made non-global, re-evaluate and assign
    const isNowGlobal = savedDiscount.isGlobal;
    const hasCondition = savedDiscount.conditionType && savedDiscount.conditionValue;

    if (
      (!isNowGlobal && hasCondition) &&
      (wasGlobal !== isNowGlobal || hadCondition !== hasCondition)
    ) {
      await this.assignDiscountToEligibleUsers(savedDiscount.id);
    }

    return savedDiscount;
  }

  // Get all discounts
  async findAll(): Promise<Discount[]> {
    return this.discountRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['userDiscounts'],
    });
  }

  // Get listed discounts for checkout display (filtered by user eligibility)
  async findListedDiscounts(userId: string): Promise<Discount[]> {
    const now = new Date();
    
    // Get all listed discounts
    const allListedDiscounts = await this.discountRepository.find({
      where: {
        isActive: true,
        isListedToUser: true,
      },
      order: { createdAt: 'DESC' },
    });

    // Filter by expiration
    const validDiscounts = allListedDiscounts.filter((discount) => {
      if (discount.expiresAt && new Date(discount.expiresAt) < now) {
        return false;
      }
      return true;
    });

    // Filter by user eligibility
    const eligibleDiscounts: Discount[] = [];
    
    for (const discount of validDiscounts) {
      // Check if user has already used this discount (for both global and non-global)
      const usedDiscount = await this.userDiscountRepository.findOne({
        where: {
          userId,
          discountId: discount.id,
          isUsed: true,
        },
      });

      if (usedDiscount) {
        // User has already used this discount, skip it
        continue;
      }

      // Global discounts are available to everyone (who hasn't used them)
      if (discount.isGlobal) {
        eligibleDiscounts.push(discount);
        continue;
      }

      // For non-global discounts, check if user has it assigned
      const userDiscount = await this.userDiscountRepository.findOne({
        where: {
          userId,
          discountId: discount.id,
          isUsed: false,
        },
      });

      if (userDiscount) {
        // Check user discount expiration
        if (
          !userDiscount.expiresAt ||
          new Date(userDiscount.expiresAt) >= now
        ) {
          eligibleDiscounts.push(discount);
        }
      } else if (discount.conditionType && discount.conditionValue) {
        // If not assigned but has condition, check if user meets condition now
        const meetsCondition = await this.evaluateCondition(
          userId,
          discount.conditionType,
          discount.conditionValue,
        );
        
        if (meetsCondition) {
          // Assign the discount to the user
          const newUserDiscount = this.userDiscountRepository.create({
            userId,
            discountId: discount.id,
            expiresAt: discount.expiresAt,
          });
          try {
            await this.userDiscountRepository.save(newUserDiscount);
          } catch (err: any) {
            // Ignore duplicate key errors that can occur due to race conditions
            // when multiple requests assign the same discount concurrently.
            // Postgres unique violation code is '23505'.
            const code = err && (err.code || (err?.driverError && err.driverError.code));
            if (code === '23505') {
              // Another process already inserted the record — safe to ignore
            } else {
              throw err;
            }
          }
          eligibleDiscounts.push(discount);
        }
      }
    }

    return eligibleDiscounts;
  }

  // Get disount by ID
  async findOne(id: string): Promise<Discount> {
    const discount = await this.discountRepository.findOne({
      where: { id },
      relations: ['userDiscounts', 'userDiscounts.user'],
    });

    if (!discount) {
      throw new NotFoundException('Discount not found');
    }

    return discount;
  }

  // Delete a discount
  async remove(id: string): Promise<void> {
    const discount = await this.discountRepository.findOne({ where: { id } });

    if (!discount) {
      throw new NotFoundException('Discount not found');
    }

    // Delete associated user discounts
    await this.userDiscountRepository.delete({ discountId: id });

    await this.discountRepository.remove(discount);
  }

  // Evaluate discount conditions and assign to eligible users
  async evaluateAndAssignDiscount(discountId: string): Promise<void> {
    return this.assignDiscountToEligibleUsers(discountId);
  }

  // Assign discount to elgible users based on conditions
  async assignDiscountToEligibleUsers(discountId: string): Promise<void> {
    const discount = await this.discountRepository.findOne({ where: { id: discountId } });

    if (!discount) {
      return;
    }

    // If discount is global, no need to asign to specific users
    if (discount.isGlobal) {
      return;
    }

    // If no condition, don't assign
    if (!discount.conditionType || !discount.conditionValue) {
      return;
    }

    // Get all users
    const users = await this.userRepository.find();

    for (const user of users) {
      try {
        const meetsCondition = await this.evaluateCondition(
          user.id,
          discount.conditionType,
          discount.conditionValue,
        );

        if (meetsCondition) {
          // Check if user already has this discount
          const existing = await this.userDiscountRepository.findOne({
            where: { userId: user.id, discountId },
          });

          if (!existing) {
            const userDiscount = this.userDiscountRepository.create({
              userId: user.id,
              discountId,
              expiresAt: discount.expiresAt,
            });

            try {
              await this.userDiscountRepository.save(userDiscount);
            } catch (err: any) {
              // Ignore duplicate key errors that can occur due to race conditions
              // when multiple requests assign the same discount concurrently.
              // Postgres unique violation code is '23505'.
              const code = err && (err.code || (err?.driverError && err.driverError.code));
              if (code === '23505') {
                // Another process already inserted the record — safe to ignore
              } else {
                throw err;
              }
            }
          }
        }
      } catch (error) {
        // Log error but continue with other users
        console.error(`Error evaluating condition for user ${user.id}:`, error);
      }
    }
  }

  async validateDiscountCode(
    userId: string,
    code: string,
    orderTotal: number = 0,
  ): Promise<{ discount: Discount; discountAmount: number }> {
    const discount = await this.discountRepository.findOne({
      where: { code, isActive: true },
    });

    if (!discount) {
      throw new BadRequestException('Invalid discount code');
    }

    // Check expiration
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      throw new BadRequestException('Discount code has expired');
    }

    // Check if it's a global discount
    if (discount.isGlobal) {
      // Check if user has already used this global discount
      const existingUsage = await this.userDiscountRepository.findOne({
        where: {
          userId,
          discountId: discount.id,
          isUsed: true,
        },
      });

      if (existingUsage) {
        throw new BadRequestException('You have already used this discount code');
      }

      const discountAmount = orderTotal
        ? this.calculateDiscountAmount(discount, orderTotal)
        : 0;
      return {
        discount,
        discountAmount,
      };
    }

    // For non-global discounts, check if user has it assigned
    const userDiscount = await this.userDiscountRepository.findOne({
      where: {
        userId,
        discountId: discount.id,
        isUsed: false,
      },
    });

    if (!userDiscount) {
      // If not assigned, check if user meets condition
      if (discount.conditionType && discount.conditionValue) {
        const meetsCondition = await this.evaluateCondition(
          userId,
          discount.conditionType,
          discount.conditionValue,
        );

        if (!meetsCondition) {
          throw new BadRequestException(
            'You do not meet the requirements for this discount code',
          );
        }

        // Assign the discount to the user
        const newUserDiscount = this.userDiscountRepository.create({
          userId,
          discountId: discount.id,
          expiresAt: discount.expiresAt,
        });
        try {
          await this.userDiscountRepository.save(newUserDiscount);
        } catch (err: any) {
          // Ignore duplicate key errors that can occur due to race conditions
          // when multiple requests assign the same discount concurrently.
          // Postgres unique violation code is '23505'.
          const code = err && (err.code || (err?.driverError && err.driverError.code));
          if (code === '23505') {
            // Another process already inserted the record — safe to ignore
          } else {
            throw err;
          }
        }
      } else {
        throw new BadRequestException('Discount code is not available for you');
      }
    } else {
      // Check user discount expiration
      if (
        userDiscount.expiresAt &&
        new Date(userDiscount.expiresAt) < new Date()
      ) {
        throw new BadRequestException('Your discount code has expired');
      }

      // Re-validate condition even if assigned (in case conditions changed)
      if (discount.conditionType && discount.conditionValue) {
        const stillMeetsCondition = await this.evaluateCondition(
          userId,
          discount.conditionType,
          discount.conditionValue,
        );

        if (!stillMeetsCondition) {
          throw new BadRequestException(
            'You no longer meet the requirements for this discount code',
          );
        }
      }
    }

    const discountAmount = orderTotal
      ? this.calculateDiscountAmount(discount, orderTotal)
      : 0;

    return {
      discount,
      discountAmount,
    };
  }

  // Evaluate if a user meets the discount cndition
  private async evaluateCondition(
    userId: string,
    conditionType: DiscountConditionType,
    conditionValue: any,
  ): Promise<boolean> {
    switch (conditionType) {
      case DiscountConditionType.ORDER_COUNT:
        const orderCount = await this.orderRepository.count({
          where: { userId },
        });
        return orderCount >= (conditionValue.orderCount || 0);

      case DiscountConditionType.MINIMUM_SPEND:
        const orders = await this.orderRepository.find({
          where: { userId },
        });
        const totalSpent = orders.reduce(
          (sum, order) => sum + parseFloat(order.total.toString()),
          0,
        );
        return totalSpent >= (conditionValue.minimumSpend || 0);

      case DiscountConditionType.FIRST_ORDER:
        const firstOrderCount = await this.orderRepository.count({
          where: { userId },
        });
        return firstOrderCount === 0; // User hasn't placed any order yet

      case DiscountConditionType.CUSTOM:
        // For custom conditions, you can extend this logic
        return true; // Placeholder

      default:
        return false;
    }
  }

  // Get available discounts for a user
  async getAvailableDiscountsForUser(userId: string): Promise<Discount[]> {
    const now = new Date();

    // Get global active discounts
    const globalDiscounts = await this.discountRepository.find({
      where: {
        isGlobal: true,
        isActive: true,
      },
    });

    // Get user-specific discounts
    const userDiscounts = await this.userDiscountRepository.find({
      where: {
        userId,
        isUsed: false,
      },
      relations: ['discount'],
    });

    const userSpecificDiscounts = userDiscounts
      .map((ud) => ud.discount)
      .filter((d) => d && d.isActive);

    // Combine and filter by expiration
    const allDiscounts = [...globalDiscounts, ...userSpecificDiscounts];

    return allDiscounts.filter((discount) => {
      if (discount.expiresAt && new Date(discount.expiresAt) < now) {
        return false;
      }
      return true;
    });
  }

  // Validate and use a discount for a user
  async validateAndUseDiscount(
    userId: string,
    code: string,
  ): Promise<{ discount: Discount; discountAmount: number } | null> {
    const discount = await this.discountRepository.findOne({
      where: { code, isActive: true },
    });

    if (!discount) {
      return null;
    }

    // Check expiration
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return null;
    }

    // Check if it's a global discount or user-specific
    if (discount.isGlobal) {
      // Check if user has already used this global discount
      const existingUsage = await this.userDiscountRepository.findOne({
        where: {
          userId,
          discountId: discount.id,
          isUsed: true,
        },
      });

      if (existingUsage) {
        return null; // User has already used this discount
      }

      // Check if there's an unused record (shouldn't happen for global, but check anyway)
      const unusedRecord = await this.userDiscountRepository.findOne({
        where: {
          userId,
          discountId: discount.id,
          isUsed: false,
        },
      });

      // If no record exists, create one to track usage
      if (!unusedRecord) {
        const newUserDiscount = this.userDiscountRepository.create({
          userId,
          discountId: discount.id,
          expiresAt: discount.expiresAt,
        });
        try {
          await this.userDiscountRepository.save(newUserDiscount);
        } catch (err: any) {
          // Ignore duplicate key errors
          const code = err && (err.code || (err?.driverError && err.driverError.code));
          if (code !== '23505') {
            throw err;
          }
        }
      }

      return {
        discount,
        discountAmount: 0, // Will be calculated based on order total
      };
    } else {
      // Check if user has this discount assigned
      const userDiscount = await this.userDiscountRepository.findOne({
        where: {
          userId,
          discountId: discount.id,
          isUsed: false,
        },
      });

      if (!userDiscount) {
        return null;
      }

      // Check user discount expiration
      if (
        userDiscount.expiresAt &&
        new Date(userDiscount.expiresAt) < new Date()
      ) {
        return null;
      }

      return {
        discount,
        discountAmount: 0, // Will be calculated based on order total
      };
    }
  }

  // Mark discount as used
  async markDiscountAsUsed(
    userId: string,
    discountId: string,
    orderId: string,
  ): Promise<void> {
    // Try to find an unused record first
    let userDiscount = await this.userDiscountRepository.findOne({
      where: {
        userId,
        discountId,
        isUsed: false,
      },
    });

    // If no unused record exists (e.g., for global discounts), create one
    if (!userDiscount) {
      const discount = await this.discountRepository.findOne({
        where: { id: discountId },
      });
      if (discount) {
        userDiscount = this.userDiscountRepository.create({
          userId,
          discountId,
          expiresAt: discount.expiresAt,
        });
        try {
          await this.userDiscountRepository.save(userDiscount);
        } catch (err: any) {
          // If record already exists, fetch it
          const code = err && (err.code || (err?.driverError && err.driverError.code));
          if (code === '23505') {
            userDiscount = await this.userDiscountRepository.findOne({
              where: {
                userId,
                discountId,
              },
            });
          } else {
            throw err;
          }
        }
      }
    }

    if (userDiscount && !userDiscount.isUsed) {
      userDiscount.isUsed = true;
      userDiscount.usedAt = new Date();
      userDiscount.orderId = orderId;
      await this.userDiscountRepository.save(userDiscount);
    }
  }

  // Calculate discount amount based on order total
  calculateDiscountAmount(discount: Discount, orderTotal: number): number {
    if (discount.type === DiscountType.PERCENTAGE) {
      return (orderTotal * discount.value) / 100;
    } else {
      // Fixed amount
      return Math.min(discount.value, orderTotal); // Can't discount more than order total
    }
  }
}

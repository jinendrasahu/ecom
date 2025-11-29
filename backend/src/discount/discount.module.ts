import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountService } from './discount.service';
import { DiscountV2Service } from './discount-v2.service';
import { DiscountCode } from './entities/discount-code.entity';
import { Discount } from './entities/discount.entity';
import { UserDiscount } from './entities/user-discount.entity';
import { Order } from '../order/entities/order.entity';
import { User } from '../auth/entities/user.entity';
import { DiscountController } from './discount.controller';
import { DiscountV2Controller } from './discount-v2.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DiscountCode,
      Discount,
      UserDiscount,
      Order,
      User,
    ]),
  ],
  providers: [DiscountService, DiscountV2Service],
  controllers: [DiscountController, DiscountV2Controller],
  exports: [DiscountService, DiscountV2Service],
})
export class DiscountModule {}


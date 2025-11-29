import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Order } from '../order/entities/order.entity';
import { OrderItem } from '../order/entities/order-item.entity';
import { DiscountCode } from '../discount/entities/discount-code.entity';
import { Discount } from '../discount/entities/discount.entity';
import { DiscountModule } from '../discount/discount.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, DiscountCode, Discount]),
    DiscountModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}


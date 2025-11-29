import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { DiscountModule } from './discount/discount.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { FavoriteModule } from './favorite/favorite.module';
import { CategoryModule } from './category/category.module';
import { Product } from './product/entities/product.entity';
import { CartItem } from './cart/entities/cart-item.entity';
import { Order } from './order/entities/order.entity';
import { OrderItem } from './order/entities/order-item.entity';
import { DiscountCode } from './discount/entities/discount-code.entity';
import { Discount } from './discount/entities/discount.entity';
import { UserDiscount } from './discount/entities/user-discount.entity';
import { User } from './auth/entities/user.entity';
import { Role } from './auth/entities/role.entity';
import { Favorite } from './favorite/entities/favorite.entity';
import { Category } from './category/entities/category.entity';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Database configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_NAME || 'ecommerce',
      entities: [Product, CartItem, Order, OrderItem, DiscountCode, Discount, UserDiscount, User, Role, Favorite, Category],
      synchronize: process.env.SYNCHRONIZE === 'true' ? true : false,
    }),
    AuthModule,
    CategoryModule,
    ProductModule,
    CartModule,
    OrderModule,
    DiscountModule,
    AdminModule,
    FavoriteModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}


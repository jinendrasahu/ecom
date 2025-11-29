import { Controller, Post, Get, Put, Body, Param, Query, BadRequestException } from '@nestjs/common';
import { OrderService } from './order.service';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  async checkout(
    @CurrentUser() user: any,
    @Body() checkoutDto: CheckoutDto,
  ) {
    return this.orderService.checkout(user.id, checkoutDto);
  }

  @Get()
  async getUserOrders(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.orderService.getUserOrders(user.id, pageNum, limitNum);
  }

  @Roles('admin')
  @Get('admin/all')
  async getAllOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.orderService.getAllOrders(pageNum, limitNum);
  }

  @Get(':id')
  async getOrderById(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    const order = await this.orderService.getOrderById(id);
    // Users can only view their own orders unless they're admin
    const userRole = user.role?.name || user.role || 'customer';
    if (userRole !== 'admin' && order.userId !== user.id) {
      throw new BadRequestException('You can only view your own orders');
    }
    return order;
  }

  @Roles('admin')
  @Put(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(id, updateStatusDto);
  }
}


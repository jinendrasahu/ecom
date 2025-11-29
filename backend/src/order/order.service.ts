import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { DiscountService } from '../discount/discount.service';
import { DiscountV2Service } from '../discount/discount-v2.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    private cartService: CartService,
    private productService: ProductService,
    private discountService: DiscountService,
    private discountV2Service: DiscountV2Service,
  ) {}

  // Process checkout and create order
  async checkout(userId: string, checkoutDto: CheckoutDto): Promise<Order> {
    // Get cart items
    const cartItems = await this.cartService.getCart(userId);

    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Calculate subtotal
    let subtotal = 0;
    for (const item of cartItems) {
      subtotal += item.product.price * item.quantity;
    }

    // Validate and apply discount code if provided
    let discountAmount = 0;
    let discountCode = null;
    let appliedDiscountV2Id: string | null = null;

    if (checkoutDto.discountCode) {
      const advancedDiscount = await this.discountV2Service.validateAndUseDiscount(
        userId,
        checkoutDto.discountCode,
      );

      if (advancedDiscount) {
        discountCode = checkoutDto.discountCode;
        appliedDiscountV2Id = advancedDiscount.discount.id;
        discountAmount = this.discountV2Service.calculateDiscountAmount(
          advancedDiscount.discount,
          subtotal,
        );
      } else {
        const legacyDiscount = await this.discountService.validateAndUseDiscount(
          checkoutDto.discountCode,
        );

        if (!legacyDiscount) {
          throw new BadRequestException('Invalid or already used discount code');
        }

        discountCode = checkoutDto.discountCode;
        discountAmount = subtotal * 0.1; // Legacy flat discount
      }
    }

    const total = subtotal - discountAmount;

    // Create order with pending status
    const order = this.orderRepository.create({
      userId,
      subtotal,
      discountAmount,
      total,
      discountCode,
      status: 'pending',
    });

    const savedOrder = await this.orderRepository.save(order);

    // Create order items and update product stock
    const orderItems = [];
    for (const cartItem of cartItems) {
      const orderItem = this.orderItemRepository.create({
        orderId: savedOrder.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        price: cartItem.product.price,
      });
      orderItems.push(orderItem);

      // Update product stock
      await this.productService.updateStock(
        cartItem.productId,
        cartItem.quantity,
      );
    }

    await this.orderItemRepository.save(orderItems);

    // Clear cart
    await this.cartService.clearCart(userId);

    // Check if this is the nth order and generate discount code
    await this.discountService.checkAndGenerateDiscountCode(savedOrder.id);

    if (appliedDiscountV2Id) {
      await this.discountV2Service.markDiscountAsUsed(
        userId,
        appliedDiscountV2Id,
        savedOrder.id,
      );
    }

    // Return order with items
    return this.orderRepository.findOne({
      where: { id: savedOrder.id },
      relations: ['items', 'items.product'],
    });
  }

  // Get all orders for a user with pagination
  async getUserOrders(userId: string, page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
    // Ensure page and limit are valid numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    const [orders, total] = await this.orderRepository.findAndCount({
      where: { userId },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
      skip: Math.max(0, skip),
      take: Math.max(1, limitNum),
    });

    return {
      orders,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  // Get order by ID
  async getOrderById(id: string): Promise<Order> {
    return this.orderRepository.findOne({
      where: { id },
      relations: ['items', 'items.product'],
    });
  }

  // Get all orders (admin only) with pagination
  async getAllOrders(page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number; page: number; totalPages: number }> {
    // Ensure page and limit are valid numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    const [orders, total] = await this.orderRepository.findAndCount({
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
      skip: Math.max(0, skip),
      take: Math.max(1, limitNum),
    });

    return {
      orders,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  // Update order status (admin only)
  async updateOrderStatus(
    id: string,
    updateStatusDto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousStatus = order.status;
    order.status = updateStatusDto.status;

    // If order is being cancelled, restore product stock
    if (updateStatusDto.status === 'cancelled' && previousStatus !== 'cancelled') {
      const orderItems = await this.orderItemRepository.find({
        where: { orderId: id },
      });

      for (const item of orderItems) {
        await this.productService.restoreStock(item.productId, item.quantity);
      }
    }

    // If order was cancelled and is now being reactivated, decrease stock again
    if (previousStatus === 'cancelled' && updateStatusDto.status !== 'cancelled') {
      const orderItems = await this.orderItemRepository.find({
        where: { orderId: id },
      });

      for (const item of orderItems) {
        await this.productService.updateStock(item.productId, item.quantity);
      }
    }

    // Set timestamps based on status
    if (updateStatusDto.status === 'shipped') {
      order.shippedAt = new Date();
      if (updateStatusDto.trackingNumber) {
        order.trackingNumber = updateStatusDto.trackingNumber;
      }
    } else if (updateStatusDto.status === 'delivered') {
      order.deliveredAt = new Date();
    }

    return this.orderRepository.save(order);
  }
}


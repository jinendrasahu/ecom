import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CartItem } from './entities/cart-item.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { ProductService } from '../product/product.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    private productService: ProductService,
  ) {}

  // Add item to cart or update quantity if already exists
  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<CartItem> {
    const { productId, quantity } = addToCartDto;

    // Check if product exists and has enough stock
    const product = await this.productService.findOne(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new Error('Insufficient stock');
    }

    // Check if item already exists in cart
    const existingItem = await this.cartItemRepository.findOne({
      where: { userId, productId },
    });

    if (existingItem) {
      // Update quantity
      existingItem.quantity += quantity;
      return this.cartItemRepository.save(existingItem);
    } else {
      // Create new cart item
      const cartItem = this.cartItemRepository.create({
        userId,
        productId,
        quantity,
      });
      return this.cartItemRepository.save(cartItem);
    }
  }

  // Get all items in user's cart
  async getCart(userId: string): Promise<CartItem[]> {
    return this.cartItemRepository.find({
      where: { userId },
      relations: ['product', 'product.category'],
    });
  }

  // Remove item from cart
  async removeFromCart(userId: string, cartItemId: string): Promise<void> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId, userId },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.remove(cartItem);
  }

  // Clear user's cart
  async clearCart(userId: string): Promise<void> {
    await this.cartItemRepository.delete({ userId });
  }

  // Update cart item quantity
  async updateQuantity(
    userId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<CartItem> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id: cartItemId, userId },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    cartItem.quantity = quantity;
    return this.cartItemRepository.save(cartItem);
  }
}


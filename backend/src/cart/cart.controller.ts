import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('add')
  async addToCart(
    @CurrentUser() user: any,
    @Body() addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addToCart(user.id, addToCartDto);
  }

  @Get()
  async getCart(@CurrentUser() user: any) {
    return this.cartService.getCart(user.id);
  }

  @Delete(':id')
  async removeFromCart(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    await this.cartService.removeFromCart(user.id, id);
    return { message: 'Item removed from cart' };
  }

  @Put(':id')
  async updateQuantity(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('quantity') quantity: number,
  ) {
    return this.cartService.updateQuantity(user.id, id, quantity);
  }
}


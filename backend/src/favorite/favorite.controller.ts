import { Controller, Get, Post, Delete, Param } from '@nestjs/common';
import { FavoriteService } from './favorite.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('favorites')
export class FavoriteController {
  constructor(private readonly favoriteService: FavoriteService) {}

  @Post(':productId')
  async addToFavorites(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    return this.favoriteService.addToFavorites(user.id, productId);
  }

  @Delete(':productId')
  async removeFromFavorites(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    await this.favoriteService.removeFromFavorites(user.id, productId);
    return { message: 'Removed from favorites' };
  }

  @Get()
  async getUserFavorites(@CurrentUser() user: any) {
    return this.favoriteService.getUserFavorites(user.id);
  }

  @Get('check/:productId')
  async isFavorite(
    @CurrentUser() user: any,
    @Param('productId') productId: string,
  ) {
    const isFav = await this.favoriteService.isFavorite(user.id, productId);
    return { isFavorite: isFav };
  }

  @Get('ids')
  async getFavoriteProductIds(@CurrentUser() user: any) {
    const ids = await this.favoriteService.getFavoriteProductIds(user.id);
    return { productIds: ids };
  }
}


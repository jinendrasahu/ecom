import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './entities/favorite.entity';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class FavoriteService {
  constructor(
    @InjectRepository(Favorite)
    private favoriteRepository: Repository<Favorite>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  // Add product to favorites
  async addToFavorites(userId: string, productId: string): Promise<Favorite> {
    // Check if product exists
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already in favorites
    const existing = await this.favoriteRepository.findOne({
      where: { userId, productId },
    });

    if (existing) {
      return existing; 
    }

    // Create new favorite
    const favorite = this.favoriteRepository.create({
      userId,
      productId,
    });

    return this.favoriteRepository.save(favorite);
  }

  // Remove product from favorites
  async removeFromFavorites(userId: string, productId: string): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, productId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
  }

  // Get all favorite products for a user
  async getUserFavorites(userId: string): Promise<Favorite[]> {
    return this.favoriteRepository.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  // Check if product is in favorites
  async isFavorite(userId: string, productId: string): Promise<boolean> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, productId },
    });
    return !!favorite;
  }

  // Get favorite product IDs for a user
  async getFavoriteProductIds(userId: string): Promise<string[]> {
    const favorites = await this.favoriteRepository.find({
      where: { userId },
      select: ['productId'],
    });
    return favorites.map((f) => f.productId);
  }
}


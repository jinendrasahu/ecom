import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CategoryService } from '../category/category.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private categoryService: CategoryService,
  ) {}

  // Get all active products with pagination
  async findAll(page: number = 1, limit: number = 12): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    // Ensure page and limit are valid numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 12;
    const skip = (pageNum - 1) * limitNum;
    
    const [products, total] = await this.productRepository.findAndCount({
      where: { isActive: true },
      relations: ['category'],
      order: { createdAt: 'DESC' },
      skip: Math.max(0, skip),
      take: Math.max(1, limitNum),
    });

    return {
      products,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  // Get all products (including inactive) - for admin with pagination
  async findAllAdmin(page: number = 1, limit: number = 12): Promise<{ products: Product[]; total: number; page: number; totalPages: number }> {
    // Ensure page and limit are valid numbers
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 12;
    const skip = (pageNum - 1) * limitNum;
    
    const [products, total] = await this.productRepository.findAndCount({
      relations: ['category'],
      order: { createdAt: 'DESC' },
      skip: Math.max(0, skip),
      take: Math.max(1, limitNum),
    });

    return {
      products,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  // Get a single product by ID
  async findOne(id: string): Promise<Product> {
    return this.productRepository.findOne({ 
      where: { id },
      relations: ['category'],
    });
  }

  // Create a new product
  async create(createProductDto: CreateProductDto): Promise<Product> {
    // If categoryId is provided, verify it exists
    if (createProductDto.categoryId && createProductDto.categoryId !== null) {
      const category = await this.categoryService.findOne(createProductDto.categoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }
    // Ensure categoryId is null if empty string
    const productData = {
      ...createProductDto,
      categoryId: createProductDto.categoryId || null,
    };
    const product = this.productRepository.create(productData);
    return this.productRepository.save(product);
  }

  // Update a product
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If categoryId is provided, verify it exists (unless it's null/undefined to clear category)
    if (updateProductDto.categoryId !== undefined && updateProductDto.categoryId !== null) {
      const category = await this.categoryService.findOne(updateProductDto.categoryId);
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    Object.assign(product, updateProductDto);
    return this.productRepository.save(product);
  }

  // Deactivate a product
  async deactivate(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.isActive = false;
    return this.productRepository.save(product);
  }

  // Activate a product
  async activate(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    product.isActive = true;
    return this.productRepository.save(product);
  }

  // Update product stock after purchase (decrease)
  async updateStock(id: string, quantity: number): Promise<void> {
    await this.productRepository.decrement({ id }, 'stock', quantity);
  }

  // Restore product stock when order is cancelled (increase)
  async restoreStock(id: string, quantity: number): Promise<void> {
    await this.productRepository.increment({ id }, 'stock', quantity);
  }
}


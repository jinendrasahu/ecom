import { Controller, Get, Param } from '@nestjs/common';
import { CategoryService } from './category.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  async findAll() {
    return this.categoryService.findAll();
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }
}


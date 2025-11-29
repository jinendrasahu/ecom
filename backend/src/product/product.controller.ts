import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Public()
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? (isNaN(parseInt(page, 10)) ? 1 : parseInt(page, 10)) : 1;
    const limitNum = limit ? (isNaN(parseInt(limit, 10)) ? 12 : parseInt(limit, 10)) : 12;
    return this.productService.findAll(pageNum, limitNum);
  }

  @Roles('admin')
  @Get('admin/all')
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? (isNaN(parseInt(page, 10)) ? 1 : parseInt(page, 10)) : 1;
    const limitNum = limit ? (isNaN(parseInt(limit, 10)) ? 12 : parseInt(limit, 10)) : 12;
    return this.productService.findAllAdmin(pageNum, limitNum);
  }

  @Public()
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Roles('admin')
  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, cb) => {
          // Generate unique filename
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // If no file is provided, allow the request (file is optional)
        if (!file) {
          cb(null, true);
          return;
        }
        // Accept only images - check mimetype starts with image/
        if (!file.mimetype.startsWith('image/')) {
          cb(new Error('Only image files are allowed!'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // If file uploaded, set the imageUrl
    if (file) {
      createProductDto.imageUrl = `/uploads/products/${file.filename}`;
    }
    // Ensure price and stock are numbers (handle string conversion from form-data)
    if (typeof createProductDto.price === 'string') {
      createProductDto.price = parseFloat(createProductDto.price);
    }
    if (createProductDto.stock && typeof createProductDto.stock === 'string') {
      createProductDto.stock = parseInt(createProductDto.stock, 10);
    }
    // Handle empty categoryId - convert to null
    if (createProductDto.categoryId === '' || createProductDto.categoryId === undefined) {
      createProductDto.categoryId = null;
    }
    return this.productService.create(createProductDto);
  }

  @Roles('admin')
  @Put(':id')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads/products',
        filename: (req, file, cb) => {
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join('');
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // If no file is provided, allow the request (file is optional for updates)
        if (!file) {
          cb(null, true);
          return;
        }
        // Accept only images
        if (!file.mimetype.startsWith('image/')) {
          cb(new Error('Only image files are allowed!'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (file) {
      updateProductDto.imageUrl = `/uploads/products/${file.filename}`;
    }
    // Ensure price and stock are numbers (handle string conversion from form-data)
    if (updateProductDto.price && typeof updateProductDto.price === 'string') {
      updateProductDto.price = parseFloat(updateProductDto.price);
    }
    if (updateProductDto.stock && typeof updateProductDto.stock === 'string') {
      updateProductDto.stock = parseInt(updateProductDto.stock, 10);
    }
    // Handle categoryId - if empty string, set to null to clear category
    if (updateProductDto.categoryId === '' || updateProductDto.categoryId === undefined) {
      updateProductDto.categoryId = null;
    }
    return this.productService.update(id, updateProductDto);
  }

  @Roles('admin')
  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return this.productService.deactivate(id);
  }

  @Roles('admin')
  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    return this.productService.activate(id);
  }
}


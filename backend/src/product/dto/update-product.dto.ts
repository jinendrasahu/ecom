import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  Max,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class UpdateProductDto {
  @IsString()
  @MinLength(1, { message: 'Name cannot be empty' })
  @MaxLength(255, { message: 'Name must be less than 255 characters' })
  @IsOptional()
  name?: string;

  @IsString()
  @MinLength(1, { message: 'Description cannot be empty' })
  @MaxLength(2000, { message: 'Description must be less than 2000 characters' })
  @IsOptional()
  description?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a valid number' })
  @Min(0.01, { message: 'Price must be greater than 0' })
  @Max(999999.99, { message: 'Price must be less than 1,000,000' })
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Stock must be a valid number' })
  @Min(0, { message: 'Stock cannot be negative' })
  @IsOptional()
  stock?: number;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Transform(({ value }) => (value === '' ? null : value))
  @IsUUID(4, { message: 'Category ID must be a valid UUID' })
  @IsOptional()
  categoryId?: string | null;
}

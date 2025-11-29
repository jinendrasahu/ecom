import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ValidateDiscountDto {
  @IsString()
  code: string;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  orderTotal?: number;
}


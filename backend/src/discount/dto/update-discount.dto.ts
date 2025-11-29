import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsDateString,
  Min,
  Max,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType, DiscountConditionType } from '../entities/discount.entity';

export class UpdateDiscountDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(DiscountType)
  @IsOptional()
  type?: DiscountType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.type === DiscountType.PERCENTAGE)
  @Max(100)
  @IsOptional()
  value?: number;

  @IsEnum(DiscountConditionType)
  @IsOptional()
  conditionType?: DiscountConditionType;

  @IsOptional()
  conditionValue?: any;

  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isGlobal?: boolean;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  isListedToUser?: boolean;
}


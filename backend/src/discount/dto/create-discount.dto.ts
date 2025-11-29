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

export class CreateDiscountDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  code: string;

  @IsEnum(DiscountType)
  type: DiscountType;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ValidateIf((o) => o.type === DiscountType.PERCENTAGE)
  @Max(100)
  value: number;

  @IsEnum(DiscountConditionType)
  @IsOptional()
  conditionType?: DiscountConditionType;

  @IsOptional()
  conditionValue?: any; // JSON object

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


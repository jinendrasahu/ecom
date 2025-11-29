import { IsString, IsIn, IsOptional } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
  status: string;

  @IsString()
  @IsOptional()
  trackingNumber?: string;
}


import { Controller, Get } from '@nestjs/common';
import { DiscountService } from './discount.service';

@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Get('codes')
  async getAllDiscountCodes() {
    return this.discountService.getAllDiscountCodes();
  }
}


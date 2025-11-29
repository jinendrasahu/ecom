import { Controller, Get, Post, Put, Delete, Body, Param, Query, UnauthorizedException } from '@nestjs/common';
import { DiscountV2Service } from './discount-v2.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ValidateDiscountDto } from './dto/validate-discount.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('discounts-v2')
export class DiscountV2Controller {
  constructor(private readonly discountV2Service: DiscountV2Service) {}

  @Roles('admin')
  @Post()
  async create(@Body() createDiscountDto: CreateDiscountDto) {
    return this.discountV2Service.create(createDiscountDto);
  }

  @Roles('admin')
  @Get()
  async findAll() {
    return this.discountV2Service.findAll();
  }

  @Get('listed')
  async findListed(@CurrentUser() user: any) {
    if (!user) {
      return [];
    }
    return this.discountV2Service.findListedDiscounts(user.id);
  }

  @Post('validate')
  async validateDiscount(
    @CurrentUser() user: any,
    @Body() validateDiscountDto: ValidateDiscountDto,
  ) {
    if (!user || !user.id) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.discountV2Service.validateDiscountCode(
      user.id,
      validateDiscountDto.code,
      validateDiscountDto.orderTotal,
    );
  }

  @Roles('admin')
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.discountV2Service.findOne(id);
  }

  @Roles('admin')
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateDiscountDto: UpdateDiscountDto,
  ) {
    return this.discountV2Service.update(id, updateDiscountDto);
  }

  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.discountV2Service.remove(id);
    return { message: 'Discount deleted successfully' };
  }

  @Roles('admin')
  @Post(':id/assign-to-eligible-users')
  async assignToEligibleUsers(@Param('id') id: string) {
    await this.discountV2Service.assignDiscountToEligibleUsers(id);
    return { message: 'Discount assigned to eligible users' };
  }
}


import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Generate discount code manually
  @Post('discount/generate')
  async generateDiscountCode(@Body('orderId') orderId: string) {
    return this.adminService.generateDiscountCode(orderId);
  }

  // Get statistics
  @Get('statistics')
  async getStatistics() {
    return this.adminService.getStatistics();
  }
}


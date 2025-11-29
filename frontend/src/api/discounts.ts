import { apiClient } from './client';
import { Discount } from './admin';

export interface ListedDiscount extends Discount {}

export const discountApi = {
  getListedDiscounts: async (): Promise<ListedDiscount[]> => {
    const response = await apiClient.get('/discounts-v2/listed');
    return response.data;
  },

  validateDiscountCode: async (
    code: string,
    orderTotal: number,
  ): Promise<{ discountAmount: number; discount: ListedDiscount }> => {
    const response = await apiClient.post('/discounts-v2/validate', {
      code,
      orderTotal,
    });
    return response.data;
  },
};


import { apiClient } from './client';

export interface AdminStatistics {
  totalItemsPurchased: number;
  totalPurchaseAmount: number;
  discountCodes: Array<{
    code: string;
    isUsed: boolean;
    createdAt: string;
    usedAt: string | null;
  }>;
  discounts: Array<{
    id: string;
    name: string;
    code: string;
    type: string;
    value: number;
    isActive: boolean;
    expiresAt: string | null;
    createdAt: string;
  }>;
  totalDiscountAmount: number;
}

export interface Discount {
  id: string;
  name: string;
  description?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  conditionType?: 'order_count' | 'minimum_spend' | 'first_order' | 'custom' | null;
  conditionValue?: any;
  expiresAt?: string | null;
  isActive: boolean;
  isGlobal: boolean;
  isListedToUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDiscountDto {
  name: string;
  description?: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  conditionType?: 'order_count' | 'minimum_spend' | 'first_order' | 'custom';
  conditionValue?: any;
  expiresAt?: string;
  isActive?: boolean;
  isGlobal?: boolean;
  isListedToUser?: boolean;
}

export const adminApi = {
  getStatistics: async (): Promise<AdminStatistics> => {
    const response = await apiClient.get('/admin/statistics');
    return response.data;
  },

  generateDiscountCode: async (orderId: string) => {
    const response = await apiClient.post('/admin/discount/generate', { orderId });
    return response.data;
  },

  // Discount V2 APIs
  getDiscounts: async (): Promise<Discount[]> => {
    const response = await apiClient.get('/discounts-v2');
    return response.data;
  },

  getDiscount: async (id: string): Promise<Discount> => {
    const response = await apiClient.get(`/discounts-v2/${id}`);
    return response.data;
  },

  createDiscount: async (data: CreateDiscountDto): Promise<Discount> => {
    const response = await apiClient.post('/discounts-v2', data);
    return response.data;
  },

  updateDiscount: async (id: string, data: Partial<CreateDiscountDto>): Promise<Discount> => {
    const response = await apiClient.put(`/discounts-v2/${id}`, data);
    return response.data;
  },

  deleteDiscount: async (id: string): Promise<void> => {
    await apiClient.delete(`/discounts-v2/${id}`);
  },

  evaluateDiscount: async (id: string): Promise<void> => {
    await apiClient.post(`/discounts-v2/${id}/assign-to-eligible-users`);
  },
};

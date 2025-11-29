import { apiClient } from './client';

export interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  product: {
    id: string;
    name: string;
    imageUrl: string;
  };
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  discountCode: string | null;
  status: string;
  trackingNumber?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PaginatedOrders {
  orders: Order[];
  total: number;
  page: number;
  totalPages: number;
}

export const getUserId = (): string => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    return userData.id;
  }
  return '';
};

export const orderApi = {
  checkout: async (discountCode?: string): Promise<Order> => {
    const response = await apiClient.post('/orders/checkout', { discountCode });
    return response.data;
  },

  getUserOrders: async (page: number = 1, limit: number = 10): Promise<PaginatedOrders> => {
    const response = await apiClient.get('/orders', {
      params: { page, limit },
    });
    return response.data;
  },

  getAllOrders: async (page: number = 1, limit: number = 10): Promise<PaginatedOrders> => {
    const response = await apiClient.get('/orders/admin/all', {
      params: { page, limit },
    });
    return response.data;
  },

  updateOrderStatus: async (
    id: string,
    data: { status: string; trackingNumber?: string },
  ): Promise<Order> => {
    const response = await apiClient.put(`/orders/${id}/status`, data);
    return response.data;
  },
};


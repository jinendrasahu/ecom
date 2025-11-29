import { apiClient } from './client';

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
  };
}

const getUserId = (): string => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    return userData.id;
  }
  return ''; // Fallback
};

export const cartApi = {
  addToCart: async (productId: string, quantity: number): Promise<CartItem> => {
    const userId = getUserId();
    const response = await apiClient.post('/cart/add', { productId, quantity }, {
      params: { userId },
    });
    return response.data;
  },

  getCart: async (): Promise<CartItem[]> => {
    const userId = getUserId();
    const response = await apiClient.get('/cart', {
      params: { userId },
    });
    return response.data;
  },

  removeFromCart: async (cartItemId: string): Promise<void> => {
    const userId = getUserId();
    await apiClient.delete(`/cart/${cartItemId}`, {
      params: { userId },
    });
  },

  updateQuantity: async (cartItemId: string, quantity: number): Promise<CartItem> => {
    const userId = getUserId();
    const response = await apiClient.put(`/cart/${cartItemId}`, { quantity }, {
      params: { userId },
    });
    return response.data;
  },
};


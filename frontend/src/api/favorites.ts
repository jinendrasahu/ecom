import { apiClient } from './client';
import { Product } from './products';

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  product: Product;
  createdAt: string;
}

const getUserId = (): string => {
  const user = localStorage.getItem('user');
  if (user) {
    const userData = JSON.parse(user);
    return userData.id;
  }
  return '';
};

export const favoriteApi = {
  addToFavorites: async (productId: string): Promise<Favorite> => {
    const response = await apiClient.post(`/favorites/${productId}`);
    return response.data;
  },

  removeFromFavorites: async (productId: string): Promise<void> => {
    await apiClient.delete(`/favorites/${productId}`);
  },

  getFavorites: async (): Promise<Favorite[]> => {
    const response = await apiClient.get('/favorites');
    return response.data;
  },

  isFavorite: async (productId: string): Promise<boolean> => {
    const response = await apiClient.get(`/favorites/check/${productId}`);
    return response.data.isFavorite;
  },

  getFavoriteProductIds: async (): Promise<string[]> => {
    const response = await apiClient.get('/favorites/ids');
    return response.data.productIds;
  },
};


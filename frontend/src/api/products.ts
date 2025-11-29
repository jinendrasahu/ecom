import { apiClient } from './client';

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  isActive: boolean;
  categoryId?: string;
  category?: Category;
}

export interface PaginatedProducts {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
}

export const productApi = {
  getAll: async (page: number = 1, limit: number = 12): Promise<PaginatedProducts> => {
    const response = await apiClient.get('/products', {
      params: { page, limit },
    });
    return response.data;
  },

  getAllAdmin: async (page: number = 1, limit: number = 12): Promise<PaginatedProducts> => {
    const response = await apiClient.get('/products/admin/all', {
      params: { page, limit },
    });
    return response.data;
  },

  getById: async (id: string): Promise<Product> => {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  deactivate: async (id: string): Promise<Product> => {
    const response = await apiClient.patch(`/products/${id}/deactivate`);
    return response.data;
  },

  activate: async (id: string): Promise<Product> => {
    const response = await apiClient.patch(`/products/${id}/activate`);
    return response.data;
  },
};


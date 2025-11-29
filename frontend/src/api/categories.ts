import { apiClient } from './client';

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export const categoryApi = {
  getAll: async (): Promise<Category[]> => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data;
  },
};


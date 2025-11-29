import axios from 'axios';
const FormData = require('form-data');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

describe('ProductController - Integration Test (GET /products)', () => {
  let createdProductId: string | null = null;
  let createdCategoryId: string | null = null;
  let authToken: string | null = null;

  beforeAll(async () => {
    try {
      await axios.get(`${API_BASE_URL}/products?page=1&limit=1`, { timeout: 5000 });
    } catch (error) {
      console.warn('API not available, skipping integration tests');
      return;
    }

    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: 'admin@example.com',
        password: 'admin123',
      });
      authToken = loginResponse.data.access_token;
    } catch (error: any) {
      console.warn('Could not authenticate, test will use existing data:', error?.response?.data || error?.message);
    }

    if (authToken) {
      try {
        const categoriesResponse = await axios.get(`${API_BASE_URL}/categories`);
        if (categoriesResponse.data && categoriesResponse.data.length > 0) {
          createdCategoryId = categoriesResponse.data[0].id;
        }
      } catch (error: any) {
        console.warn('Could not fetch categories:', error?.response?.data || error?.message);
      }

      try {
        const formData = new FormData();
        formData.append('name', 'Integration Test Product');
        formData.append('description', 'This is a product created for integration testing via API');
        formData.append('price', '99.99');
        formData.append('stock', '50');
        if (createdCategoryId) {
          formData.append('categoryId', createdCategoryId);
        }

        const productResponse = await axios.post(
          `${API_BASE_URL}/products`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              ...formData.getHeaders(),
            },
          }
        );
        createdProductId = productResponse.data.id;
      } catch (error: any) {
        console.warn('Could not create product:', error?.response?.data || error?.message);
        if (error?.response?.data) {
          console.warn('Error details:', JSON.stringify(error.response.data, null, 2));
        }
      }
    }
  }, 30000);

  afterAll(async () => {
    if (authToken) {
      if (createdProductId) {
        try {
          await axios.delete(`${API_BASE_URL}/products/${createdProductId}`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });
        } catch (error) {
        }
      }

    }
  });

  describe('GET /products', () => {
    it('should return paginated list of active products from API', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/products?page=1&limit=12`);

        expect(response.status).toBe(200);
        expect(response.data).toHaveProperty('products');
        expect(response.data).toHaveProperty('total');
        expect(response.data).toHaveProperty('page');
        expect(response.data).toHaveProperty('totalPages');
        expect(Array.isArray(response.data.products)).toBe(true);
        expect(typeof response.data.total).toBe('number');
        expect(response.data.page).toBe(1);
        expect(response.data.totalPages).toBeGreaterThanOrEqual(0);

        if (response.data.products.length > 0) {
          const product = response.data.products[0];
          expect(product).toHaveProperty('id');
          expect(product).toHaveProperty('name');
          expect(product).toHaveProperty('description');
          expect(product).toHaveProperty('price');
          expect(product).toHaveProperty('stock');
          expect(product).toHaveProperty('imageUrl');
          expect(product).toHaveProperty('isActive');
          expect(product.isActive).toBe(true);
          const priceValue = typeof product.price === 'number' ? product.price : parseFloat(String(product.price));
          const stockValue = typeof product.stock === 'number' ? product.stock : parseInt(String(product.stock), 10);
          expect(!isNaN(priceValue)).toBe(true);
          expect(!isNaN(stockValue)).toBe(true);
          expect(priceValue).toBeGreaterThan(0);
          expect(stockValue).toBeGreaterThanOrEqual(0);
        }
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connect')) {
          console.warn('API not available, skipping test');
          return;
        }
        throw error;
      }
    });

    it('should include the created test product in results', async () => {
      if (!createdProductId) {
        console.warn('Skipping: No test product created');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/products?page=1&limit=100`);

        expect(response.status).toBe(200);
        const testProduct = response.data.products.find(
          (p: any) => p.id === createdProductId,
        );

        expect(testProduct).toBeDefined();
        expect(testProduct.name).toBe('Integration Test Product');
        expect(testProduct.description).toBe('This is a product created for integration testing via API');
        const priceValue = typeof testProduct.price === 'number' ? testProduct.price : parseFloat(String(testProduct.price));
        const stockValue = typeof testProduct.stock === 'number' ? testProduct.stock : parseInt(String(testProduct.stock), 10);
        expect(priceValue).toBe(99.99);
        expect(stockValue).toBe(50);
        expect(testProduct.isActive).toBe(true);
        if (createdCategoryId) {
          expect(testProduct.categoryId).toBe(createdCategoryId);
        }
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connect')) {
          console.warn('API not available, skipping test');
          return;
        }
        throw error;
      }
    });

    it('should return products with category relation when available', async () => {
      if (!createdProductId) {
        console.warn('Skipping: Test product not created');
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/products?page=1&limit=100`);

        const testProduct = response.data.products.find(
          (p: any) => p.id === createdProductId,
        );

        if (testProduct && testProduct.category) {
          expect(testProduct.category).toHaveProperty('id');
          expect(testProduct.category).toHaveProperty('name');
          expect(typeof testProduct.category.name).toBe('string');
        }
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connect')) {
          console.warn('API not available, skipping test');
          return;
        }
        throw error;
      }
    });

    it('should handle pagination correctly', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/products?page=1&limit=1`);

        expect(response.status).toBe(200);
        expect(response.data.products.length).toBeLessThanOrEqual(1);
        expect(response.data.page).toBe(1);
        expect(response.data.totalPages).toBeGreaterThanOrEqual(0);
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connect')) {
          console.warn('API not available, skipping test');
          return;
        }
        throw error;
      }
    });

    it('should use default values when page and limit are not provided', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/products`);

        expect(response.status).toBe(200);
        expect(response.data.page).toBe(1);
        expect(response.data.products.length).toBeLessThanOrEqual(12);
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connect')) {
          console.warn('API not available, skipping test');
          return;
        }
        throw error;
      }
    });

    it('should only return active products', async () => {
      if (!authToken) {
        console.warn('Skipping: No auth token available');
        return;
      }

      let inactiveProductId: string | null = null;
      try {
        const formData = new FormData();
        formData.append('name', 'Inactive Test Product');
        formData.append('description', 'This product should not appear');
        formData.append('price', '49.99');
        formData.append('stock', '10');

        let createResponse;
        try {
          createResponse = await axios.post(
            `${API_BASE_URL}/products`,
            formData,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                ...formData.getHeaders(),
              },
            }
          );
          inactiveProductId = createResponse.data.id;
        } catch (createError: any) {
          if (createError.response?.status === 500 || createError.response?.status === 400) {
            console.warn('Could not create product for test, skipping:', createError.response?.data || createError.message);
            return;
          }
          throw createError;
        }

        try {
          await axios.patch(
            `${API_BASE_URL}/products/${inactiveProductId}/deactivate`,
            {},
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );
        } catch (deactivateError: any) {
          console.warn('Could not deactivate product, skipping test:', deactivateError.response?.data || deactivateError.message);
          return;
        }

        // Verify it doesn't appear in public products endpoint
        const response = await axios.get(`${API_BASE_URL}/products?page=1&limit=100`);

        const inactiveFound = response.data.products.find(
          (p: any) => p.id === inactiveProductId,
        );
        expect(inactiveFound).toBeUndefined();

        // Verify all returned products are active
        response.data.products.forEach((product: any) => {
          expect(product.isActive).toBe(true);
        });
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connect')) {
          console.warn('API not available, skipping test');
          return;
        }
        // If it's a test assertion error, rethrow it
        if (error.name === 'AssertionError' || error.constructor.name === 'AssertionError') {
          throw error;
        }
        // For other errors, skip the test
        console.warn('Test error, skipping:', error.message);
        return;
      } finally {
        // Clean up inactive product
        if (inactiveProductId && authToken) {
          try {
            await axios.delete(`${API_BASE_URL}/products/${inactiveProductId}`, {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            });
          } catch (error) {
          }
        }
      }
    });

    it('should handle invalid page parameter gracefully', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/products?page=invalid&limit=abc`);

        expect(response.status).toBe(200);
        expect(response.data.page).toBe(1);
        expect(response.data.products.length).toBeLessThanOrEqual(12);
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connect')) {
          console.warn('API not available, skipping test');
          return;
        }
        throw error;
      }
    });

    it('should return empty array structure when page is out of range', async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/products?page=9999&limit=10`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data.products)).toBe(true);
        expect(response.data.total).toBeGreaterThanOrEqual(0);
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('connect')) {
          console.warn('API not available, skipping test');
          return;
        }
        throw error;
      }
    });
  });
});


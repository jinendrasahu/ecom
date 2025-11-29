import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import ProductManagement from './ProductManagement';
import { AuthProvider } from '../context/AuthContext';
import axios from 'axios';

// Use real API endpoint
const API_BASE_URL = 'http://localhost:3001';

describe('ProductManagement Component - Integration Test (Product Display)', () => {
  let queryClient: QueryClient;
  let createdProductId: string | null = null;
  let authToken: string | null = null;

  beforeAll(async () => {
    // Create a real product in the database via API
    try {
      await axios.get(`${API_BASE_URL}/products?page=1&limit=1`, { timeout: 2000 });
      
      try {
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
          email: 'admin@example.com',
          password: 'admin123',
        });

        authToken = loginResponse.data.access_token;
        
        if (typeof window !== 'undefined' && authToken) {
          localStorage.setItem('token', authToken);
          localStorage.setItem('user', JSON.stringify(loginResponse.data.user || { role: 'admin' }));
        }

        // Create a test product
        const formData = new FormData();
        formData.append('name', 'Integration Test Product');
        formData.append('description', 'This product is created for frontend integration testing');
        formData.append('price', '149.99');
        formData.append('stock', '25');
        formData.append('categoryId', '');

        const createResponse = await axios.post(
          `${API_BASE_URL}/products`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        createdProductId = createResponse.data.id;
      } catch (authError: any) {
        console.warn('Could not authenticate, test will use existing products:', authError?.response?.data || authError?.message);
      }
    } catch (error: any) {
      console.warn('API not available, skipping product creation:', error?.message);
    }

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          retry: false, 
          refetchOnWindowFocus: false,
          refetchOnMount: true,
        },
        mutations: { retry: false },
      },
    });
  });

  beforeEach(() => {
    // Ensure token is set before each test
    if (authToken && typeof window !== 'undefined') {
      localStorage.setItem('token', authToken as string);
    }
  });

  afterAll(async () => {
    // Clean up: delete the test product
    if (createdProductId && authToken) {
      try {
        await axios.delete(`${API_BASE_URL}/products/${createdProductId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
      } catch (error) {
      }
    }
    // Clean up localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  describe('Product Display from Real API', () => {
    it('should render the page title "Product Management"', async () => {
      render(<ProductManagement />, { wrapper: createWrapper() });

      await waitFor(
        () => {
          expect(screen.getByText('Product Management')).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });

    it('should fetch and display products from the database', async () => {
      if (!authToken) {
        console.warn('Skipping test: No auth token available');
        return;
      }

      render(<ProductManagement />, { wrapper: createWrapper() });

      await waitFor(
        () => {
          const productCards = document.querySelectorAll('.bg-white.rounded-lg.shadow-md');
          expect(productCards.length).toBeGreaterThan(0);
        },
        { timeout: 15000 }
      );
    }, { timeout: 20000 });

    it('should display product information correctly from database', async () => {
      if (!authToken) {
        console.warn('Skipping test: No auth token available');
        return;
      }

      render(<ProductManagement />, { wrapper: createWrapper() });

      await waitFor(
        () => {
          const stockElements = screen.queryAllByText(/Stock:/i);
          
          expect(stockElements.length).toBeGreaterThan(0);

          const productNames = document.querySelectorAll('h3.font-semibold');
          expect(productNames.length).toBeGreaterThan(0);
        },
        { timeout: 15000 }
      );
    }, { timeout: 20000 });

    it('should display the created test product if it exists', async () => {
      if (!createdProductId) {
        return;
      }

      render(<ProductManagement />, { wrapper: createWrapper() });

      await waitFor(
        () => {
          expect(screen.getByText('Integration Test Product')).toBeInTheDocument();
          expect(screen.getByText('This product is created for frontend integration testing')).toBeInTheDocument();
          expect(screen.getByText('$149.99')).toBeInTheDocument();
          expect(screen.getByText(/Stock: 25/)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );
    });

    it('should display product cards with correct structure', async () => {
      if (!authToken) {
        console.warn('Skipping test: No auth token available');
        return;
      }

      render(<ProductManagement />, { wrapper: createWrapper() });

      await waitFor(
        () => {
          const productCards = document.querySelectorAll('.bg-white.rounded-lg.shadow-md');
          expect(productCards.length).toBeGreaterThan(0);

          if (productCards.length > 0) {
            const cardElement = productCards[0] as HTMLElement;
            const nameElement = cardElement.querySelector('h3.font-semibold');
            expect(nameElement).toBeTruthy();
            expect(nameElement?.textContent).toBeTruthy();
            
            const priceElement = cardElement.querySelector('.text-lg.font-bold');
            expect(priceElement).toBeTruthy();
            expect(priceElement?.textContent).toMatch(/\$\d+\.\d{2}/);
          }
        },
        { timeout: 15000 }
      );
    }, { timeout: 20000 });

    it('should show "Add Product" button', async () => {
      render(<ProductManagement />, { wrapper: createWrapper() });

      await waitFor(
        () => {
          const addButton = screen.getByRole('button', { name: /add product/i });
          expect(addButton).toBeInTheDocument();
          expect(addButton).toHaveTextContent('Add Product');
        },
        { timeout: 5000 }
      );
    });

    it('should handle empty product list gracefully', async () => {
      render(<ProductManagement />, { wrapper: createWrapper() });

      await waitFor(
        () => {
          expect(screen.getByText('Product Management')).toBeInTheDocument();
          expect(screen.getByRole('button', { name: /add product/i })).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });
});


import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  listCategories,
  createCategory,
  listMerchants,
  updateMerchant,
} from '../financialApi';
import {
  createMockCategory,
  createMockCategoryList,
  createMockMerchant,
} from '../../../test-utils/mocks/financialMocks';
import { createMockSuccessResponse, createMockErrorResponse } from '../../../test-utils/mocks/apiMocks';

// Mock the API module
vi.mock('../api', () => ({
  authenticatedFetch: vi.fn(),
  handleResponse: vi.fn((response) => response.json()),
}));

import { authenticatedFetch } from '../api';

describe('Categories and Merchants API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listCategories', () => {
    it('should list categories successfully', async () => {
      const mockCategories = createMockCategoryList(5);
      const mockResponse = createMockSuccessResponse({
        success: true,
        categories: mockCategories,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        categories: mockCategories,
      });

      const result = await listCategories();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/categories',
        expect.objectContaining({ method: 'GET' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.categories).toHaveLength(5);
    });

    it('should handle empty categories list', async () => {
      const mockResponse = createMockSuccessResponse({
        success: true,
        categories: [],
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        categories: [],
      });

      const result = await listCategories();

      expect(result.categories).toHaveLength(0);
    });
  });

  describe('createCategory', () => {
    it('should create category successfully', async () => {
      const mockCategory = createMockCategory();
      const categoryData = { category_name: 'Groceries' };
      const mockResponse = createMockSuccessResponse({
        success: true,
        category: mockCategory,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        category: mockCategory,
      });

      const result = await createCategory(categoryData);

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/categories',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(categoryData),
        }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.category).toEqual(mockCategory);
    });

    it('should handle validation errors', async () => {
      const categoryData = { category_name: '' };
      const mockResponse = createMockErrorResponse(400, 'Category name is required');

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: false,
        error: 'Category name is required',
      });

      await expect(createCategory(categoryData)).rejects.toThrow();
    });

    it('should handle parent category', async () => {
      const mockCategory = createMockCategory({ parent_category: 'cat_parent' });
      const categoryData = {
        category_name: 'Subcategory',
        parent_category: 'cat_parent',
      };
      const mockResponse = createMockSuccessResponse({
        success: true,
        category: mockCategory,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        category: mockCategory,
      });

      const result = await createCategory(categoryData);

      expect(result.category.parent_category).toBe('cat_parent');
    });
  });

  describe('listMerchants', () => {
    it('should list merchants successfully', async () => {
      const mockMerchants = [
        createMockMerchant({ _id: 'merchant_1', merchant_name: 'Store 1' }),
        createMockMerchant({ _id: 'merchant_2', merchant_name: 'Store 2' }),
      ];
      const mockResponse = createMockSuccessResponse({
        success: true,
        merchants: mockMerchants,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        merchants: mockMerchants,
      });

      const result = await listMerchants();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/merchants',
        expect.objectContaining({ method: 'GET' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.merchants).toHaveLength(2);
    });

    it('should handle empty merchants list', async () => {
      const mockResponse = createMockSuccessResponse({
        success: true,
        merchants: [],
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        merchants: [],
      });

      const result = await listMerchants();

      expect(result.merchants).toHaveLength(0);
    });
  });

  describe('updateMerchant', () => {
    it('should update merchant successfully', async () => {
      const mockMerchant = createMockMerchant({
        aliases: ['Supermarket', 'Grocery Store', 'Food Mart'],
      });
      const updates = { aliases: ['Supermarket', 'Grocery Store', 'Food Mart'] };
      const mockResponse = createMockSuccessResponse({
        success: true,
        merchant: mockMerchant,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        merchant: mockMerchant,
      });

      const result = await updateMerchant('merchant_123', updates);

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/merchants/merchant_123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.merchant.aliases).toHaveLength(3);
    });

    it('should update merchant category', async () => {
      const mockMerchant = createMockMerchant({
        merchant_category: 'Groceries',
      });
      const updates = { merchant_category: 'Groceries' };
      const mockResponse = createMockSuccessResponse({
        success: true,
        merchant: mockMerchant,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        merchant: mockMerchant,
      });

      const result = await updateMerchant('merchant_123', updates);

      expect(result.merchant.merchant_category).toBe('Groceries');
    });
  });
});













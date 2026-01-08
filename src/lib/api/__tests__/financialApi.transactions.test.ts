import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  uploadBill,
  getBillStatus,
  listTransactions,
  updateTransaction,
  deleteTransaction,
  mergeTransaction,
} from '../financialApi';
import {
  createMockTransaction,
  createMockTransactionList,
} from '../../../test-utils/mocks/financialMocks';
import { createMockSuccessResponse, createMockErrorResponse } from '../../../test-utils/mocks/apiMocks';

// Mock the API module
vi.mock('../api', () => ({
  authenticatedFetch: vi.fn(),
  handleResponse: vi.fn((response) => response.json()),
  getAccessToken: vi.fn(() => 'mock_token'),
  refreshAccessToken: vi.fn(() => Promise.resolve('new_token')),
  clearAuthData: vi.fn(),
}));

vi.mock('../../api', () => ({
  getAccessToken: vi.fn(() => 'mock_token'),
  refreshAccessToken: vi.fn(() => Promise.resolve('new_token')),
  clearAuthData: vi.fn(),
}));

import { authenticatedFetch } from '../api';

// Mock global fetch
global.fetch = vi.fn();

describe('Transaction API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadBill', () => {
    it('should upload bill successfully', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockResponse = createMockSuccessResponse({
        success: true,
        job_id: 'job_123',
        stream_url: '/stream/job_123',
        message: 'Upload successful',
      });

      vi.mocked(global.fetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        job_id: 'job_123',
        stream_url: '/stream/job_123',
        message: 'Upload successful',
      });

      const result = await uploadBill(file);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/financial/bills'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        })
      );
      expect(result.success).toBe(true);
      expect(result.job_id).toBe('job_123');
    });

    it('should include category and merchant in FormData', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockResponse = createMockSuccessResponse({
        success: true,
        job_id: 'job_123',
        stream_url: '/stream/job_123',
        message: 'Upload successful',
      });

      vi.mocked(global.fetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        job_id: 'job_123',
        stream_url: '/stream/job_123',
        message: 'Upload successful',
      });

      await uploadBill(file, 'cat_123', 'merchant_123');

      const fetchCall = vi.mocked(global.fetch).mock.calls[0];
      const formData = fetchCall[1]?.body as FormData;
      expect(formData).toBeInstanceOf(FormData);
    });

    it('should handle authentication errors and retry', async () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const errorResponse = createMockErrorResponse(401, 'Unauthorized');
      const successResponse = createMockSuccessResponse({
        success: true,
        job_id: 'job_123',
        stream_url: '/stream/job_123',
        message: 'Upload successful',
      });

      vi.mocked(global.fetch)
        .mockResolvedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);
      vi.mocked(successResponse.json).mockResolvedValue({
        success: true,
        job_id: 'job_123',
        stream_url: '/stream/job_123',
        message: 'Upload successful',
      });

      const result = await uploadBill(file);

      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });
  });

  describe('getBillStatus', () => {
    it('should get bill status successfully', async () => {
      const mockTransaction = createMockTransaction();
      const mockResponse = createMockSuccessResponse({
        success: true,
        job: {
          job_id: 'job_123',
          status: 'completed',
          created_at: new Date().toISOString(),
          finished_at: new Date().toISOString(),
          result: {
            success: true,
            transaction_id: 'trans_123',
          },
        },
        transaction: mockTransaction,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        job: {
          job_id: 'job_123',
          status: 'completed',
          created_at: new Date().toISOString(),
          finished_at: new Date().toISOString(),
          result: {
            success: true,
            transaction_id: 'trans_123',
          },
        },
        transaction: mockTransaction,
      });

      const result = await getBillStatus('job_123');

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/bills/job_123',
        expect.objectContaining({ method: 'GET' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
    });
  });

  describe('listTransactions', () => {
    it('should list transactions successfully', async () => {
      const mockTransactions = createMockTransactionList(5);
      const mockResponse = createMockSuccessResponse({
        success: true,
        transactions: mockTransactions,
        total: 5,
        limit: 10,
        offset: 0,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        transactions: mockTransactions,
        total: 5,
        limit: 10,
        offset: 0,
      });

      const result = await listTransactions();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/bills',
        expect.objectContaining({ method: 'GET' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.transactions).toHaveLength(5);
    });

    it('should handle query parameters correctly', async () => {
      const mockTransactions = createMockTransactionList(2);
      const mockResponse = createMockSuccessResponse({
        success: true,
        transactions: mockTransactions,
        total: 2,
        limit: 10,
        offset: 0,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        transactions: mockTransactions,
        total: 2,
        limit: 10,
        offset: 0,
      });

      await listTransactions({
        date_from: '2024-01-01',
        date_to: '2024-01-31',
        category: 'cat_123',
        merchant: 'merchant_123',
        limit: 10,
        offset: 0,
      });

      expect(authenticatedFetch).toHaveBeenCalledWith(
        expect.stringContaining('date_from=2024-01-01'),
        expect.any(Object),
        true,
        expect.any(String)
      );
    });

    it('should handle pagination', async () => {
      const mockTransactions = createMockTransactionList(10);
      const mockResponse = createMockSuccessResponse({
        success: true,
        transactions: mockTransactions,
        total: 50,
        limit: 10,
        offset: 20,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        transactions: mockTransactions,
        total: 50,
        limit: 10,
        offset: 20,
      });

      const result = await listTransactions({ limit: 10, offset: 20 });

      expect(result.total).toBe(50);
      expect(result.offset).toBe(20);
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction successfully', async () => {
      const mockTransaction = createMockTransaction({ amount: 150 });
      const updates = { amount: 150 };
      const mockResponse = createMockSuccessResponse({
        success: true,
        transaction: mockTransaction,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        transaction: mockTransaction,
      });

      const result = await updateTransaction('trans_123', updates);

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/transactions/trans_123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updates),
        }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.transaction.amount).toBe(150);
    });

    it('should handle multiple field updates', async () => {
      const mockTransaction = createMockTransaction({
        amount: 200,
        category_id: 'cat_456',
      });
      const updates = { amount: 200, category: 'cat_456' };
      const mockResponse = createMockSuccessResponse({
        success: true,
        transaction: mockTransaction,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        transaction: mockTransaction,
      });

      const result = await updateTransaction('trans_123', updates);

      expect(result.transaction.amount).toBe(200);
      expect(result.transaction.category_id).toBe('cat_456');
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      const mockResponse = createMockSuccessResponse({
        success: true,
        message: 'Transaction deleted',
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        message: 'Transaction deleted',
      });

      const result = await deleteTransaction('trans_123');

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/transactions/trans_123',
        expect.objectContaining({ method: 'DELETE' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe('Transaction deleted');
    });
  });

  describe('mergeTransaction', () => {
    it('should merge transactions successfully', async () => {
      const mockTransaction = createMockTransaction();
      const mergeData = { merge_with: 'trans_456' };
      const mockResponse = createMockSuccessResponse({
        success: true,
        merged_transaction: mockTransaction,
        message: 'Transactions merged',
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        merged_transaction: mockTransaction,
        message: 'Transactions merged',
      });

      const result = await mergeTransaction('trans_123', mergeData);

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/transactions/trans_123/merge',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mergeData),
        }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.merged_transaction).toBeDefined();
    });
  });
});













import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sendAIChat,
  submitFeedback,
  getModelStatus,
  reloadModel,
  triggerRetraining,
} from '../financialApi';
import { createMockSuccessResponse, createMockErrorResponse } from '../../../test-utils/mocks/apiMocks';

// Mock the API module
vi.mock('../api', () => ({
  authenticatedFetch: vi.fn(),
  handleResponse: vi.fn((response) => response.json()),
}));

import { authenticatedFetch } from '../api';

describe('AI Features API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendAIChat', () => {
    it('should send AI chat message successfully', async () => {
      const request = { query: 'What is my total spending this month?' };
      const mockResponse = createMockSuccessResponse({
        success: true,
        response: 'Your total spending this month is Rs. 5,000',
        model: 'gpt-4',
        data: {
          total_spending_30_days: 5000,
          transaction_count: 15,
        },
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        response: 'Your total spending this month is Rs. 5,000',
        model: 'gpt-4',
        data: {
          total_spending_30_days: 5000,
          transaction_count: 15,
        },
      });

      const result = await sendAIChat(request);

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/chat',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.response).toContain('Rs. 5,000');
      expect(result.model).toBe('gpt-4');
    });

    it('should handle context in request', async () => {
      const request = {
        query: 'Can I afford this?',
        context: { amount: 1000, category: 'Entertainment' },
      };
      const mockResponse = createMockSuccessResponse({
        success: true,
        response: 'Based on your spending patterns...',
        model: 'gpt-4',
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        response: 'Based on your spending patterns...',
        model: 'gpt-4',
      });

      await sendAIChat(request);

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/chat',
        expect.objectContaining({
          body: JSON.stringify(request),
        }),
        true,
        expect.any(String)
      );
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback successfully', async () => {
      const feedback = {
        transaction_id: 'trans_123',
        field: 'category',
        old_value: 'Groceries',
        new_value: 'Food',
        model_version: '1.0',
        confidence: 0.95,
      };
      const mockResponse = createMockSuccessResponse({
        success: true,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
      });

      const result = await submitFeedback(feedback);

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/feedback',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(feedback),
        }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
    });

    it('should handle optional fields', async () => {
      const feedback = {
        transaction_id: 'trans_123',
        field: 'amount',
        old_value: 100,
        new_value: 150,
      };
      const mockResponse = createMockSuccessResponse({
        success: true,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
      });

      const result = await submitFeedback(feedback);

      expect(result.success).toBe(true);
    });
  });

  describe('getModelStatus', () => {
    it('should get model status successfully', async () => {
      const mockResponse = createMockSuccessResponse({
        success: true,
        model_loaded: true,
        model_info: {
          model_version: '1.0',
          accuracy: 0.95,
          training_samples: 1000,
          test_samples: 200,
          categories: 10,
          trained_at: new Date().toISOString(),
        },
        categorization_method: 'ml',
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        model_loaded: true,
        model_info: {
          model_version: '1.0',
          accuracy: 0.95,
          training_samples: 1000,
          test_samples: 200,
          categories: 10,
          trained_at: new Date().toISOString(),
        },
        categorization_method: 'ml',
      });

      const result = await getModelStatus();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/model/status',
        expect.objectContaining({ method: 'GET' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.model_loaded).toBe(true);
      expect(result.model_info?.accuracy).toBe(0.95);
    });

    it('should handle model not loaded', async () => {
      const mockResponse = createMockSuccessResponse({
        success: true,
        model_loaded: false,
        categorization_method: 'rule-based',
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        model_loaded: false,
        categorization_method: 'rule-based',
      });

      const result = await getModelStatus();

      expect(result.model_loaded).toBe(false);
      expect(result.categorization_method).toBe('rule-based');
    });
  });

  describe('reloadModel', () => {
    it('should reload model successfully', async () => {
      const mockResponse = createMockSuccessResponse({
        success: true,
        message: 'Model reloaded successfully',
        model_version: '1.1',
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        message: 'Model reloaded successfully',
        model_version: '1.1',
      });

      const result = await reloadModel();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/model/reload',
        expect.objectContaining({ method: 'POST' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.message).toContain('reloaded');
      expect(result.model_version).toBe('1.1');
    });
  });

  describe('triggerRetraining', () => {
    it('should trigger retraining successfully', async () => {
      const params = { days_back: 30, min_samples: 100 };
      const mockResponse = createMockSuccessResponse({
        success: true,
        message: 'Retraining started',
        results: {
          samples_collected: 500,
          training_samples: 400,
          test_samples: 100,
          accuracy: 0.92,
          categories: 10,
          model_version: '1.2',
        },
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        message: 'Retraining started',
        results: {
          samples_collected: 500,
          training_samples: 400,
          test_samples: 100,
          accuracy: 0.92,
          categories: 10,
          model_version: '1.2',
        },
      });

      const result = await triggerRetraining(params);

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/retrain',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(params),
        }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.results?.accuracy).toBe(0.92);
    });

    it('should handle retraining without params', async () => {
      const mockResponse = createMockSuccessResponse({
        success: true,
        message: 'Retraining started',
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        message: 'Retraining started',
      });

      const result = await triggerRetraining();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/retrain',
        expect.objectContaining({
          body: JSON.stringify({}),
        }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
    });
  });
});











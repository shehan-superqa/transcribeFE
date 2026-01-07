import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSpendingSummary,
  getSpendingTrends,
  getAnomalies,
} from '../financialApi';
import {
  createMockSpendingSummary,
  createMockSpendingTrends,
  createMockAnomalies,
} from '../../../test-utils/mocks/financialMocks';
import { createMockSuccessResponse, createMockErrorResponse } from '../../../test-utils/mocks/apiMocks';

// Mock the API module
vi.mock('../api', () => ({
  authenticatedFetch: vi.fn(),
  handleResponse: vi.fn((response) => response.json()),
}));

import { authenticatedFetch } from '../api';

describe('Analytics API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSpendingSummary', () => {
    it('should get spending summary successfully', async () => {
      const mockSummary = createMockSpendingSummary();
      const mockResponse = createMockSuccessResponse(mockSummary);

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue(mockSummary);

      const result = await getSpendingSummary();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/analytics/summary',
        expect.objectContaining({ method: 'GET' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.summary.total).toBe(5000);
      expect(result.summary.by_category).toHaveLength(2);
    });

    it('should handle period filtering', async () => {
      const mockSummary = createMockSpendingSummary();
      const mockResponse = createMockSuccessResponse(mockSummary);

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue(mockSummary);

      await getSpendingSummary({ period: 'monthly' });

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/analytics/summary?period=monthly',
        expect.any(Object),
        true,
        expect.any(String)
      );
    });

    it('should handle date range filtering', async () => {
      const mockSummary = createMockSpendingSummary();
      const mockResponse = createMockSuccessResponse(mockSummary);

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue(mockSummary);

      await getSpendingSummary({
        date_from: '2024-01-01',
        date_to: '2024-01-31',
      });

      expect(authenticatedFetch).toHaveBeenCalledWith(
        expect.stringContaining('date_from=2024-01-01'),
        expect.any(Object),
        true,
        expect.any(String)
      );
    });

    it('should handle empty summary', async () => {
      const mockSummary = createMockSpendingSummary({
        summary: {
          total: 0,
          by_category: [],
          period: 'monthly',
          transaction_count: 0,
        },
      });
      const mockResponse = createMockSuccessResponse(mockSummary);

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue(mockSummary);

      const result = await getSpendingSummary();

      expect(result.summary.total).toBe(0);
      expect(result.summary.by_category).toHaveLength(0);
    });
  });

  describe('getSpendingTrends', () => {
    it('should get spending trends successfully', async () => {
      const mockTrends = createMockSpendingTrends();
      const mockResponse = createMockSuccessResponse(mockTrends);

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue(mockTrends);

      const result = await getSpendingTrends();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/analytics/trends',
        expect.objectContaining({ method: 'GET' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.trends.comparisons).toBeDefined();
      expect(result.trends.overall_growth_rate).toBe(11.11);
    });

    it('should handle period parameter', async () => {
      const mockTrends = createMockSpendingTrends();
      const mockResponse = createMockSuccessResponse(mockTrends);

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue(mockTrends);

      await getSpendingTrends({ period: 'yearly' });

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/analytics/trends?period=yearly',
        expect.any(Object),
        true,
        expect.any(String)
      );
    });

    it('should handle months_back parameter', async () => {
      const mockTrends = createMockSpendingTrends();
      const mockResponse = createMockSuccessResponse(mockTrends);

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue(mockTrends);

      await getSpendingTrends({ months_back: 6 });

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/analytics/trends?months_back=6',
        expect.any(Object),
        true,
        expect.any(String)
      );
    });

    it('should calculate growth rate correctly', async () => {
      const mockTrends = createMockSpendingTrends({
        trends: {
          period: 'monthly',
          comparisons: [
            {
              period: 'current_month',
              current_total: 6000,
              previous_total: 5000,
              growth_rate: 20,
              current_count: 20,
              previous_count: 15,
            },
          ],
          overall_growth_rate: 20,
        },
      });
      const mockResponse = createMockSuccessResponse(mockTrends);

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue(mockTrends);

      const result = await getSpendingTrends();

      expect(result.trends.overall_growth_rate).toBe(20);
      expect(result.trends.comparisons[0].growth_rate).toBe(20);
    });
  });

  describe('getAnomalies', () => {
    it('should get anomalies successfully', async () => {
      const mockAnomalies = createMockAnomalies();
      const mockResponse = createMockSuccessResponse(mockAnomalies);

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue(mockAnomalies);

      const result = await getAnomalies();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/analytics/anomalies',
        expect.objectContaining({ method: 'GET' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.anomalies).toHaveLength(1);
      expect(result.count).toBe(1);
    });

    it('should handle limit parameter', async () => {
      const mockAnomalies = createMockAnomalies({
        anomalies: Array.from({ length: 5 }, (_, i) => ({
          _id: `trans_${i}`,
          amount: 500 + i * 100,
          anomaly_flag: true,
          anomaly_reason: 'Unusually high amount',
          merchant_name: 'Store',
          category_name: 'Shopping',
        })),
        count: 5,
      });
      const mockResponse = createMockSuccessResponse(mockAnomalies);

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue(mockAnomalies);

      await getAnomalies({ limit: 5 });

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/analytics/anomalies?limit=5',
        expect.any(Object),
        true,
        expect.any(String)
      );
    });

    it('should handle no anomalies', async () => {
      const mockAnomalies = createMockAnomalies({
        anomalies: [],
        count: 0,
      });
      const mockResponse = createMockSuccessResponse(mockAnomalies);

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue(mockAnomalies);

      const result = await getAnomalies();

      expect(result.anomalies).toHaveLength(0);
      expect(result.count).toBe(0);
    });
  });
});












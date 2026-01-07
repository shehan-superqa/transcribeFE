import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createBudget,
  listBudgets,
  getBudgetStatus,
  updateBudget,
  deleteBudget,
  createCategoryCap,
  getCategoryCaps,
  getAlerts,
  markAlertRead,
  markAllAlertsRead,
  subscribeToBudgetUpdates,
} from '../financialApi';
import {
  createMockBudget,
  createMockBudgetStatus,
  createMockCategoryCap,
  createMockAlert,
  createMockBudgetList,
  createMockCreateBudgetRequest,
} from '../../../test-utils/mocks/budgetMocks';
import { createMockSuccessResponse, createMockErrorResponse } from '../../../test-utils/mocks/apiMocks';

// Mock the API module
vi.mock('../api', async () => {
  const actual = await vi.importActual('../api');
  return {
    ...actual,
    authenticatedFetch: vi.fn(),
    handleResponse: vi.fn((response) => response.json()),
    getAccessToken: vi.fn(() => 'mock_token'),
  };
});

import { authenticatedFetch } from '../api';

describe('Budget Management API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBudget', () => {
    it('should create a budget successfully', async () => {
      const mockBudget = createMockBudget();
      const request = createMockCreateBudgetRequest();
      const mockResponse = createMockSuccessResponse({ success: true, budget: mockBudget });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: true, budget: mockBudget });

      const result = await createBudget(request);

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.budget).toEqual(mockBudget);
    });

    it('should handle validation errors', async () => {
      const request = createMockCreateBudgetRequest({ amount: -100 });
      const mockResponse = createMockErrorResponse(400, 'Amount must be greater than 0');

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: false, error: 'Amount must be greater than 0' });

      await expect(createBudget(request)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const request = createMockCreateBudgetRequest();
      vi.mocked(authenticatedFetch).mockRejectedValue(new Error('Network error'));

      await expect(createBudget(request)).rejects.toThrow('Network error');
    });
  });

  describe('listBudgets', () => {
    it('should list all budgets', async () => {
      const mockBudgets = createMockBudgetList(3);
      const mockResponse = createMockSuccessResponse({ success: true, budgets: mockBudgets, total: 3 });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: true, budgets: mockBudgets, total: 3 });

      const result = await listBudgets();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets',
        expect.objectContaining({ method: 'GET' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.budgets).toHaveLength(3);
    });

    it('should filter by active_only', async () => {
      const mockBudgets = createMockBudgetList(2);
      const mockResponse = createMockSuccessResponse({ success: true, budgets: mockBudgets, total: 2 });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: true, budgets: mockBudgets, total: 2 });

      await listBudgets({ active_only: true });

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets?active_only=true',
        expect.any(Object),
        true,
        expect.any(String)
      );
    });

    it('should filter by category_id', async () => {
      const mockBudgets = createMockBudgetList(1);
      const mockResponse = createMockSuccessResponse({ success: true, budgets: mockBudgets, total: 1 });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: true, budgets: mockBudgets, total: 1 });

      await listBudgets({ category_id: 'cat_123' });

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets?category_id=cat_123',
        expect.any(Object),
        true,
        expect.any(String)
      );
    });

    it('should handle empty results', async () => {
      const mockResponse = createMockSuccessResponse({ success: true, budgets: [], total: 0 });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: true, budgets: [], total: 0 });

      const result = await listBudgets();

      expect(result.budgets).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getBudgetStatus', () => {
    it('should get budget status successfully', async () => {
      const mockStatus = createMockBudgetStatus();
      const mockResponse = createMockSuccessResponse(mockStatus);

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue(mockStatus);

      const result = await getBudgetStatus('budget_123');

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets/budget_123/status',
        expect.objectContaining({ method: 'GET' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.budget).toBeDefined();
      expect(result.status).toBeDefined();
    });

    it('should handle budget not found', async () => {
      const mockResponse = createMockErrorResponse(404, 'Budget not found');

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: false, error: 'Budget not found' });

      await expect(getBudgetStatus('invalid_id')).rejects.toThrow();
    });
  });

  describe('updateBudget', () => {
    it('should update budget successfully', async () => {
      const mockBudget = createMockBudget({ amount: 6000 });
      const updateRequest = { amount: 6000 };
      const mockResponse = createMockSuccessResponse({ success: true, budget: mockBudget });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: true, budget: mockBudget });

      const result = await updateBudget('budget_123', updateRequest);

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets/budget_123',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(updateRequest),
        }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.budget.amount).toBe(6000);
    });

    it('should handle partial updates', async () => {
      const mockBudget = createMockBudget({ name: 'Updated Budget' });
      const updateRequest = { name: 'Updated Budget' };
      const mockResponse = createMockSuccessResponse({ success: true, budget: mockBudget });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: true, budget: mockBudget });

      const result = await updateBudget('budget_123', updateRequest);

      expect(result.budget.name).toBe('Updated Budget');
    });
  });

  describe('deleteBudget', () => {
    it('should delete budget successfully', async () => {
      const mockResponse = createMockSuccessResponse({ success: true, message: 'Budget deleted' });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: true, message: 'Budget deleted' });

      const result = await deleteBudget('budget_123');

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets/budget_123',
        expect.objectContaining({ method: 'DELETE' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe('Budget deleted');
    });

    it('should handle budget not found', async () => {
      const mockResponse = createMockErrorResponse(404, 'Budget not found');

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: false, error: 'Budget not found' });

      await expect(deleteBudget('invalid_id')).rejects.toThrow();
    });
  });

  describe('createCategoryCap', () => {
    it('should create category cap successfully', async () => {
      const mockCap = createMockCategoryCap();
      const request = {
        category_id: 'cat_123',
        monthly_limit: 3000,
        alert_at_percentage: 80,
      };
      const mockResponse = createMockSuccessResponse({ success: true, cap: mockCap });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: true, cap: mockCap });

      const result = await createCategoryCap(request);

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets/category-caps',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(request),
        }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.cap).toEqual(mockCap);
    });

    it('should handle validation errors', async () => {
      const request = {
        category_id: 'cat_123',
        monthly_limit: -100,
        alert_at_percentage: 80,
      };
      const mockResponse = createMockErrorResponse(400, 'Monthly limit must be greater than 0');

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: false, error: 'Monthly limit must be greater than 0' });

      await expect(createCategoryCap(request)).rejects.toThrow();
    });
  });

  describe('getCategoryCaps', () => {
    it('should get category caps successfully', async () => {
      const mockCaps = [createMockCategoryCap()];
      const mockResponse = createMockSuccessResponse({
        success: true,
        caps: mockCaps.map((cap) => ({
          ...cap,
          category_name: 'Groceries',
          current_spending: 2000,
          remaining: 1000,
          alert_triggered: false,
        })),
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        caps: mockCaps.map((cap) => ({
          ...cap,
          category_name: 'Groceries',
          current_spending: 2000,
          remaining: 1000,
          alert_triggered: false,
        })),
      });

      const result = await getCategoryCaps();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets/category-caps',
        expect.objectContaining({ method: 'GET' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.caps).toBeDefined();
    });

    it('should handle empty results', async () => {
      const mockResponse = createMockSuccessResponse({ success: true, caps: [] });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: true, caps: [] });

      const result = await getCategoryCaps();

      expect(result.caps).toHaveLength(0);
    });
  });

  describe('getAlerts', () => {
    it('should get all alerts', async () => {
      const mockAlerts = [createMockAlert()];
      const mockResponse = createMockSuccessResponse({
        success: true,
        alerts: mockAlerts,
        unread_count: 1,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        alerts: mockAlerts,
        unread_count: 1,
      });

      const result = await getAlerts();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets/alerts',
        expect.objectContaining({ method: 'GET' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.alerts).toHaveLength(1);
      expect(result.unread_count).toBe(1);
    });

    it('should filter unread alerts only', async () => {
      const mockAlerts = [createMockAlert({ read: false })];
      const mockResponse = createMockSuccessResponse({
        success: true,
        alerts: mockAlerts,
        unread_count: 1,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        alerts: mockAlerts,
        unread_count: 1,
      });

      await getAlerts({ unread_only: true });

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets/alerts?unread_only=true',
        expect.any(Object),
        true,
        expect.any(String)
      );
    });

    it('should filter by severity', async () => {
      const mockAlerts = [createMockAlert({ severity: 'critical' })];
      const mockResponse = createMockSuccessResponse({
        success: true,
        alerts: mockAlerts,
        unread_count: 1,
      });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({
        success: true,
        alerts: mockAlerts,
        unread_count: 1,
      });

      await getAlerts({ severity: 'critical' });

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets/alerts?severity=critical',
        expect.any(Object),
        true,
        expect.any(String)
      );
    });
  });

  describe('markAlertRead', () => {
    it('should mark alert as read successfully', async () => {
      const mockAlert = createMockAlert({ read: true });
      const mockResponse = createMockSuccessResponse({ success: true, alert: mockAlert });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: true, alert: mockAlert });

      const result = await markAlertRead('alert_123');

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets/alerts/alert_123/read',
        expect.objectContaining({ method: 'PUT' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.alert.read).toBe(true);
    });
  });

  describe('markAllAlertsRead', () => {
    it('should mark all alerts as read successfully', async () => {
      const mockResponse = createMockSuccessResponse({ success: true, updated_count: 5 });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: true, updated_count: 5 });

      const result = await markAllAlertsRead();

      expect(authenticatedFetch).toHaveBeenCalledWith(
        '/api/financial/budgets/alerts/read-all',
        expect.objectContaining({ method: 'PUT' }),
        true,
        expect.any(String)
      );
      expect(result.success).toBe(true);
      expect(result.updated_count).toBe(5);
    });

    it('should handle no alerts to mark', async () => {
      const mockResponse = createMockSuccessResponse({ success: true, updated_count: 0 });

      vi.mocked(authenticatedFetch).mockResolvedValue(mockResponse);
      vi.mocked(mockResponse.json).mockResolvedValue({ success: true, updated_count: 0 });

      const result = await markAllAlertsRead();

      expect(result.updated_count).toBe(0);
    });
  });

  describe('subscribeToBudgetUpdates', () => {
    it('should subscribe to budget updates successfully', () => {
      const mockEventSource = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onmessage: null,
        onerror: null,
        close: vi.fn(),
        readyState: EventSource.OPEN,
        url: '',
        withCredentials: false,
        CONNECTING: 0,
        OPEN: 1,
        CLOSED: 2,
      };

      global.EventSource = vi.fn(() => mockEventSource as any) as any;

      const onUpdate = vi.fn();
      const onError = vi.fn();

      const cleanup = subscribeToBudgetUpdates(onUpdate, onError);

      expect(global.EventSource).toHaveBeenCalled();
      expect(cleanup).toBeInstanceOf(Function);

      cleanup();
      expect(mockEventSource.close).toHaveBeenCalled();
    });

    it('should handle authentication errors', async () => {
      const apiModule = await import('../api');
      vi.mocked(apiModule.getAccessToken).mockReturnValueOnce(null as any);

      const onUpdate = vi.fn();
      const onError = vi.fn();

      const cleanup = subscribeToBudgetUpdates(onUpdate, onError);

      expect(onError).toHaveBeenCalled();
      expect(cleanup).toBeInstanceOf(Function);
    });

    it('should handle SSE message events', () => {
      const mockEventSource = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onmessage: null,
        onerror: null,
        close: vi.fn(),
        readyState: EventSource.OPEN,
        url: '',
        withCredentials: false,
        CONNECTING: 0,
        OPEN: 1,
        CLOSED: 2,
      };

      global.EventSource = vi.fn(() => mockEventSource as any) as any;

      const onUpdate = vi.fn();
      const onError = vi.fn();

      subscribeToBudgetUpdates(onUpdate, onError);

      // Simulate message event
      const messageEvent = {
        data: JSON.stringify({ event: 'status_update', budgets: [] }),
      };
      mockEventSource.onmessage?.(messageEvent);

      expect(onUpdate).toHaveBeenCalledWith({ event: 'status_update', budgets: [] });
    });

    it('should handle SSE error events', () => {
      const mockEventSource = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
        onmessage: null,
        onerror: null,
        close: vi.fn(),
        readyState: EventSource.CLOSED,
        url: '',
        withCredentials: false,
        CONNECTING: 0,
        OPEN: 1,
        CLOSED: 2,
      };

      global.EventSource = vi.fn(() => mockEventSource as any) as any;

      const onUpdate = vi.fn();
      const onError = vi.fn();

      subscribeToBudgetUpdates(onUpdate, onError);

      // Simulate error event
      mockEventSource.onerror?.(new Error('Connection failed'));

      expect(onError).toHaveBeenCalled();
      expect(mockEventSource.close).toHaveBeenCalled();
    });
  });
});












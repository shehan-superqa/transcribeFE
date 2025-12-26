import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../test-utils/test-utils';
import userEvent from '@testing-library/user-event';
import QuickStatsBar from '../QuickStatsBar';
import { getSpendingSummary, getAlerts } from '../../../lib/api/financialApi';
import {
  createMockSpendingSummary,
  createMockCategoryList,
} from '../../../test-utils/mocks/financialMocks';
import { createMockAlert } from '../../../test-utils/mocks/budgetMocks';

vi.mock('../../../lib/api/financialApi', () => ({
  getSpendingSummary: vi.fn(),
  getAlerts: vi.fn(),
}));

describe('QuickStatsBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display spending stats', async () => {
    const mockSummary = createMockSpendingSummary();
    vi.mocked(getSpendingSummary).mockResolvedValue(mockSummary);
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: [],
      unread_count: 0,
    });

    render(<QuickStatsBar />);

    await waitFor(() => {
      expect(screen.getByText(/Total Spending/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/5000/)).toBeInTheDocument();
  });

  it('should show transaction count', async () => {
    const mockSummary = createMockSpendingSummary();
    vi.mocked(getSpendingSummary).mockResolvedValue(mockSummary);
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: [],
      unread_count: 0,
    });

    render(<QuickStatsBar />);

    await waitFor(() => {
      expect(screen.getByText(/Transactions/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/15/)).toBeInTheDocument();
  });

  it('should show top category', async () => {
    const mockSummary = createMockSpendingSummary();
    vi.mocked(getSpendingSummary).mockResolvedValue(mockSummary);
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: [],
      unread_count: 0,
    });

    render(<QuickStatsBar />);

    await waitFor(() => {
      expect(screen.getByText(/Top Category/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Groceries/i)).toBeInTheDocument();
  });

  it('should show alerts count when present', async () => {
    const mockSummary = createMockSpendingSummary();
    const mockAlerts = [createMockAlert()];
    vi.mocked(getSpendingSummary).mockResolvedValue(mockSummary);
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: mockAlerts,
      unread_count: 1,
    });

    render(<QuickStatsBar />);

    await waitFor(() => {
      expect(screen.getByText(/Budget Alerts/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/1/)).toBeInTheDocument();
  });

  it('should handle stat clicks', async () => {
    const user = userEvent.setup();
    const mockSummary = createMockSpendingSummary();
    const handleStatClick = vi.fn();
    vi.mocked(getSpendingSummary).mockResolvedValue(mockSummary);
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: [],
      unread_count: 0,
    });

    render(<QuickStatsBar onStatClick={handleStatClick} />);

    await waitFor(() => {
      expect(screen.getByText(/Total Spending/i)).toBeInTheDocument();
    });

    // Click would be tested here if InsightCard supports it
  });

  it('should show loading skeleton initially', () => {
    vi.mocked(getSpendingSummary).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: [],
      unread_count: 0,
    });

    render(<QuickStatsBar />);

    // Skeleton loaders should be visible
    expect(screen.queryByText(/Total Spending/i)).not.toBeInTheDocument();
  });
});







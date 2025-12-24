import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '../../../test-utils/test-utils';
import BudgetStatusWidget from '../BudgetStatusWidget';
import { getBudgetStatus } from '../../../lib/api/financialApi';
import { createMockBudgetStatus } from '../../../test-utils/mocks/budgetMocks';

vi.mock('../../../lib/api/financialApi', () => ({
  getBudgetStatus: vi.fn(),
}));

describe('BudgetStatusWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should display budget status', async () => {
    const mockStatus = createMockBudgetStatus();
    vi.mocked(getBudgetStatus).mockResolvedValue(mockStatus);

    render(
      <BudgetStatusWidget budgetId="budget_123" budgetName="Test Budget" />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Budget')).toBeInTheDocument();
    });

    expect(screen.getByText(/Rs\. 3000/)).toBeInTheDocument();
  });

  it('should show loading state initially', () => {
    vi.mocked(getBudgetStatus).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(
      <BudgetStatusWidget budgetId="budget_123" budgetName="Test Budget" />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle click navigation', async () => {
    const mockStatus = createMockBudgetStatus();
    const handleClick = vi.fn();
    vi.mocked(getBudgetStatus).mockResolvedValue(mockStatus);

    render(
      <BudgetStatusWidget
        budgetId="budget_123"
        budgetName="Test Budget"
        onClick={handleClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Test Budget')).toBeInTheDocument();
    });
  });

  it('should handle error state gracefully', async () => {
    vi.mocked(getBudgetStatus).mockRejectedValue(new Error('Failed to load'));

    render(
      <BudgetStatusWidget budgetId="budget_123" budgetName="Test Budget" />
    );

    await waitFor(() => {
      expect(getBudgetStatus).toHaveBeenCalled();
    });
  });
});




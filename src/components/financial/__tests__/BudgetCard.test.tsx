import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test-utils/test-utils';
import userEvent from '@testing-library/user-event';
import BudgetCard from '../BudgetCard';
import {
  createMockBudgetStatus,
  createMockBudget,
} from '../../../test-utils/mocks/budgetMocks';

describe('BudgetCard', () => {
  it('should render budget information correctly', () => {
    const budgetStatus = createMockBudgetStatus();

    render(<BudgetCard budgetStatus={budgetStatus} />);

    expect(screen.getByText(budgetStatus.budget.name)).toBeInTheDocument();
    expect(screen.getByText(/Rs\. 3000/)).toBeInTheDocument();
    expect(screen.getByText(/Rs\. 5000/)).toBeInTheDocument();
  });

  it('should display progress bar with correct percentage', () => {
    const budgetStatus = createMockBudgetStatus({
      status: {
        ...createMockBudgetStatus().status,
        percentage_used: 60,
      },
    });

    render(<BudgetCard budgetStatus={budgetStatus} />);

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'Budget usage: 60.0%');
  });

  it('should show alert indicators for warning status', () => {
    const budgetStatus = createMockBudgetStatus({
      status: {
        ...createMockBudgetStatus().status,
        alert_level: 'warning',
        percentage_used: 85,
      },
    });

    render(<BudgetCard budgetStatus={budgetStatus} />);

    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  it('should show alert indicators for critical status', () => {
    const budgetStatus = createMockBudgetStatus({
      status: {
        ...createMockBudgetStatus().status,
        alert_level: 'critical',
        percentage_used: 96,
      },
    });

    render(<BudgetCard budgetStatus={budgetStatus} />);

    expect(screen.getByText('critical')).toBeInTheDocument();
  });

  it('should show alert indicators for exceeded status', () => {
    const budgetStatus = createMockBudgetStatus({
      status: {
        ...createMockBudgetStatus().status,
        alert_level: 'exceeded',
        percentage_used: 105,
        remaining: -250,
      },
    });

    render(<BudgetCard budgetStatus={budgetStatus} />);

    expect(screen.getByText(/Rs\. 250.*over/)).toBeInTheDocument();
  });

  it('should handle edit button click', async () => {
    const user = userEvent.setup();
    const budgetStatus = createMockBudgetStatus();
    const handleEdit = vi.fn();

    render(
      <BudgetCard budgetStatus={budgetStatus} onEdit={handleEdit} />
    );

    const editButton = screen.getByLabelText('Edit budget');
    await user.click(editButton);

    expect(handleEdit).toHaveBeenCalledWith(budgetStatus.budget);
  });

  it('should handle delete button click', async () => {
    const user = userEvent.setup();
    const budgetStatus = createMockBudgetStatus();
    const handleDelete = vi.fn();

    render(
      <BudgetCard budgetStatus={budgetStatus} onDelete={handleDelete} />
    );

    const deleteButton = screen.getByLabelText('Delete budget');
    await user.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledWith(budgetStatus.budget._id);
  });

  it('should handle view details click', async () => {
    const user = userEvent.setup();
    const budgetStatus = createMockBudgetStatus();
    const handleViewDetails = vi.fn();

    render(
      <BudgetCard
        budgetStatus={budgetStatus}
        onViewDetails={handleViewDetails}
      />
    );

    const card = screen.getByRole('button');
    await user.click(card);

    expect(handleViewDetails).toHaveBeenCalledWith(budgetStatus.budget._id);
  });

  it('should display category name when provided', () => {
    const budgetStatus = createMockBudgetStatus();

    render(
      <BudgetCard budgetStatus={budgetStatus} categoryName="Groceries" />
    );

    expect(screen.getByText(/Category: Groceries/)).toBeInTheDocument();
  });

  it('should show projections when available', () => {
    const budgetStatus = createMockBudgetStatus({
      status: {
        ...createMockBudgetStatus().status,
        projected_spending: 4500,
        projected_over_budget: false,
      },
    });

    render(<BudgetCard budgetStatus={budgetStatus} />);

    expect(screen.getByText(/Projected Spending/)).toBeInTheDocument();
    expect(screen.getByText(/Rs\. 4500/)).toBeInTheDocument();
  });

  it('should show over budget warning when projected over', () => {
    const budgetStatus = createMockBudgetStatus({
      status: {
        ...createMockBudgetStatus().status,
        projected_spending: 5500,
        projected_over_budget: true,
      },
    });

    render(<BudgetCard budgetStatus={budgetStatus} />);

    expect(
      screen.getByText(/Warning: Projected to exceed budget/)
    ).toBeInTheDocument();
  });

  it('should display recommendations', () => {
    const budgetStatus = createMockBudgetStatus({
      status: {
        ...createMockBudgetStatus().status,
        recommendations: ['Reduce spending', 'Review subscriptions'],
      },
    });

    render(<BudgetCard budgetStatus={budgetStatus} />);

    expect(screen.getByText(/Recommendations:/)).toBeInTheDocument();
    expect(screen.getByText(/Reduce spending/)).toBeInTheDocument();
    expect(screen.getByText(/Review subscriptions/)).toBeInTheDocument();
  });

  it('should display alerts', () => {
    const budgetStatus = createMockBudgetStatus({
      status: {
        ...createMockBudgetStatus().status,
        alerts: [
          {
            type: 'warning',
            message: 'Approaching budget limit',
            triggered_at: new Date().toISOString(),
          },
        ],
      },
    });

    render(<BudgetCard budgetStatus={budgetStatus} />);

    expect(screen.getByText(/Approaching budget limit/)).toBeInTheDocument();
  });

  it('should be accessible with ARIA labels', () => {
    const budgetStatus = createMockBudgetStatus();

    render(<BudgetCard budgetStatus={budgetStatus} />);

    const card = screen.getByLabelText(
      expect.stringContaining('Budget:')
    );
    expect(card).toBeInTheDocument();
  });

  it('should handle keyboard navigation', async () => {
    const user = userEvent.setup();
    const budgetStatus = createMockBudgetStatus();
    const handleViewDetails = vi.fn();

    render(
      <BudgetCard
        budgetStatus={budgetStatus}
        onViewDetails={handleViewDetails}
      />
    );

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');

    expect(handleViewDetails).toHaveBeenCalled();
  });
});







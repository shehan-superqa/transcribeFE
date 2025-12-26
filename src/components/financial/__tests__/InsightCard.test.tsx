import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test-utils/test-utils';
import userEvent from '@testing-library/user-event';
import InsightCard from '../InsightCard';

describe('InsightCard', () => {
  it('should render all props correctly', () => {
    render(
      <InsightCard
        title="Total Spending"
        value={5000}
        subtitle="This month"
        trend="up"
        type="info"
        actionLabel="View details"
      />
    );

    expect(screen.getByText('Total Spending')).toBeInTheDocument();
    expect(screen.getByText('5000')).toBeInTheDocument();
    expect(screen.getByText('This month')).toBeInTheDocument();
    expect(screen.getByText('View details')).toBeInTheDocument();
  });

  it('should display trend icons correctly', () => {
    const { rerender } = render(
      <InsightCard title="Test" value={100} trend="up" />
    );
    expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();

    rerender(<InsightCard title="Test" value={100} trend="down" />);
    expect(screen.getByTestId('TrendingDownIcon')).toBeInTheDocument();

    rerender(<InsightCard title="Test" value={100} trend="neutral" />);
    expect(screen.queryByTestId('TrendingUpIcon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('TrendingDownIcon')).not.toBeInTheDocument();
  });

  it('should display type icons correctly', () => {
    const { rerender } = render(
      <InsightCard title="Test" value={100} type="success" />
    );
    expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();

    rerender(<InsightCard title="Test" value={100} type="warning" />);
    expect(screen.getByTestId('WarningIcon')).toBeInTheDocument();

    rerender(<InsightCard title="Test" value={100} type="error" />);
    expect(screen.getByTestId('ErrorIcon')).toBeInTheDocument();

    rerender(<InsightCard title="Test" value={100} type="info" />);
    expect(screen.getByTestId('InfoIcon')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <InsightCard title="Test" value={100} onClick={handleClick} />
    );

    const card = screen.getByRole('button');
    await user.click(card);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not be clickable when onClick is not provided', () => {
    render(<InsightCard title="Test" value={100} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should display action label when provided', () => {
    render(
      <InsightCard title="Test" value={100} actionLabel="View more" />
    );

    expect(screen.getByText('View more')).toBeInTheDocument();
  });

  it('should handle string values', () => {
    render(<InsightCard title="Category" value="Groceries" />);

    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('should handle numeric values', () => {
    render(<InsightCard title="Amount" value={1234.56} />);

    expect(screen.getByText('1234.56')).toBeInTheDocument();
  });

  it('should be accessible with ARIA labels', () => {
    render(
      <InsightCard
        title="Test"
        value={100}
        onClick={() => {}}
        actionLabel="Click me"
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });
});







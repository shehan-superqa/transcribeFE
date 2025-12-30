import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '../../../test-utils/test-utils';
import userEvent from '@testing-library/user-event';
import AlertsPanel from '../AlertsPanel';
import { getAlerts, markAlertRead, markAllAlertsRead } from '../../../lib/api/financialApi';
import { createMockAlert } from '../../../test-utils/mocks/budgetMocks';

vi.mock('../../../lib/api/financialApi', () => ({
  getAlerts: vi.fn(),
  markAlertRead: vi.fn(),
  markAllAlertsRead: vi.fn(),
}));

describe('AlertsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should display alerts list', async () => {
    const mockAlerts = [
      createMockAlert({ _id: 'alert_1', title: 'Budget Warning' }),
      createMockAlert({ _id: 'alert_2', title: 'Category Cap Exceeded' }),
    ];
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: mockAlerts,
      unread_count: 2,
    });

    render(<AlertsPanel />);

    await waitFor(() => {
      expect(screen.getByText('Budget Warning')).toBeInTheDocument();
    });

    expect(screen.getByText('Category Cap Exceeded')).toBeInTheDocument();
  });

  it('should show unread count badge', async () => {
    const mockAlerts = [createMockAlert()];
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: mockAlerts,
      unread_count: 1,
    });

    render(<AlertsPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Budget Alerts/i)).toBeInTheDocument();
    });
  });

  it('should mark alert as read', async () => {
    const user = userEvent.setup();
    const mockAlert = createMockAlert({ _id: 'alert_1', read: false });
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: [mockAlert],
      unread_count: 1,
    });
    vi.mocked(markAlertRead).mockResolvedValue({
      success: true,
      alert: { ...mockAlert, read: true },
    });

    render(<AlertsPanel />);

    await waitFor(() => {
      expect(screen.getByText(mockAlert.title)).toBeInTheDocument();
    });

    const markReadButton = screen.getByLabelText('Mark alert as read');
    await user.click(markReadButton);

    await waitFor(() => {
      expect(markAlertRead).toHaveBeenCalledWith('alert_1');
    });
  });

  it('should mark all alerts as read', async () => {
    const user = userEvent.setup();
    const mockAlerts = [
      createMockAlert({ _id: 'alert_1', read: false }),
      createMockAlert({ _id: 'alert_2', read: false }),
    ];
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: mockAlerts,
      unread_count: 2,
    });
    vi.mocked(markAllAlertsRead).mockResolvedValue({
      success: true,
      updated_count: 2,
    });

    render(<AlertsPanel />);

    await waitFor(() => {
      expect(screen.getByText(/Mark All Read/i)).toBeInTheDocument();
    });

    const markAllButton = screen.getByText(/Mark All Read/i);
    await user.click(markAllButton);

    await waitFor(() => {
      expect(markAllAlertsRead).toHaveBeenCalled();
    });
  });

  it('should filter unread alerts in compact mode', async () => {
    const mockAlerts = [
      createMockAlert({ _id: 'alert_1', read: false }),
      createMockAlert({ _id: 'alert_2', read: true }),
    ];
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: [mockAlerts[0]],
      unread_count: 1,
    });

    render(<AlertsPanel compact />);

    await waitFor(() => {
      expect(getAlerts).toHaveBeenCalledWith({ unread_only: true });
    });
  });

  it('should handle alert click', async () => {
    const user = userEvent.setup();
    const handleAlertClick = vi.fn();
    const mockAlert = createMockAlert();
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: [mockAlert],
      unread_count: 1,
    });

    render(<AlertsPanel onAlertClick={handleAlertClick} />);

    await waitFor(() => {
      expect(screen.getByText(mockAlert.title)).toBeInTheDocument();
    });

    const alertItem = screen.getByText(mockAlert.title).closest('li');
    if (alertItem) {
      await user.click(alertItem);
      expect(handleAlertClick).toHaveBeenCalledWith(mockAlert);
    }
  });

  it('should show empty state', async () => {
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: [],
      unread_count: 0,
    });

    render(<AlertsPanel />);

    await waitFor(() => {
      expect(screen.getByText(/No alerts at this time/i)).toBeInTheDocument();
    });
  });

  it('should show severity indicators', async () => {
    const mockAlerts = [
      createMockAlert({ severity: 'warning' }),
      createMockAlert({ severity: 'critical', _id: 'alert_2' }),
    ];
    vi.mocked(getAlerts).mockResolvedValue({
      success: true,
      alerts: mockAlerts,
      unread_count: 2,
    });

    render(<AlertsPanel />);

    await waitFor(() => {
      expect(screen.getByText(/warning/i)).toBeInTheDocument();
    });
  });
});











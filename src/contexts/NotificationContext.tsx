/**
 * Notification context for toast notifications with action support
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { Snackbar, Alert, AlertColor } from '@mui/material';
import { Box } from '@mui/material';
import ActionNotification, { ActionNotificationData, NotificationAction } from '../components/common/ActionNotification';
import { unifiedWebSocketClient } from '../lib/api/websocket';

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  showActionNotification: (notification: Omit<ActionNotificationData, 'id'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
}

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');
  const [actionNotifications, setActionNotifications] = useState<ActionNotificationData[]>([]);

  // Listen for WebSocket notifications
  useEffect(() => {
    const handleWebSocketNotification = (data: {
      title: string;
      message: string;
      type?: 'success' | 'info' | 'warning' | 'error';
      actions?: Array<{
        label: string;
        action: string;
        data?: any;
      }>;
      duration?: number;
    }) => {
      const notification: ActionNotificationData = {
        id: `ws-${Date.now()}-${Math.random()}`,
        title: data.title,
        message: data.message,
        type: data.type || 'info',
        duration: data.duration || 8000,
        actions: data.actions?.map((action) => ({
          label: action.label,
          variant: action.action === 'view' ? 'primary' : 'secondary',
          onClick: () => {
            // Handle action based on action type
            if (action.action === 'view' && action.data) {
              // Navigate or perform view action
              console.log('View action:', action.data);
            }
          },
        })),
      };
      setActionNotifications((prev) => [...prev, notification]);
    };

    // Subscribe to notification events from WebSocket
    unifiedWebSocketClient.on('notification', handleWebSocketNotification);
    
    const handleBillProcessed = (data: any) => {
      handleWebSocketNotification({
        title: 'Bill Processed Successfully',
        message: data.message || `Your ${data.bill_type || 'bill'} for ${data.month || 'this month'} has been scheduled for payment via AutoPay.`,
        type: 'success',
        actions: [
          {
            label: 'View Bill',
            action: 'view',
            data: { bill_id: data.bill_id, transaction_id: data.transaction_id },
          },
        ],
      });
    };

    const handleTransactionCreated = (data: any) => {
      handleWebSocketNotification({
        title: 'Transaction Created',
        message: data.message || `Transaction for ${data.amount || 'amount'} has been created successfully.`,
        type: 'success',
        actions: data.transaction_id
          ? [
              {
                label: 'View Transaction',
                action: 'view',
                data: { transaction_id: data.transaction_id },
              },
            ]
          : undefined,
      });
    };

    const handleRecurringPaymentCreated = (data: any) => {
      handleWebSocketNotification({
        title: 'Recurring Payment Created',
        message: data.message || `Recurring payment "${data.name || 'payment'}" has been set up successfully.`,
        type: 'success',
      });
    };

    unifiedWebSocketClient.on('bill_processed', handleBillProcessed);
    unifiedWebSocketClient.on('transaction_created', handleTransactionCreated);
    unifiedWebSocketClient.on('recurring_payment_created', handleRecurringPaymentCreated);

    return () => {
      unifiedWebSocketClient.off('notification', handleWebSocketNotification);
      unifiedWebSocketClient.off('bill_processed', handleBillProcessed);
      unifiedWebSocketClient.off('transaction_created', handleTransactionCreated);
      unifiedWebSocketClient.off('recurring_payment_created', handleRecurringPaymentCreated);
    };
  }, []);

  const showNotification = useCallback((msg: string, sev: AlertColor = 'info') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  }, []);

  const showSuccess = useCallback((msg: string) => {
    showNotification(msg, 'success');
  }, [showNotification]);

  const showError = useCallback((msg: string) => {
    showNotification(msg, 'error');
  }, [showNotification]);

  const showWarning = useCallback((msg: string) => {
    showNotification(msg, 'warning');
  }, [showNotification]);

  const showInfo = useCallback((msg: string) => {
    showNotification(msg, 'info');
  }, [showNotification]);

  const showActionNotification = useCallback((notification: Omit<ActionNotificationData, 'id'>) => {
    const newNotification: ActionNotificationData = {
      ...notification,
      id: `action-${Date.now()}-${Math.random()}`,
    };
    setActionNotifications((prev) => [...prev, newNotification]);
  }, []);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  const handleDismissNotification = useCallback((id: string) => {
    setActionNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleCloseNotification = useCallback((id: string) => {
    setActionNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showActionNotification,
      }}
    >
      {children}
      {/* Legacy Snackbar for simple notifications */}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          sx={{
            backgroundColor: severity === 'error' ? '#1e1e1e' : '#1e1e1e',
            color: severity === 'error' ? '#f44336' : severity === 'success' ? '#4caf50' : '#e0e0e0',
            '& .MuiAlert-icon': {
              color: severity === 'error' ? '#f44336' : severity === 'success' ? '#4caf50' : '#00c6ff',
            },
          }}
        >
          {message}
        </Alert>
      </Snackbar>

      {/* Action Notifications - Bottom Left */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 40,
          left: 40,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          pointerEvents: 'none',
        }}
      >
        {actionNotifications.map((notification, index) => (
          <Box
            key={notification.id}
            sx={{
              pointerEvents: 'auto',
              transform: `translateY(${index * 10}px)`,
              transition: 'transform 0.3s ease-out',
            }}
          >
            <ActionNotification
              notification={notification}
              onClose={handleCloseNotification}
              onDismiss={handleDismissNotification}
            />
          </Box>
        ))}
      </Box>
    </NotificationContext.Provider>
  );
}

import { Box, Paper, Typography, Button } from '@mui/material';
import { useTheme } from '../../../contexts/ThemeContext';
import { Transaction, Merchant, Category } from '../../../types/financial';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

interface RightSidebarProps {
  userName: string;
  transactions: Transaction[];
  merchants: Merchant[];
  categories: Category[];
  getMerchantName: (merchantId: string | null | undefined) => string;
  getTransactionType: (transaction: Transaction) => 'expense' | 'earning';
  onUploadClick: () => void;
  onManualTransactionClick: () => void;
  onAskAIClick: () => void;
  onViewTransactions: () => void;
}

export default function RightSidebar({
  userName,
  transactions,
  merchants,
  categories,
  getMerchantName,
  getTransactionType,
  onUploadClick,
  onManualTransactionClick,
  onAskAIClick,
  onViewTransactions,
}: RightSidebarProps) {
  const { theme } = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Account Overview */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          border: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
          bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
          boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 700,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: theme.palette.text.primary,
          }}
        >
          <DonutLargeIcon sx={{ color: '#6D28D9', fontSize: 18 }} />
          Account Overview
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F9FAFB', borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '10px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
              User
            </Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userName.split('@')[0]}
            </Typography>
          </Box>
          <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F9FAFB', borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '10px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
              Total Tx
            </Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: theme.palette.text.primary }}>
              {transactions.length}
            </Typography>
          </Box>
          <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F9FAFB', borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '10px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
              Categories
            </Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: theme.palette.text.primary }}>
              {categories.length}
            </Typography>
          </Box>
          <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F9FAFB', borderRadius: '12px' }}>
            <Typography sx={{ fontSize: '10px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
              Merchants
            </Typography>
            <Typography sx={{ fontSize: '14px', fontWeight: 700, color: theme.palette.text.primary }}>
              {merchants.length}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Quick Actions */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          border: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
          bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
          boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Typography
          sx={{
            fontSize: '14px',
            fontWeight: 700,
            mb: 2,
            color: theme.palette.text.primary,
          }}
        >
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="contained"
            onClick={onUploadClick}
            startIcon={<CloudUploadIcon />}
            sx={{
              bgcolor: '#6D28D9',
              color: '#FFFFFF',
              fontWeight: 700,
              py: 1.5,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '14px',
              boxShadow: '0 4px 6px rgba(109, 40, 217, 0.2)',
              '&:hover': {
                bgcolor: '#7C3AED',
                boxShadow: '0 6px 8px rgba(109, 40, 217, 0.3)',
              },
            }}
          >
            Upload Bill
          </Button>
          <Button
            variant="outlined"
            onClick={onManualTransactionClick}
            startIcon={<AddIcon />}
            sx={{
              borderColor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
              bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
              color: theme.palette.text.primary,
              py: 1.25,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? '#4B5563' : '#D1D5DB',
                bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F9FAFB',
              },
            }}
          >
            Manual Transaction
          </Button>
          <Button
            variant="outlined"
            onClick={onAskAIClick}
            startIcon={<AutoAwesomeIcon />}
            sx={{
              borderColor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
              bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
              color: theme.palette.text.primary,
              py: 1.25,
              borderRadius: '12px',
              textTransform: 'none',
              fontSize: '14px',
              fontWeight: 500,
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? '#4B5563' : '#D1D5DB',
                bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F9FAFB',
              },
            }}
          >
            Ask AI
          </Button>
        </Box>
      </Paper>

      {/* Latest Activity */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: '16px',
          border: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
          bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
          boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: 700,
              color: theme.palette.text.primary,
            }}
          >
            Latest Activity
          </Typography>
          <Button
            size="small"
            sx={{
              textTransform: 'none',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6D28D9',
              minWidth: 'auto',
              p: 0,
              '&:hover': {
                textDecoration: 'underline',
                bgcolor: 'transparent',
              },
            }}
            onClick={onViewTransactions}
          >
            See all
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {transactions.length === 0 ? (
            <Typography sx={{ fontSize: '14px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280' }}>
              No transactions yet.
            </Typography>
          ) : (
            transactions.slice(0, 2).map((transaction) => {
              const merchantName = getMerchantName(transaction.merchant_id);
              const transactionType = getTransactionType(transaction);
              const isEarning = transactionType === 'earning';
              const amount = transaction.amount || 0;
              const currency = transaction.currency || 'USD';
              const date = transaction.date ? new Date(transaction.date) : new Date();
              
              return (
                <Box
                  key={transaction._id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#EF4444',
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                        {merchantName}
                      </Typography>
                      <Typography sx={{ fontSize: '10px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                        {date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>
                    {isEarning ? '+' : '-'}{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>
      </Paper>
    </Box>
  );
}


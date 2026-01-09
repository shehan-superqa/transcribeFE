import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  SwapHoriz as SwapHorizIcon,
  Payments as PaymentsIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  FitnessCenter as FitnessCenterIcon,
  Bolt as BoltIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { RecurringPayment } from '../../types/financial';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency } from '../../utils/transactionHelpers';

// Dummy data matching the design
const dummyRecurringPayments: RecurringPayment[] = [
  {
    _id: '1',
    user_id: 'user1',
    name: 'Monthly Salary',
    type: 'earning',
    amount: 5000,
    currency: 'USD',
    frequency: 'monthly',
    start_date: '2024-01-01',
    next_occurrence: '2024-02-01',
    is_variable: false,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    _id: '2',
    user_id: 'user1',
    name: 'Rent Payment',
    type: 'expense',
    amount: 1500,
    currency: 'USD',
    frequency: 'monthly',
    start_date: '2024-01-05',
    next_occurrence: '2024-02-05',
    is_variable: false,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    _id: '3',
    user_id: 'user1',
    name: 'Freelance Income',
    type: 'earning',
    amount: 800,
    currency: 'USD',
    frequency: 'weekly',
    start_date: '2024-01-01',
    next_occurrence: '2024-01-29',
    is_variable: true,
    variable_amounts: [
      { date: '2024-01-08', amount: 750 },
      { date: '2024-01-15', amount: 900 },
      { date: '2024-01-22', amount: 800 },
    ],
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    _id: '4',
    user_id: 'user1',
    name: 'Gym Membership',
    type: 'expense',
    amount: 50,
    currency: 'USD',
    frequency: 'monthly',
    start_date: '2024-01-10',
    next_occurrence: '2024-02-10',
    is_variable: false,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    _id: '5',
    user_id: 'user1',
    name: 'Utility Bills',
    type: 'expense',
    amount: 200,
    currency: 'USD',
    frequency: 'monthly',
    start_date: '2024-01-15',
    next_occurrence: '2024-02-15',
    is_variable: true,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

const getPaymentIcon = (name: string, type: 'earning' | 'expense') => {
  const lowerName = name.toLowerCase();
  if (lowerName.includes('salary') || lowerName.includes('payment')) {
    return <PaymentsIcon />;
  }
  if (lowerName.includes('rent') || lowerName.includes('housing')) {
    return <HomeIcon />;
  }
  if (lowerName.includes('freelance') || lowerName.includes('work')) {
    return <WorkIcon />;
  }
  if (lowerName.includes('gym') || lowerName.includes('fitness')) {
    return <FitnessCenterIcon />;
  }
  if (lowerName.includes('utility') || lowerName.includes('bill')) {
    return <BoltIcon />;
  }
  return type === 'earning' ? <TrendingUpIcon /> : <TrendingDownIcon />;
};

const getPaymentSubtitle = (payment: RecurringPayment) => {
  if (payment.name.toLowerCase().includes('salary')) return 'Employment Income';
  if (payment.name.toLowerCase().includes('rent')) return 'Housing';
  if (payment.name.toLowerCase().includes('freelance')) return 'Side Project';
  if (payment.name.toLowerCase().includes('gym')) return 'Health & Fitness';
  if (payment.name.toLowerCase().includes('utility')) return 'Maintenance';
  return '';
};

export default function RecurringPaymentsSection() {
  const { theme } = useTheme();
  const [payments, setPayments] = useState<RecurringPayment[]>(dummyRecurringPayments);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'earning' | 'expense',
    amount: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
    custom_interval_days: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_variable: false,
    is_active: true,
  });

  const handleOpenDialog = (payment?: RecurringPayment) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        name: payment.name,
        type: payment.type,
        amount: payment.amount.toString(),
        frequency: payment.frequency,
        custom_interval_days: payment.custom_interval_days?.toString() || '',
        start_date: payment.start_date.split('T')[0],
        end_date: payment.end_date?.split('T')[0] || '',
        is_variable: payment.is_variable,
        is_active: payment.is_active,
      });
    } else {
      setEditingPayment(null);
      setFormData({
        name: '',
        type: 'expense',
        amount: '',
        frequency: 'monthly',
        custom_interval_days: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_variable: false,
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPayment(null);
  };

  const handleSave = () => {
    if (editingPayment) {
      setPayments(payments.map(p => 
        p._id === editingPayment._id 
          ? {
              ...p,
              name: formData.name,
              type: formData.type,
              amount: parseFloat(formData.amount),
              frequency: formData.frequency,
              custom_interval_days: formData.custom_interval_days ? parseInt(formData.custom_interval_days) : undefined,
              end_date: formData.end_date || null,
              is_variable: formData.is_variable,
              is_active: formData.is_active,
              updated_at: new Date().toISOString(),
            }
          : p
      ));
    } else {
      const newPayment: RecurringPayment = {
        _id: Date.now().toString(),
        user_id: 'user1',
        name: formData.name,
        type: formData.type,
        amount: parseFloat(formData.amount),
        currency: 'USD',
        frequency: formData.frequency,
        custom_interval_days: formData.custom_interval_days ? parseInt(formData.custom_interval_days) : undefined,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        next_occurrence: formData.start_date,
        is_variable: formData.is_variable,
        is_active: formData.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPayments([...payments, newPayment]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this recurring payment?')) {
      setPayments(payments.filter(p => p._id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setPayments(payments.map(p => 
      p._id === id ? { ...p, is_active: !p.is_active } : p
    ));
  };

  const activePayments = payments.filter(p => p.is_active);
  const totalEarnings = activePayments
    .filter(p => p.type === 'earning')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = activePayments
    .filter(p => p.type === 'expense')
    .reduce((sum, p) => sum + p.amount, 0);
  const netMonthly = totalEarnings - totalExpenses;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatFrequency = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  const renderCardView = () => (
    <Box>
      <Grid container spacing={3}>
        {payments.map((payment) => (
          <Grid item xs={12} lg={6} key={payment._id}>
            <Card
              className="group"
              sx={{
                borderRadius: '16px',
                border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
                bgcolor: theme.palette.background.paper,
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        mb: 1,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {payment.name}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip
                        label={payment.type === 'earning' ? 'EARNING' : 'EXPENSE'}
                        size="small"
                        sx={{
                          height: '20px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          bgcolor: payment.type === 'earning'
                            ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5')
                            : (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2'),
                          color: payment.type === 'earning'
                            ? (theme.palette.mode === 'dark' ? '#6EE7B7' : '#065F46')
                            : (theme.palette.mode === 'dark' ? '#FCA5A5' : '#991B1B'),
                          fontFamily: "'Inter', sans-serif",
                        }}
                      />
                      <Chip
                        label={formatFrequency(payment.frequency).toUpperCase()}
                        size="small"
                        sx={{
                          height: '20px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F1F5F9',
                          color: theme.palette.mode === 'dark' ? '#CBD5E1' : '#475569',
                          fontFamily: "'Inter', sans-serif",
                        }}
                      />
                      {payment.is_variable && (
                        <Chip
                          label="VARIABLE"
                          size="small"
                          sx={{
                            height: '20px',
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            bgcolor: theme.palette.mode === 'dark' ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7',
                            color: theme.palette.mode === 'dark' ? '#FCD34D' : '#92400E',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5, opacity: 0, transition: 'opacity 0.2s', '.group:hover &': { opacity: 1 } }}>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(payment)}
                      sx={{
                        p: 1.5,
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          color: '#6D28D9',
                          bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                        },
                      }}
                    >
                      <EditIcon sx={{ fontSize: '18px' }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(payment._id)}
                      sx={{
                        p: 1.5,
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          color: '#EF4444',
                          bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                        },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: '18px' }} />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        mb: 0.5,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {formatCurrency(payment.amount, payment.currency)}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: theme.palette.text.secondary,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Next: {formatDate(payment.next_occurrence)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: theme.palette.text.secondary,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Active
                    </Typography>
                    <Switch
                      checked={payment.is_active}
                      onChange={() => handleToggleActive(payment._id)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#6D28D9',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#6D28D9',
                        },
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
        <Grid item xs={12} lg={6}>
          <Card
            onClick={() => handleOpenDialog()}
            sx={{
              borderRadius: '16px',
              border: `2px dashed ${theme.palette.mode === 'dark' ? '#475569' : '#CBD5E1'}`,
              bgcolor: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.2s',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              '&:hover': {
                borderColor: '#6D28D9',
                bgcolor: theme.palette.mode === 'dark' ? 'rgba(109, 40, 217, 0.1)' : 'rgba(109, 40, 217, 0.05)',
              },
            }}
          >
            <AddIcon
              sx={{
                fontSize: '48px',
                color: theme.palette.text.secondary,
                mb: 1,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
              }}
            />
            <Typography
              sx={{
                fontWeight: 500,
                color: theme.palette.text.secondary,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Add New Recurring Item
            </Typography>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderTableView = () => (
    <Box>
      <TableContainer
        component={Paper}
        sx={{
          borderRadius: '16px',
          border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
          bgcolor: theme.palette.background.paper,
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC',
                borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
              }}
            >
              <TableCell
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.palette.text.secondary,
                  fontFamily: "'Inter', sans-serif",
                  py: 2,
                  px: 3,
                }}
              >
                Service & Name
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.palette.text.secondary,
                  fontFamily: "'Inter', sans-serif",
                  py: 2,
                  px: 3,
                }}
              >
                Category
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.palette.text.secondary,
                  fontFamily: "'Inter', sans-serif",
                  py: 2,
                  px: 3,
                }}
              >
                Amount
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.palette.text.secondary,
                  fontFamily: "'Inter', sans-serif",
                  py: 2,
                  px: 3,
                }}
              >
                Next Date
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.palette.text.secondary,
                  fontFamily: "'Inter', sans-serif",
                  py: 2,
                  px: 3,
                }}
              >
                Status
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payments.map((payment) => (
              <TableRow
                key={payment._id}
                sx={{
                  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#1E293B' : '#F1F5F9'}`,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : '#F9FAFB',
                  },
                }}
              >
                <TableCell sx={{ py: 2.5, px: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F1F5F9',
                        color: theme.palette.text.secondary,
                      }}
                    >
                      {getPaymentIcon(payment.name, payment.type)}
                    </Avatar>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 600,
                          color: theme.palette.text.primary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {payment.name}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '12px',
                          color: theme.palette.text.secondary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {getPaymentSubtitle(payment)}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ py: 2.5, px: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    <Chip
                      label={payment.type === 'earning' ? 'Earning' : 'Expense'}
                      size="small"
                      sx={{
                        height: '20px',
                        fontSize: '10px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        bgcolor: payment.type === 'earning'
                          ? (theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5')
                          : (theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2'),
                        color: payment.type === 'earning'
                          ? (theme.palette.mode === 'dark' ? '#6EE7B7' : '#065F46')
                          : (theme.palette.mode === 'dark' ? '#FCA5A5' : '#991B1B'),
                        fontFamily: "'Inter', sans-serif",
                      }}
                    />
                    {payment.is_variable && (
                      <Chip
                        label="Variable"
                        size="small"
                        sx={{
                          height: '20px',
                          fontSize: '10px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7',
                          color: theme.palette.mode === 'dark' ? '#FCD34D' : '#92400E',
                          fontFamily: "'Inter', sans-serif",
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="right" sx={{ py: 2.5, px: 3 }}>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: payment.type === 'earning' ? '#10B981' : theme.palette.text.primary,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {payment.type === 'earning' ? '+' : '-'}
                    {formatCurrency(payment.amount, payment.currency)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 2.5, px: 3 }}>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      color: theme.palette.text.secondary,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {formatDate(payment.next_occurrence)}
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ py: 2.5, px: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                    <Switch
                      checked={payment.is_active}
                      onChange={() => handleToggleActive(payment._id)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#6D28D9',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#6D28D9',
                        },
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(payment._id)}
                      sx={{
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          color: '#EF4444',
                        },
                      }}
                    >
                      <DeleteIcon sx={{ fontSize: '20px' }} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: '1152px', margin: '0 auto', px: { xs: 2, sm: 3 }, py: 2.5 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2, mb: 4 }}>
        <Box>
          <Typography
            sx={{
              fontSize: '30px',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: theme.palette.text.primary,
              mb: 0.5,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Recurring Payments
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              color: theme.palette.text.secondary,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Manage your automated income and expenses in one place.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{
            bgcolor: '#6D28D9',
            color: '#ffffff',
            fontWeight: 600,
            px: 3,
            py: 1.25,
            borderRadius: '12px',
            textTransform: 'none',
            boxShadow: '0 4px 6px -1px rgba(109, 40, 217, 0.2)',
            fontFamily: "'Inter', sans-serif",
            '&:hover': {
              bgcolor: '#5b21b6',
            },
          }}
        >
          Add Recurring Payment
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: '16px',
              border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
              bgcolor: theme.palette.background.paper,
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.palette.text.secondary,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Monthly Earnings
              </Typography>
              <Box
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                }}
              >
                <TrendingUpIcon sx={{ fontSize: '20px', color: '#10B981' }} />
              </Box>
            </Box>
            <Typography
              sx={{
                fontSize: '30px',
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {formatCurrency(totalEarnings, 'USD')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingUpIcon sx={{ fontSize: '12px', color: '#10B981' }} />
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#10B981',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                12% from last month
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: '16px',
              border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
              bgcolor: theme.palette.background.paper,
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.palette.text.secondary,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Monthly Expenses
              </Typography>
              <Box
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
                }}
              >
                <TrendingDownIcon sx={{ fontSize: '20px', color: '#EF4444' }} />
              </Box>
            </Box>
            <Typography
              sx={{
                fontSize: '30px',
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {formatCurrency(totalExpenses, 'USD')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <TrendingDownIcon sx={{ fontSize: '12px', color: '#EF4444' }} />
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#EF4444',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                5.4% from last month
              </Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              borderRadius: '16px',
              border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
              bgcolor: theme.palette.background.paper,
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              p: 3,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: theme.palette.text.secondary,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Net Monthly
              </Typography>
              <Box
                sx={{
                  p: 1,
                  borderRadius: '8px',
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(109, 40, 217, 0.2)' : '#F3E8FF',
                }}
              >
                <SwapHorizIcon sx={{ fontSize: '20px', color: '#6D28D9' }} />
              </Box>
            </Box>
            <Typography
              sx={{
                fontSize: '30px',
                fontWeight: 700,
                color: theme.palette.text.primary,
                mb: 1,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {formatCurrency(netMonthly, 'USD')}
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 500,
                color: theme.palette.text.secondary,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Projected surplus
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* View Toggle and Section Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          sx={{
            fontSize: '20px',
            fontWeight: 600,
            color: theme.palette.text.primary,
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Active Subscriptions & Income
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.text.primary,
                bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
              },
            }}
          >
            <FilterListIcon />
          </IconButton>
          <IconButton
            size="small"
            sx={{
              color: theme.palette.text.secondary,
              '&:hover': {
                color: theme.palette.text.primary,
                bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
              },
            }}
          >
            <SortIcon />
          </IconButton>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, newMode) => {
              if (newMode !== null) {
                setViewMode(newMode);
              }
            }}
            size="small"
            sx={{
              ml: 1,
              '& .MuiToggleButton-root': {
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.secondary,
                '&.Mui-selected': {
                  bgcolor: '#6D28D9',
                  color: '#ffffff',
                  '&:hover': {
                    bgcolor: '#5b21b6',
                  },
                },
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                },
              },
            }}
          >
            <ToggleButton value="card">
              <ViewModuleIcon sx={{ fontSize: '18px' }} />
            </ToggleButton>
            <ToggleButton value="table">
              <ViewListIcon sx={{ fontSize: '18px' }} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Payments List - Card or Table View */}
      {payments.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: '12px' }}>
          No recurring payments configured. Click "Add Recurring Payment" to get started.
        </Alert>
      ) : (
        viewMode === 'card' ? renderCardView() : renderTableView()
      )}

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: theme.palette.background.paper,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontFamily: "'Inter', sans-serif" }}>
          {editingPayment ? 'Edit Recurring Payment' : 'Add Recurring Payment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Payment Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: "'Inter', sans-serif",
                },
              }}
            />

            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'earning' | 'expense' })}
                sx={{
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <MenuItem value="earning">Earning</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
              required
              InputProps={{ startAdornment: '$' }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: "'Inter', sans-serif",
                },
              }}
            />

            <FormControl fullWidth required>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={formData.frequency}
                label="Frequency"
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                sx={{
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>

            {formData.frequency === 'custom' && (
              <TextField
                label="Custom Interval (days)"
                type="number"
                value={formData.custom_interval_days}
                onChange={(e) => setFormData({ ...formData, custom_interval_days: e.target.value })}
                fullWidth
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontFamily: "'Inter', sans-serif",
                  },
                }}
              />
            )}

            <TextField
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: "'Inter', sans-serif",
                },
              }}
            />

            <TextField
              label="End Date (Optional)"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontFamily: "'Inter', sans-serif",
                },
              }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_variable}
                  onChange={(e) => setFormData({ ...formData, is_variable: e.target.checked })}
                />
              }
              label={<Typography sx={{ fontFamily: "'Inter', sans-serif" }}>Variable Amount</Typography>}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label={<Typography sx={{ fontFamily: "'Inter', sans-serif" }}>Active</Typography>}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name || !formData.amount}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              bgcolor: '#6D28D9',
              fontFamily: "'Inter', sans-serif",
              '&:hover': {
                bgcolor: '#5b21b6',
              },
            }}
          >
            {editingPayment ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

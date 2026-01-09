import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  LinearProgress,
  ToggleButtonGroup,
  ToggleButton,
  Pagination,
  InputAdornment,
} from '@mui/material';
import {
  Storefront as StorefrontIcon,
  LocalHospital as LocalHospitalIcon,
  MenuBook as MenuBookIcon,
  ShoppingCart as ShoppingCartIcon,
  DirectionsCar as DirectionsCarIcon,
  MedicalServices as MedicalServicesIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  FileDownload as FileDownloadIcon,
  ViewModule as ViewModuleIcon,
  ViewList as ViewListIcon,
  Event as EventIcon,
  ShoppingBag as ShoppingBagIcon,
  Flight as FlightIcon,
  Restaurant as RestaurantIcon,
  Wifi as WifiIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { listMerchants, listTransactions } from '../../lib/api/financialApi';
import { Merchant, Transaction } from '../../types/financial';
import { formatCurrency } from '../../utils/transactionHelpers';

interface MerchantWithStats extends Merchant {
  transactionCount: number;
  totalSpent: number;
  avgTransaction: number;
  lastVisit: string | null;
  category?: string;
  sparklineData?: number[];
}

type SortOption = 'total-spent' | 'frequency' | 'alphabetical';
type ViewMode = 'card' | 'table';

const getMerchantIcon = (merchantName: string, category?: string): { icon: any; color: string } => {
  const lowerName = merchantName.toLowerCase();
  const lowerCategory = category?.toLowerCase() || '';
  
  if (lowerName.includes('hospital') || lowerCategory.includes('health')) {
    return { icon: <LocalHospitalIcon />, color: '#EF4444' };
  }
  if (lowerName.includes('book') || lowerName.includes('sarasavi')) {
    return { icon: <MenuBookIcon />, color: '#F97316' };
  }
  if (lowerName.includes('arpico') || lowerName.includes('supermarket')) {
    return { icon: <ShoppingCartIcon />, color: '#3B82F6' };
  }
  if (lowerName.includes('uber') || lowerCategory.includes('transport')) {
    return { icon: <DirectionsCarIcon />, color: '#6B7280' };
  }
  if (lowerName.includes('dialog') || lowerCategory.includes('utility')) {
    return { icon: <WifiIcon />, color: '#F97316' };
  }
  if (lowerCategory.includes('health')) {
    return { icon: <MedicalServicesIcon />, color: '#10B981' };
  }
  return { icon: <StorefrontIcon />, color: '#6366F1' };
};

const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('shopping')) return <ShoppingBagIcon />;
  if (lower.includes('health')) return <MedicalServicesIcon />;
  if (lower.includes('travel')) return <FlightIcon />;
  if (lower.includes('dining')) return <RestaurantIcon />;
  return <StorefrontIcon />;
};

const generateSparklineData = (): number[] => {
  // Generate random sparkline data
  return Array.from({ length: 6 }, () => Math.random() * 30 + 5);
};

export default function MerchantsSection() {
  const { theme } = useTheme();
  const [merchants, setMerchants] = useState<MerchantWithStats[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('total-spent');
  const [page, setPage] = useState(1);
  const itemsPerPage = viewMode === 'card' ? 6 : 5;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [merchantsRes, transactionsRes] = await Promise.all([
        listMerchants(),
        listTransactions({ limit: 1000 }),
      ]);

      if (merchantsRes.success && transactionsRes.success) {
        const merchantsList = merchantsRes.merchants;
        const transactionsList = transactionsRes.transactions || [];

        // Calculate stats for each merchant
        const merchantStats = new Map<string, {
          transactionCount: number;
          totalSpent: number;
          lastVisit: string | null;
          transactions: Transaction[];
        }>();

        transactionsList.forEach((tx) => {
          const merchantId = tx.merchant_id || '';
          if (!merchantStats.has(merchantId)) {
            merchantStats.set(merchantId, {
              transactionCount: 0,
              totalSpent: 0,
              lastVisit: null,
              transactions: [],
            });
          }

          const stats = merchantStats.get(merchantId)!;
          stats.transactionCount++;
          stats.totalSpent += tx.amount;
          stats.transactions.push(tx);

          if (!stats.lastVisit || tx.date > stats.lastVisit) {
            stats.lastVisit = tx.date;
          }
        });

        const merchantsWithStats: MerchantWithStats[] = merchantsList.map((merchant) => {
          const stats = merchantStats.get(merchant._id) || {
            transactionCount: 0,
            totalSpent: 0,
            lastVisit: null,
            transactions: [],
          };

          return {
            ...merchant,
            transactionCount: stats.transactionCount,
            totalSpent: stats.totalSpent,
            avgTransaction: stats.transactionCount > 0 ? stats.totalSpent / stats.transactionCount : 0,
            lastVisit: stats.lastVisit,
            category: merchant.merchant_category,
            sparklineData: generateSparklineData(),
          };
        });

        setMerchants(merchantsWithStats);
        setTransactions(transactionsList);
      }
    } catch (error) {
      console.error('Failed to load merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedMerchants = useMemo(() => {
    let filtered = merchants.filter((merchant) =>
      merchant.merchant_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort
    switch (sortOption) {
      case 'total-spent':
        filtered.sort((a, b) => b.totalSpent - a.totalSpent);
        break;
      case 'frequency':
        filtered.sort((a, b) => b.transactionCount - a.transactionCount);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.merchant_name.localeCompare(b.merchant_name));
        break;
    }

    return filtered;
  }, [merchants, searchQuery, sortOption]);

  const paginatedMerchants = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return filteredAndSortedMerchants.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedMerchants, page, itemsPerPage]);

  const totalPages = Math.ceil(filteredAndSortedMerchants.length / itemsPerPage);

  // Category summary for table view
  const categorySummary = useMemo(() => {
    const categories = new Map<string, number>();
    merchants.forEach((merchant) => {
      const category = merchant.category || 'Other';
      categories.set(category, (categories.get(category) || 0) + 1);
    });
    return Array.from(categories.entries()).map(([name, count]) => ({ name, count }));
  }, [merchants]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getMaxSpent = () => {
    return merchants.length > 0 ? Math.max(...merchants.map((m) => m.totalSpent)) : 1;
  };

  const renderCardView = () => (
    <Grid container spacing={3}>
      {paginatedMerchants.map((merchant) => {
        const { icon, color } = getMerchantIcon(merchant.merchant_name, merchant.category);
        const maxSpent = getMaxSpent();
        const percentage = (merchant.totalSpent / maxSpent) * 100;

        return (
          <Grid item xs={12} md={6} lg={4} key={merchant._id}>
            <Card
              className="group"
              sx={{
                borderRadius: '12px',
                border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
                bgcolor: theme.palette.background.paper,
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      bgcolor: theme.palette.mode === 'dark' ? `${color}20` : `${color}10`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: color,
                    }}
                  >
                    {icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontSize: '20px',
                        fontWeight: 700,
                        color: theme.palette.text.primary,
                        mb: 0.5,
                        fontFamily: "'Inter', sans-serif",
                        transition: 'color 0.2s',
                        '.group:hover &': {
                          color: '#6366F1',
                        },
                      }}
                    >
                      {merchant.merchant_name}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        fontWeight: 500,
                        color: theme.palette.text.secondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {merchant.category || 'Uncategorized'}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: theme.palette.text.secondary,
                        mb: 0.5,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Total Spent
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '24px',
                        fontWeight: 700,
                        color: '#6366F1',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {formatCurrency(merchant.totalSpent, 'LKR')}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sx={{ textAlign: 'right' }}>
                    <Typography
                      sx={{
                        fontSize: '12px',
                        color: theme.palette.text.secondary,
                        mb: 0.5,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Transactions
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: '20px',
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {merchant.transactionCount}
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, color: theme.palette.text.secondary }}>
                  <EventIcon sx={{ fontSize: '16px' }} />
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 500,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Last visit: {formatDate(merchant.lastVisit)}
                  </Typography>
                </Box>

                <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Typography
                    sx={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: theme.palette.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      mb: 1.5,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    6-Month Spending Trend
                  </Typography>
                  <Box sx={{ height: 30, width: '100%' }}>
                    <svg width="100%" height="30" viewBox="0 0 100 30" style={{ overflow: 'visible' }}>
                      <path
                        d={`M0,${25 - merchant.sparklineData![0] * 0.6} C10,${25 - merchant.sparklineData![1] * 0.6} 20,${25 - merchant.sparklineData![2] * 0.6} 30,${25 - merchant.sparklineData![3] * 0.6} C40,${25 - merchant.sparklineData![4] * 0.6} 50,${25 - merchant.sparklineData![5] * 0.6} 60,${25 - merchant.sparklineData![0] * 0.6} C70,${25 - merchant.sparklineData![1] * 0.6} 80,${25 - merchant.sparklineData![2] * 0.6} 100,${25 - merchant.sparklineData![3] * 0.6}`}
                        fill="none"
                        stroke="#6366F1"
                        strokeWidth="2"
                      />
                    </svg>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );

  const renderTableView = () => {
    const maxSpent = getMaxSpent();

    return (
      <Box>
        {/* Category Summary Cards */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {categorySummary.slice(0, 4).map((cat) => (
            <Grid item xs={6} md={3} key={cat.name}>
              <Card
                sx={{
                  borderRadius: '12px',
                  border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
                  bgcolor: theme.palette.background.paper,
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F1F5F9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.palette.text.secondary,
                  }}
                >
                  {getCategoryIcon(cat.name)}
                </Box>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: theme.palette.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {cat.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: '18px',
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {cat.count} Merchants
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Table */}
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
                  Merchant
                </TableCell>
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
                  Transactions
                </TableCell>
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
                  Total Spent
                </TableCell>
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
                  Avg. Transaction
                </TableCell>
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
                  Last Visit
                </TableCell>
                <TableCell sx={{ py: 2, px: 3 }}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedMerchants.map((merchant) => {
                const { icon, color } = getMerchantIcon(merchant.merchant_name, merchant.category);
                const percentage = (merchant.totalSpent / maxSpent) * 100;

                return (
                  <TableRow
                    key={merchant._id}
                    className="merchant-row"
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
                            borderRadius: '8px',
                            bgcolor: theme.palette.mode === 'dark' ? `${color}20` : `${color}10`,
                            color: color,
                          }}
                        >
                          {icon}
                        </Avatar>
                        <Box>
                          <Typography
                            sx={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: theme.palette.text.primary,
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            {merchant.merchant_name}
                          </Typography>
                          <Chip
                            label={merchant.category || 'Uncategorized'}
                            size="small"
                            sx={{
                              height: '20px',
                              fontSize: '10px',
                              fontWeight: 500,
                              mt: 0.5,
                              bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F1F5F9',
                              color: theme.palette.text.secondary,
                              fontFamily: "'Inter', sans-serif",
                            }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2.5, px: 3 }}>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: theme.palette.text.secondary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {merchant.transactionCount.toString().padStart(2, '0')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5, px: 3 }}>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#6366F1',
                            mb: 1,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {formatCurrency(merchant.totalSpent, 'LKR')}
                        </Typography>
                        <Box sx={{ width: 128, height: 6 }}>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            sx={{
                              height: 6,
                              borderRadius: '9999px',
                              bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F1F5F9',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: '#6366F1',
                                borderRadius: '9999px',
                              },
                            }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ py: 2.5, px: 3 }}>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: theme.palette.text.secondary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {formatCurrency(merchant.avgTransaction, 'LKR')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5, px: 3 }}>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          color: theme.palette.text.secondary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {formatDate(merchant.lastVisit)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2.5, px: 3, textAlign: 'right' }}>
                      <Button
                        className="view-details-btn"
                        variant="contained"
                        endIcon={<ChevronRightIcon />}
                        sx={{
                          opacity: 0,
                          transform: 'translateX(-10px)',
                          transition: 'all 0.2s',
                          bgcolor: theme.palette.mode === 'dark' ? '#FFFFFF' : '#111827',
                          color: theme.palette.mode === 'dark' ? '#111827' : '#FFFFFF',
                          fontSize: '14px',
                          fontWeight: 600,
                          px: 2,
                          py: 0.75,
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontFamily: "'Inter', sans-serif",
                          '&:hover': {
                            bgcolor: theme.palette.mode === 'dark' ? '#F3F4F6' : '#374151',
                          },
                          '.merchant-row:hover &': {
                            opacity: 1,
                            transform: 'translateX(0)',
                          },
                        }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Box
            sx={{
              px: 3,
              py: 2,
              bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F8FAFC',
              borderTop: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Typography
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                color: theme.palette.text.secondary,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredAndSortedMerchants.length)} of{' '}
              {filteredAndSortedMerchants.length} merchants
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                sx={{
                  p: 1,
                  border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
                  bgcolor: theme.palette.background.paper,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                <ChevronRightIcon sx={{ transform: 'rotate(180deg)' }} />
              </IconButton>
              {[1, 2, 3].map((num) => (
                <Button
                  key={num}
                  onClick={() => setPage(num)}
                  sx={{
                    minWidth: 40,
                    height: 40,
                    borderRadius: '8px',
                    bgcolor: page === num ? '#6366F1' : 'transparent',
                    color: page === num ? '#FFFFFF' : theme.palette.text.secondary,
                    fontWeight: page === num ? 700 : 500,
                    fontFamily: "'Inter', sans-serif",
                    '&:hover': {
                      bgcolor: page === num ? '#6366F1' : theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                    },
                  }}
                >
                  {num}
                </Button>
              ))}
              <IconButton
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                sx={{
                  p: 1,
                  border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
                  bgcolor: theme.palette.background.paper,
                  color: theme.palette.text.secondary,
                  '&:hover': {
                    bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                  },
                  '&.Mui-disabled': {
                    opacity: 0.5,
                  },
                }}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          </Box>
        </TableContainer>
      </Box>
    );
  };

  return (
    <Box sx={{ maxWidth: '1280px', margin: '0 auto', px: { xs: 2, sm: 3, md: 4 }, py: 2.5 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            gap: 3,
            mb: 3,
          }}
        >
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
              {viewMode === 'card' ? 'Merchants' : 'Merchant Directory'}
            </Typography>
            <Typography
              sx={{
                fontSize: '14px',
                color: theme.palette.text.secondary,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {viewMode === 'card'
                ? "View all merchants you've transacted with. Click on a merchant to see detailed history."
                : `Manage and analyze your spending across ${merchants.length} merchants.`}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
            {viewMode === 'table' && (
              <>
                <Button
                  startIcon={<FilterListIcon />}
                  sx={{
                    border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
                    bgcolor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 2,
                    fontFamily: "'Inter', sans-serif",
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                    },
                  }}
                >
                  Filters
                </Button>
                <Button
                  variant="contained"
                  startIcon={<FileDownloadIcon />}
                  sx={{
                    bgcolor: '#6366F1',
                    color: '#FFFFFF',
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 2,
                    fontFamily: "'Inter', sans-serif",
                    '&:hover': {
                      bgcolor: '#4F46E5',
                    },
                  }}
                >
                  Export
                </Button>
              </>
            )}
            {viewMode === 'card' && (
              <>
                <TextField
                  placeholder="Search merchants..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: theme.palette.text.secondary }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    minWidth: 300,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: theme.palette.background.paper,
                      borderRadius: '8px',
                      fontFamily: "'Inter', sans-serif",
                    },
                  }}
                />
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    bgcolor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
                    borderRadius: '8px',
                    p: 0.5,
                  }}
                >
                  {(['total-spent', 'frequency', 'alphabetical'] as SortOption[]).map((option) => (
                    <Button
                      key={option}
                      onClick={() => {
                        setSortOption(option);
                        setPage(1);
                      }}
                      sx={{
                        px: 2,
                        py: 0.75,
                        fontSize: '14px',
                        fontWeight: sortOption === option ? 600 : 500,
                        bgcolor: sortOption === option ? '#6366F1' : 'transparent',
                        color: sortOption === option ? '#FFFFFF' : theme.palette.text.secondary,
                        textTransform: 'none',
                        borderRadius: '6px',
                        fontFamily: "'Inter', sans-serif",
                        '&:hover': {
                          bgcolor: sortOption === option ? '#6366F1' : theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                        },
                      }}
                    >
                      {option === 'total-spent' ? 'Total Spent' : option === 'frequency' ? 'Frequency' : 'Alphabetical'}
                    </Button>
                  ))}
                </Box>
              </>
            )}
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) => {
                if (newMode !== null) {
                  setViewMode(newMode);
                  setPage(1);
                }
              }}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  border: `1px solid ${theme.palette.divider}`,
                  color: theme.palette.text.secondary,
                  '&.Mui-selected': {
                    bgcolor: '#6366F1',
                    color: '#ffffff',
                    '&:hover': {
                      bgcolor: '#4F46E5',
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
      </Box>

      {/* Content */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ color: theme.palette.text.secondary }}>Loading merchants...</Typography>
        </Box>
      ) : filteredAndSortedMerchants.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography sx={{ color: theme.palette.text.secondary }}>
            {searchQuery ? 'No merchants found matching your search.' : 'No merchants found.'}
          </Typography>
        </Box>
      ) : (
        <>
          {viewMode === 'card' ? renderCardView() : renderTableView()}

          {/* Pagination for Card View */}
          {viewMode === 'card' && totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <IconButton
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                    },
                  }}
                >
                  <ChevronRightIcon sx={{ transform: 'rotate(180deg)' }} />
                </IconButton>
                {[1, 2, 3].map((num) => (
                  <Button
                    key={num}
                    onClick={() => setPage(num)}
                    sx={{
                      minWidth: 40,
                      height: 40,
                      borderRadius: '8px',
                      bgcolor: page === num ? '#6366F1' : 'transparent',
                      color: page === num ? '#FFFFFF' : theme.palette.text.secondary,
                      fontWeight: page === num ? 700 : 500,
                      fontFamily: "'Inter', sans-serif",
                      '&:hover': {
                        bgcolor: page === num ? '#6366F1' : theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                      },
                    }}
                  >
                    {num}
                  </Button>
                ))}
                <IconButton
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    color: theme.palette.text.secondary,
                    '&:hover': {
                      bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                    },
                    '&.Mui-disabled': {
                      opacity: 0.5,
                    },
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}


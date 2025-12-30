import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import {
  Store,
  Receipt,
  Inventory,
  ArrowBack,
  FilterList,
  TrendingUp,
  TrendingDown,
  Warning,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { listMerchants, listTransactions, listItems } from '../../lib/api/financialApi';
import { Merchant, Transaction } from '../../types/financial';
import { generateDummyTransactions, DummyTransaction, DummyItem } from '../../lib/dummyData';

interface MerchantWithStats extends Merchant {
  transactionCount: number;
  totalSpent: number;
  lastTransaction?: Date;
}

type SortOrder = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
type DateFilter = 'all' | 'this-month' | 'last-month' | 'last-3-months' | 'last-6-months';

export default function EnhancedMerchantsSection() {
  const { theme } = useTheme();
  const [merchants, setMerchants] = useState<MerchantWithStats[]>([]);
  const [selectedMerchant, setSelectedMerchant] = useState<MerchantWithStats | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0: Transactions, 1: Items
  const [transactions, setTransactions] = useState<DummyTransaction[]>([]);
  const [items, setItems] = useState<DummyItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('date-desc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [transactionPage, setTransactionPage] = useState(0);
  const [transactionRowsPerPage, setTransactionRowsPerPage] = useState(10);
  const [itemPage, setItemPage] = useState(0);
  const [itemRowsPerPage, setItemRowsPerPage] = useState(10);

  useEffect(() => {
    loadMerchants();
  }, []);

  useEffect(() => {
    if (selectedMerchant) {
      loadMerchantData(selectedMerchant.merchant_name);
    }
  }, [selectedMerchant, dateFilter, sortOrder]);

  const loadMerchants = async () => {
    try {
      setLoading(true);
      
      // Use dummy data for demonstration
      const dummyTransactions = generateDummyTransactions(100);
      
      // Group by merchant and calculate stats
      const merchantMap = new Map<string, MerchantWithStats>();
      
      dummyTransactions.forEach(tx => {
        if (!merchantMap.has(tx.merchant)) {
          merchantMap.set(tx.merchant, {
            _id: tx.merchant,
            merchant_name: tx.merchant,
            aliases: [],
            transactionCount: 0,
            totalSpent: 0,
          });
        }
        
        const merchant = merchantMap.get(tx.merchant)!;
        merchant.transactionCount++;
        merchant.totalSpent += tx.amount;
        
        if (!merchant.lastTransaction || tx.date > merchant.lastTransaction) {
          merchant.lastTransaction = tx.date;
        }
      });
      
      const merchantsList = Array.from(merchantMap.values())
        .sort((a, b) => b.totalSpent - a.totalSpent);
      
      setMerchants(merchantsList);
    } catch (error) {
      console.error('Failed to load merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMerchantData = async (merchantName: string) => {
    try {
      const dummyTransactions = generateDummyTransactions(100);
      
      // Filter transactions for this merchant
      let merchantTransactions = dummyTransactions.filter(tx => tx.merchant === merchantName);
      
      // Apply date filter
      const now = new Date();
      if (dateFilter !== 'all') {
        const filterDate = new Date(now);
        switch (dateFilter) {
          case 'this-month':
            filterDate.setMonth(now.getMonth());
            filterDate.setDate(1);
            break;
          case 'last-month':
            filterDate.setMonth(now.getMonth() - 1);
            filterDate.setDate(1);
            break;
          case 'last-3-months':
            filterDate.setMonth(now.getMonth() - 3);
            break;
          case 'last-6-months':
            filterDate.setMonth(now.getMonth() - 6);
            break;
        }
        merchantTransactions = merchantTransactions.filter(tx => tx.date >= filterDate);
      }
      
      // Apply sort
      merchantTransactions.sort((a, b) => {
        switch (sortOrder) {
          case 'date-desc':
            return b.date.getTime() - a.date.getTime();
          case 'date-asc':
            return a.date.getTime() - b.date.getTime();
          case 'amount-desc':
            return b.amount - a.amount;
          case 'amount-asc':
            return a.amount - b.amount;
          default:
            return 0;
        }
      });
      
      setTransactions(merchantTransactions);
      
      // Extract all items from transactions
      const allItems: DummyItem[] = [];
      merchantTransactions.forEach(tx => {
        if (tx.items) {
          allItems.push(...tx.items);
        }
      });
      
      setItems(allItems);
    } catch (error) {
      console.error('Failed to load merchant data:', error);
    }
  };

  const handleMerchantClick = (merchant: MerchantWithStats) => {
    setSelectedMerchant(merchant);
    setActiveTab(0);
    setTransactionPage(0);
    setItemPage(0);
  };

  const handleBackToList = () => {
    setSelectedMerchant(null);
    setSearchQuery('');
    setDateFilter('all');
    setSortOrder('date-desc');
  };

  const filteredTransactions = transactions.filter(tx =>
    searchQuery === '' || 
    tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.amount.toString().includes(searchQuery)
  );

  const filteredItems = items.filter(item =>
    searchQuery === '' ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paginatedTransactions = filteredTransactions.slice(
    transactionPage * transactionRowsPerPage,
    transactionPage * transactionRowsPerPage + transactionRowsPerPage
  );

  const paginatedItems = filteredItems.slice(
    itemPage * itemRowsPerPage,
    itemPage * itemRowsPerPage + itemRowsPerPage
  );

  const isItemExpired = (item: DummyItem) => {
    if (!item.expiryDate) return false;
    return new Date(item.expiryDate) < new Date();
  };

  const isItemExpiringSoon = (item: DummyItem) => {
    if (!item.expiryDate) return false;
    const daysUntilExpiry = Math.floor((new Date(item.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography>Loading merchants...</Typography>
      </Box>
    );
  }

  if (selectedMerchant) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '12px',
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <IconButton onClick={handleBackToList}>
              <ArrowBack />
            </IconButton>
            <Store sx={{ fontSize: 40, color: theme.palette.primary.main }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                {selectedMerchant.merchant_name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Chip
                  label={`${selectedMerchant.transactionCount} transactions`}
                  size="small"
                  icon={<Receipt />}
                />
                <Chip
                  label={`Rs. ${selectedMerchant.totalSpent.toLocaleString()}`}
                  size="small"
                  color="primary"
                />
                {selectedMerchant.lastTransaction && (
                  <Chip
                    label={`Last: ${selectedMerchant.lastTransaction.toLocaleDateString()}`}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateFilter}
                label="Date Range"
                onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="this-month">This Month</MenuItem>
                <MenuItem value="last-month">Last Month</MenuItem>
                <MenuItem value="last-3-months">Last 3 Months</MenuItem>
                <MenuItem value="last-6-months">Last 6 Months</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortOrder}
                label="Sort By"
                onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              >
                <MenuItem value="date-desc">Date (Newest)</MenuItem>
                <MenuItem value="date-asc">Date (Oldest)</MenuItem>
                <MenuItem value="amount-desc">Amount (High to Low)</MenuItem>
                <MenuItem value="amount-asc">Amount (Low to High)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            sx={{
              borderBottom: `1px solid ${theme.palette.divider}`,
              mb: 3,
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Receipt />
                  <span>Transactions ({filteredTransactions.length})</span>
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Inventory />
                  <span>Items ({filteredItems.length})</span>
                </Box>
              }
            />
          </Tabs>

          {/* Transactions Tab */}
          {activeTab === 0 && (
            <Box>
              {filteredTransactions.length === 0 ? (
                <Alert severity="info">No transactions found for the selected filters.</Alert>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell align="center">Items</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedTransactions.map((tx) => (
                          <TableRow key={tx.id} hover>
                            <TableCell>{tx.date.toLocaleDateString()}</TableCell>
                            <TableCell>{tx.category}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              Rs. {tx.amount.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={tx.type}
                                size="small"
                                color={tx.type === 'earning' ? 'success' : 'warning'}
                                icon={tx.type === 'earning' ? <TrendingUp /> : <TrendingDown />}
                              />
                            </TableCell>
                            <TableCell align="center">
                              {tx.items ? (
                                <Chip label={tx.items.length} size="small" />
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={filteredTransactions.length}
                    page={transactionPage}
                    onPageChange={(_, newPage) => setTransactionPage(newPage)}
                    rowsPerPage={transactionRowsPerPage}
                    onRowsPerPageChange={(e) => {
                      setTransactionRowsPerPage(parseInt(e.target.value, 10));
                      setTransactionPage(0);
                    }}
                  />
                </>
              )}
            </Box>
          )}

          {/* Items Tab */}
          {activeTab === 1 && (
            <Box>
              {filteredItems.length === 0 ? (
                <Alert severity="info">No items found for the selected filters.</Alert>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Item Name</TableCell>
                          <TableCell>Category</TableCell>
                          <TableCell align="right">Quantity</TableCell>
                          <TableCell align="right">Unit Price</TableCell>
                          <TableCell align="right">Total</TableCell>
                          <TableCell>Purchase Date</TableCell>
                          <TableCell>Expiry</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedItems.map((item) => (
                          <TableRow 
                            key={item.id} 
                            hover
                            sx={{
                              bgcolor: isItemExpired(item) 
                                ? 'rgba(244, 67, 54, 0.1)' 
                                : isItemExpiringSoon(item)
                                ? 'rgba(255, 152, 0, 0.1)'
                                : 'inherit',
                            }}
                          >
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {item.name}
                                {isItemExpired(item) && (
                                  <Chip
                                    label="Expired"
                                    size="small"
                                    color="error"
                                    icon={<Warning />}
                                  />
                                )}
                                {isItemExpiringSoon(item) && (
                                  <Chip
                                    label="Expiring Soon"
                                    size="small"
                                    color="warning"
                                    icon={<Warning />}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>{item.category || '-'}</TableCell>
                            <TableCell align="right">{item.quantity}</TableCell>
                            <TableCell align="right">Rs. {item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              Rs. {item.totalPrice.toLocaleString()}
                            </TableCell>
                            <TableCell>{item.purchaseDate.toLocaleDateString()}</TableCell>
                            <TableCell>
                              {item.expiryDate ? (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    color: isItemExpired(item)
                                      ? theme.palette.error.main
                                      : isItemExpiringSoon(item)
                                      ? theme.palette.warning.main
                                      : theme.palette.text.primary,
                                  }}
                                >
                                  {item.expiryDate.toLocaleDateString()}
                                </Typography>
                              ) : (
                                '-'
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={filteredItems.length}
                    page={itemPage}
                    onPageChange={(_, newPage) => setItemPage(newPage)}
                    rowsPerPage={itemRowsPerPage}
                    onRowsPerPageChange={(e) => {
                      setItemRowsPerPage(parseInt(e.target.value, 10));
                      setItemPage(0);
                    }}
                  />
                </>
              )}
            </Box>
          )}
        </Paper>
      </Box>
    );
  }

  // Merchants List View
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 1,
          }}
        >
          Merchants
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "'Inter', sans-serif",
            color: theme.palette.text.secondary,
            mb: 3,
          }}
        >
          View all merchants you've transacted with. Click on a merchant to see detailed transaction history and items.
        </Typography>

        <Grid container spacing={2}>
          {merchants.map((merchant) => (
            <Grid item xs={12} sm={6} md={4} key={merchant._id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
                onClick={() => handleMerchantClick(merchant)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Store sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {merchant.merchant_name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Transactions:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {merchant.transactionCount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Spent:
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        Rs. {merchant.totalSpent.toLocaleString()}
                      </Typography>
                    </Box>
                    {merchant.lastTransaction && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">
                          Last Visit:
                        </Typography>
                        <Typography variant="body2">
                          {merchant.lastTransaction.toLocaleDateString()}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}

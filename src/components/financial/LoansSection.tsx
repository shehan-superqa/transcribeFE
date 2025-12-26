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
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Loan, LoanPayment } from '../../types/financial';

// Dummy data
const dummyLoans: Loan[] = [
  {
    _id: '1',
    user_id: 'user1',
    type: 'borrowed',
    counterparty_name: 'Bank of America',
    principal_amount: 10000,
    outstanding_balance: 7500,
    currency: 'USD',
    interest_rate: 5.5,
    start_date: '2023-06-01',
    due_date: '2025-06-01',
    repayment_schedule: 'monthly',
    installment_amount: 500,
    description: 'Personal loan for home renovation',
    status: 'active',
    created_at: '2023-06-01',
    updated_at: '2024-01-28',
  },
  {
    _id: '2',
    user_id: 'user1',
    type: 'lent',
    counterparty_name: 'John Smith',
    principal_amount: 2000,
    outstanding_balance: 1200,
    currency: 'USD',
    interest_rate: 0,
    start_date: '2023-12-01',
    due_date: '2024-06-01',
    repayment_schedule: 'monthly',
    installment_amount: 200,
    description: 'Loan to friend for emergency',
    status: 'active',
    created_at: '2023-12-01',
    updated_at: '2024-01-28',
  },
  {
    _id: '3',
    user_id: 'user1',
    type: 'borrowed',
    counterparty_name: 'Credit Union',
    principal_amount: 5000,
    outstanding_balance: 0,
    currency: 'USD',
    interest_rate: 3.5,
    start_date: '2022-01-01',
    due_date: '2023-12-31',
    repayment_schedule: 'monthly',
    installment_amount: 250,
    description: 'Car loan',
    status: 'paid',
    created_at: '2022-01-01',
    updated_at: '2023-12-31',
  },
];

export default function LoansSection() {
  const [loans, setLoans] = useState<Loan[]>(dummyLoans);
  const [openLoanDialog, setOpenLoanDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  
  const [loanFormData, setLoanFormData] = useState({
    type: 'borrowed' as 'borrowed' | 'lent',
    counterparty_name: '',
    principal_amount: '',
    interest_rate: '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: '',
    repayment_schedule: 'monthly' as 'one-time' | 'weekly' | 'monthly' | 'custom',
    installment_amount: '',
    description: '',
  });

  const [paymentFormData, setPaymentFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    note: '',
  });

  const handleOpenLoanDialog = (loan?: Loan) => {
    if (loan) {
      setEditingLoan(loan);
      setLoanFormData({
        type: loan.type,
        counterparty_name: loan.counterparty_name,
        principal_amount: loan.principal_amount.toString(),
        interest_rate: loan.interest_rate?.toString() || '',
        start_date: loan.start_date.split('T')[0],
        due_date: loan.due_date?.split('T')[0] || '',
        repayment_schedule: loan.repayment_schedule || 'monthly',
        installment_amount: loan.installment_amount?.toString() || '',
        description: loan.description || '',
      });
    } else {
      setEditingLoan(null);
      setLoanFormData({
        type: 'borrowed',
        counterparty_name: '',
        principal_amount: '',
        interest_rate: '',
        start_date: new Date().toISOString().split('T')[0],
        due_date: '',
        repayment_schedule: 'monthly',
        installment_amount: '',
        description: '',
      });
    }
    setOpenLoanDialog(true);
  };

  const handleOpenPaymentDialog = (loan: Loan) => {
    setSelectedLoan(loan);
    setPaymentFormData({
      amount: loan.installment_amount?.toString() || '',
      payment_date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setOpenPaymentDialog(true);
  };

  const handleSaveLoan = () => {
    if (editingLoan) {
      setLoans(loans.map(l =>
        l._id === editingLoan._id
          ? {
              ...l,
              counterparty_name: loanFormData.counterparty_name,
              due_date: loanFormData.due_date || undefined,
              repayment_schedule: loanFormData.repayment_schedule,
              installment_amount: loanFormData.installment_amount ? parseFloat(loanFormData.installment_amount) : undefined,
              description: loanFormData.description,
              updated_at: new Date().toISOString(),
            }
          : l
      ));
    } else {
      const newLoan: Loan = {
        _id: Date.now().toString(),
        user_id: 'user1',
        type: loanFormData.type,
        counterparty_name: loanFormData.counterparty_name,
        principal_amount: parseFloat(loanFormData.principal_amount),
        outstanding_balance: parseFloat(loanFormData.principal_amount),
        currency: 'USD',
        interest_rate: loanFormData.interest_rate ? parseFloat(loanFormData.interest_rate) : undefined,
        start_date: loanFormData.start_date,
        due_date: loanFormData.due_date || undefined,
        repayment_schedule: loanFormData.repayment_schedule,
        installment_amount: loanFormData.installment_amount ? parseFloat(loanFormData.installment_amount) : undefined,
        description: loanFormData.description,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setLoans([...loans, newLoan]);
    }
    setOpenLoanDialog(false);
    setEditingLoan(null);
  };

  const handleAddPayment = () => {
    if (selectedLoan) {
      const paymentAmount = parseFloat(paymentFormData.amount);
      const newBalance = Math.max(0, selectedLoan.outstanding_balance - paymentAmount);
      
      setLoans(loans.map(l =>
        l._id === selectedLoan._id
          ? {
              ...l,
              outstanding_balance: newBalance,
              status: newBalance === 0 ? 'paid' : l.status,
              updated_at: new Date().toISOString(),
            }
          : l
      ));
    }
    setOpenPaymentDialog(false);
    setSelectedLoan(null);
  };

  const handleDeleteLoan = (id: string) => {
    setLoans(loans.filter(l => l._id !== id));
  };

  const activeLoans = loans.filter(l => l.status === 'active');
  const totalBorrowed = activeLoans.filter(l => l.type === 'borrowed').reduce((sum, l) => sum + l.outstanding_balance, 0);
  const totalLent = activeLoans.filter(l => l.type === 'lent').reduce((sum, l) => sum + l.outstanding_balance, 0);
  const overdueLoans = activeLoans.filter(l => l.due_date && new Date(l.due_date) < new Date());

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Loans
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenLoanDialog()}
          sx={{ borderRadius: '12px', textTransform: 'none' }}
        >
          Add Loan
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingDownIcon color="error" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Total Borrowed
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                ${totalBorrowed.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon color="success" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Total Lent
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                ${totalLent.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PaymentIcon color="primary" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Active Loans
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {activeLoans.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <WarningIcon color="warning" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Overdue
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {overdueLoans.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {overdueLoans.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3, borderRadius: '12px' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {overdueLoans.length} loan{overdueLoans.length !== 1 ? 's' : ''} overdue
          </Typography>
          <Typography variant="caption">
            Please review and make payments on overdue loans.
          </Typography>
        </Alert>
      )}

      {/* Loans Table */}
      <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Counterparty</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Principal</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Outstanding</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Interest</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loans.map((loan) => {
                  const isOverdue = loan.due_date && new Date(loan.due_date) < new Date() && loan.status === 'active';
                  
                  return (
                    <TableRow 
                      key={loan._id}
                      sx={{ 
                        '&:hover': { backgroundColor: 'action.hover' },
                        backgroundColor: isOverdue ? 'error.lighter' : 'transparent',
                      }}
                    >
                      <TableCell>
                        <Chip
                          label={loan.type === 'borrowed' ? 'Borrowed' : 'Lent'}
                          size="small"
                          color={loan.type === 'borrowed' ? 'error' : 'success'}
                          sx={{ borderRadius: '8px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {loan.counterparty_name}
                        </Typography>
                        {loan.description && (
                          <Typography variant="caption" color="text.secondary">
                            {loan.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          ${loan.principal_amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 700,
                            color: loan.outstanding_balance > 0 ? 'error.main' : 'success.main'
                          }}
                        >
                          ${loan.outstanding_balance.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {loan.interest_rate ? `${loan.interest_rate}%` : 'N/A'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                        {isOverdue && (
                          <Chip label="Overdue" size="small" color="warning" sx={{ borderRadius: '6px', mt: 0.5 }} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
                          size="small"
                          color={loan.status === 'paid' ? 'success' : loan.status === 'overdue' ? 'error' : 'default'}
                          sx={{ borderRadius: '8px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {loan.status === 'active' && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => handleOpenPaymentDialog(loan)}
                              title="Add Payment"
                            >
                              <PaymentIcon fontSize="small" />
                            </IconButton>
                          )}
                          <IconButton
                            size="small"
                            onClick={() => handleOpenLoanDialog(loan)}
                            title="Edit"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteLoan(loan._id)}
                            title="Delete"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Loan Dialog */}
      <Dialog open={openLoanDialog} onClose={() => setOpenLoanDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingLoan ? 'Edit Loan' : 'Add Loan'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                value={loanFormData.type}
                label="Type"
                onChange={(e) => setLoanFormData({ ...loanFormData, type: e.target.value as 'borrowed' | 'lent' })}
                disabled={!!editingLoan}
              >
                <MenuItem value="borrowed">Borrowed (I owe)</MenuItem>
                <MenuItem value="lent">Lent (They owe me)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Counterparty Name"
              value={loanFormData.counterparty_name}
              onChange={(e) => setLoanFormData({ ...loanFormData, counterparty_name: e.target.value })}
              fullWidth
              required
              placeholder="Bank name or person's name"
            />

            <TextField
              label="Principal Amount"
              type="number"
              value={loanFormData.principal_amount}
              onChange={(e) => setLoanFormData({ ...loanFormData, principal_amount: e.target.value })}
              fullWidth
              required
              disabled={!!editingLoan}
              InputProps={{ startAdornment: '$' }}
            />

            <TextField
              label="Interest Rate (%)"
              type="number"
              value={loanFormData.interest_rate}
              onChange={(e) => setLoanFormData({ ...loanFormData, interest_rate: e.target.value })}
              fullWidth
              inputProps={{ step: '0.1', min: '0' }}
            />

            <TextField
              label="Start Date"
              type="date"
              value={loanFormData.start_date}
              onChange={(e) => setLoanFormData({ ...loanFormData, start_date: e.target.value })}
              fullWidth
              required
              disabled={!!editingLoan}
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Due Date"
              type="date"
              value={loanFormData.due_date}
              onChange={(e) => setLoanFormData({ ...loanFormData, due_date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControl fullWidth>
              <InputLabel>Repayment Schedule</InputLabel>
              <Select
                value={loanFormData.repayment_schedule}
                label="Repayment Schedule"
                onChange={(e) => setLoanFormData({ ...loanFormData, repayment_schedule: e.target.value as any })}
              >
                <MenuItem value="one-time">One-time</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Installment Amount"
              type="number"
              value={loanFormData.installment_amount}
              onChange={(e) => setLoanFormData({ ...loanFormData, installment_amount: e.target.value })}
              fullWidth
              InputProps={{ startAdornment: '$' }}
            />

            <TextField
              label="Description"
              value={loanFormData.description}
              onChange={(e) => setLoanFormData({ ...loanFormData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenLoanDialog(false)} sx={{ borderRadius: '12px', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveLoan}
            variant="contained"
            disabled={!loanFormData.counterparty_name || !loanFormData.principal_amount}
            sx={{ borderRadius: '12px', textTransform: 'none' }}
          >
            {editingLoan ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          Add Payment
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {selectedLoan && (
              <Alert severity="info" sx={{ borderRadius: '12px' }}>
                <Typography variant="body2">
                  Outstanding Balance: <strong>${selectedLoan.outstanding_balance.toFixed(2)}</strong>
                </Typography>
              </Alert>
            )}

            <TextField
              label="Payment Amount"
              type="number"
              value={paymentFormData.amount}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
              fullWidth
              required
              InputProps={{ startAdornment: '$' }}
            />

            <TextField
              label="Payment Date"
              type="date"
              value={paymentFormData.payment_date}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Note"
              value={paymentFormData.note}
              onChange={(e) => setPaymentFormData({ ...paymentFormData, note: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenPaymentDialog(false)} sx={{ borderRadius: '12px', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddPayment}
            variant="contained"
            disabled={!paymentFormData.amount}
            sx={{ borderRadius: '12px', textTransform: 'none' }}
          >
            Add Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

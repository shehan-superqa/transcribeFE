import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button as MuiButton,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Store as StoreIcon,
  CalendarToday as CalendarTodayIcon,
  Image as ImageIcon,
  Psychology as PsychologyIcon,
  Close as CloseIcon,
  QrCode2 as QrCode2Icon,
} from '@mui/icons-material';
import { PendingTransaction, Category } from '../../types/financial';
import '../../css/components/financial/PendingTransactionsSection.css';

// Dummy pending transactions matching the design
const dummyPendingTransactions: PendingTransaction[] = [
  {
    _id: '1',
    user_id: 'user1',
    merchant_id: 'merchant1',
    merchant_name: 'Merchant One Solutions',
    category_id: 'cat1',
    amount: 125.50,
    currency: 'USD',
    date: '2024-01-28',
    bill_image_url: '/images/receipt1.jpg',
    ocr_text: 'RECEIPT FROM STORE ABC... INV #293849 TOTAL: $125.50 DATE: 01/28/2024 TAX: $8.50 THANK YOU FOR SHOPPING!',
    anomaly_flag: false,
    confidence_category: 0.85,
    status: 'pending',
    created_at: '2024-01-28',
    updated_at: '2024-01-28',
    needs_confirmation: true,
    transaction_type: undefined,
    editable_fields: ['amount', 'category_id', 'merchant_id', 'date'],
  },
  {
    _id: '2',
    user_id: 'user1',
    merchant_id: 'merchant2',
    merchant_name: 'Global Cloud Services',
    category_id: 'cat2',
    amount: 89.99,
    currency: 'USD',
    date: '2024-01-27',
    bill_image_url: '/images/receipt2.jpg',
    ocr_text: 'INVOICE FROM SERVICE PROVIDER... SUBSCRIPTION BILLING PERIOD JAN 2024. AMOUNT $89.99 TAX INCLUSIVE.',
    anomaly_flag: false,
    confidence_category: 0.92,
    status: 'pending',
    created_at: '2024-01-27',
    updated_at: '2024-01-27',
    needs_confirmation: true,
    transaction_type: undefined,
    editable_fields: ['amount', 'category_id', 'merchant_id', 'date'],
  },
  {
    _id: '3',
    user_id: 'user1',
    merchant_id: 'merchant3',
    merchant_name: 'Direct Transfer Ltd',
    category_id: 'cat3',
    amount: 1500.00,
    currency: 'USD',
    date: '2024-01-26',
    bill_image_url: '/images/receipt3.jpg',
    ocr_text: 'BANK XFER CONFIRMATION... REF: #555-928 TO: USER ACCOUNT AMT: 1500.00 CURRENCY: USD',
    anomaly_flag: false,
    confidence_category: 0.78,
    status: 'pending',
    created_at: '2024-01-26',
    updated_at: '2024-01-26',
    needs_confirmation: true,
    transaction_type: undefined,
    editable_fields: ['amount', 'category_id', 'merchant_id', 'date'],
  },
];

const dummyCategories: Category[] = [
  { _id: 'cat1', category_name: 'Groceries', parent_category: null },
  { _id: 'cat2', category_name: 'Utilities', parent_category: null },
  { _id: 'cat3', category_name: 'Income', parent_category: null },
  { _id: 'cat4', category_name: 'Transportation', parent_category: null },
  { _id: 'cat5', category_name: 'Entertainment', parent_category: null },
];

export default function PendingTransactionsSection() {
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>(dummyPendingTransactions);
  const [selectedTransaction, setSelectedTransaction] = useState<PendingTransaction | null>(null);
  const [openReceiptModal, setOpenReceiptModal] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [transactionTypes, setTransactionTypes] = useState<Record<string, 'earning' | 'expense' | undefined>>({});
  
  const [editData, setEditData] = useState({
    amount: '',
    category_id: '',
    merchant_id: '',
    date: '',
  });

  const handleOpenReceiptModal = (transaction: PendingTransaction) => {
    setSelectedTransaction(transaction);
    setOpenReceiptModal(true);
  };

  const handleOpenEditDialog = (transaction: PendingTransaction) => {
    setSelectedTransaction(transaction);
    setEditData({
      amount: transaction.amount.toString(),
      category_id: transaction.category_id,
      merchant_id: transaction.merchant_id,
      date: transaction.date,
    });
    setOpenEditDialog(true);
  };

  const handleClassificationChange = (transactionId: string, type: 'earning' | 'expense') => {
    setTransactionTypes({
      ...transactionTypes,
      [transactionId]: type,
    });
  };

  const handleConfirm = (transaction: PendingTransaction) => {
    const transactionType = transactionTypes[transaction._id];
    if (!transactionType) {
      alert('Please select a classification (Expense or Income) before confirming.');
      return;
    }
    
    // Remove from pending list
    setPendingTransactions(pendingTransactions.filter(t => t._id !== transaction._id));
    const updatedTypes = { ...transactionTypes };
    delete updatedTypes[transaction._id];
    setTransactionTypes(updatedTypes);
    
    console.log('Confirmed transaction:', {
      ...transaction,
      transaction_type: transactionType,
      status: 'confirmed',
    });
  };

  const handleSaveEdit = () => {
    if (selectedTransaction) {
      setPendingTransactions(pendingTransactions.map(t =>
        t._id === selectedTransaction._id
          ? {
              ...t,
              amount: parseFloat(editData.amount),
              category_id: editData.category_id,
              merchant_id: editData.merchant_id,
              date: editData.date,
              updated_at: new Date().toISOString(),
            }
          : t
      ));
    }
    setOpenEditDialog(false);
    setSelectedTransaction(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      setPendingTransactions(pendingTransactions.filter(t => t._id !== id));
      const updatedTypes = { ...transactionTypes };
      delete updatedTypes[id];
      setTransactionTypes(updatedTypes);
    }
  };

  const handleSkipAll = () => {
    if (window.confirm('Are you sure you want to skip all pending transactions?')) {
      setPendingTransactions([]);
      setTransactionTypes({});
    }
  };

  const handleVerifyAll = () => {
    const unclassified = pendingTransactions.filter(t => !transactionTypes[t._id]);
    if (unclassified.length > 0) {
      alert(`Please classify all transactions before verifying. ${unclassified.length} transaction(s) still need classification.`);
      return;
    }
    
    // Confirm all transactions
    console.log('Verifying all transactions:', pendingTransactions.map(t => ({
      ...t,
      transaction_type: transactionTypes[t._id],
    })));
    
    setPendingTransactions([]);
    setTransactionTypes({});
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return 'HIGH CONFIDENCE';
    if (confidence >= 0.8) return `${Math.round(confidence * 100)}% CONFIDENCE`;
    return 'LOW CONFIDENCE';
  };

  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 0.9) return 'pending-confidence-high';
    if (confidence >= 0.8) return 'pending-confidence-medium';
    return 'pending-confidence-low';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getMerchantName = (transaction: PendingTransaction) => {
    return transaction.merchant_name || transaction.merchant_id || 'Unknown Merchant';
  };

  return (
    <div className="pending-transactions-container">
      {/* Header */}
      <header className="pending-transactions-header">
        <h1 className="pending-transactions-title">Pending Transactions</h1>
        <p className="pending-transactions-subtitle">
          Review and verify scanned receipt data before finalizing your records.
        </p>
      </header>

      {pendingTransactions.length === 0 ? (
        <div className="pending-empty-state">
          <CheckCircleIcon className="pending-empty-icon" />
          <div className="pending-empty-content">
            <h3>All caught up!</h3>
            <p>You have no pending transactions to review.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Alert Banner */}
          <div className="pending-alert-banner">
            <div className="pending-alert-icon">
              <WarningIcon />
            </div>
            <div className="pending-alert-content">
              <h3>
                {pendingTransactions.length} Transaction{pendingTransactions.length !== 1 ? 's' : ''} Need Your Attention
              </h3>
              <p>
                Please verify the merchant details and classify these items as either income or expense.
              </p>
            </div>
          </div>

          {/* Transactions List */}
          <div className="pending-transactions-list">
            {pendingTransactions.map((transaction) => {
              const confidence = transaction.confidence_category;
              const confidenceLabel = getConfidenceLabel(confidence);
              const confidenceClass = getConfidenceClass(confidence);
              const matchPercentage = Math.round(confidence * 100);
              const selectedType = transactionTypes[transaction._id];
              const isLowConfidence = confidence < 0.8;

              return (
                <div key={transaction._id} className="pending-transaction-card">
                  <div className="pending-transaction-content">
                    {/* Left Section - Transaction Details */}
                    <div className="pending-transaction-details">
                      <div className="pending-transaction-header">
                        <div>
                          <div className="pending-transaction-amount-group">
                            <span className="pending-transaction-amount">
                              {formatCurrency(transaction.amount, transaction.currency)}
                            </span>
                            <span className={`pending-confidence-badge ${confidenceClass}`}>
                              {confidenceLabel}
                            </span>
                          </div>
                          <div className="pending-transaction-meta">
                            <StoreIcon className="pending-transaction-meta-icon" />
                            <span className="pending-transaction-merchant">
                              {getMerchantName(transaction)}
                            </span>
                            <span className="pending-transaction-meta-separator">•</span>
                            <CalendarTodayIcon className="pending-transaction-meta-icon" />
                            <span>{formatDate(transaction.date)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenReceiptModal(transaction)}
                          className="pending-view-receipt-btn"
                        >
                          <ImageIcon className="pending-view-receipt-btn-icon" />
                          View Original Receipt
                        </button>
                      </div>

                      {/* Classification Section */}
                      <div className="pending-classification-section">
                        <span className="pending-classification-label">
                          Classification Needed
                        </span>
                        <div className="pending-classification-buttons">
                          <button
                            onClick={() => handleClassificationChange(transaction._id, 'expense')}
                            className={`pending-classification-btn ${selectedType === 'expense' ? 'active' : ''}`}
                          >
                            <TrendingDownIcon className="pending-classification-btn-icon expense" />
                            Expense
                          </button>
                          <button
                            onClick={() => handleClassificationChange(transaction._id, 'earning')}
                            className={`pending-classification-btn ${selectedType === 'earning' ? 'active' : ''}`}
                          >
                            <TrendingUpIcon className="pending-classification-btn-icon income" />
                            Income
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - OCR Scanned Text */}
                    <div className="pending-ocr-section">
                      <div>
                        <div className="pending-ocr-header">
                          <span className="pending-ocr-label">
                            OCR Scanned Text
                          </span>
                          <div className={`pending-ocr-match ${isLowConfidence ? 'low' : ''}`}>
                            <PsychologyIcon className="pending-ocr-match-icon" />
                            {matchPercentage}% Match
                          </div>
                        </div>
                        <div className="pending-ocr-text">
                          {transaction.ocr_text || 'No OCR text available'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pending-action-buttons">
                    <button
                      onClick={() => handleConfirm(transaction)}
                      className="pending-confirm-btn"
                    >
                      <CheckCircleIcon className="pending-confirm-btn-icon" />
                      Confirm
                    </button>
                    <button
                      onClick={() => handleOpenEditDialog(transaction)}
                      className="pending-edit-btn"
                    >
                      <EditIcon className="pending-action-icon" />
                    </button>
                    <button
                      onClick={() => handleDelete(transaction._id)}
                      className="pending-delete-btn"
                    >
                      <DeleteOutlineIcon className="pending-action-icon" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="pending-footer">
            <div className="pending-footer-text">
              <span className="pending-footer-count">{pendingTransactions.length}</span> items remaining in your queue.
            </div>
            <div className="pending-footer-actions">
              <button
                onClick={handleSkipAll}
                className="pending-skip-all-btn"
              >
                Skip All
              </button>
              <button
                onClick={handleVerifyAll}
                className="pending-verify-all-btn"
              >
                Verify All Items
              </button>
            </div>
          </div>
        </>
      )}

      {/* Receipt Modal */}
      <Dialog
        open={openReceiptModal}
        onClose={() => setOpenReceiptModal(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            backgroundColor: 'var(--bg-paper)',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="pending-receipt-modal-header">
            <h3 className="pending-receipt-modal-title">
              Original Receipt: {selectedTransaction ? getMerchantName(selectedTransaction) : ''}
            </h3>
            <button
              onClick={() => setOpenReceiptModal(false)}
              className="pending-receipt-modal-close"
            >
              <CloseIcon />
            </button>
          </div>
          <div className="pending-receipt-modal-content">
            <div className="pending-receipt-preview">
              <div className="pending-receipt-merchant-name">
                <div className="pending-receipt-merchant-title">
                  {selectedTransaction ? getMerchantName(selectedTransaction).split(' ')[0] : 'Merchant'}
                </div>
                <div className="pending-receipt-merchant-address">123 Business Way, Tech City, 90210</div>
              </div>
              <div className="pending-receipt-items">
                <div className="pending-receipt-item">
                  <span>Service Item A</span>
                  <span>${selectedTransaction ? (selectedTransaction.amount * 0.36).toFixed(2) : '0.00'}</span>
                </div>
                <div className="pending-receipt-item">
                  <span>Component Bundle X</span>
                  <span>${selectedTransaction ? (selectedTransaction.amount * 0.64).toFixed(2) : '0.00'}</span>
                </div>
              </div>
              <div className="pending-receipt-total">
                <span>TOTAL</span>
                <span>{selectedTransaction ? formatCurrency(selectedTransaction.amount, selectedTransaction.currency) : '$0.00'}</span>
              </div>
              <div className="pending-receipt-qr">
                <div className="pending-receipt-qr-box">
                  <QrCode2Icon className="pending-receipt-qr-icon" />
                </div>
                <div className="pending-receipt-thanks">THANK YOU FOR YOUR BUSINESS</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
          },
        }}
      >
        <div style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Edit Transaction
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <TextField
              label="Amount"
              type="number"
              value={editData.amount}
              onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: <span style={{ marginRight: '0.5rem' }}>$</span>,
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={editData.category_id}
                label="Category"
                onChange={(e) => setEditData({ ...editData, category_id: e.target.value })}
              >
                {dummyCategories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.category_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Merchant"
              value={editData.merchant_id}
              onChange={(e) => setEditData({ ...editData, merchant_id: e.target.value })}
              fullWidth
            />

            <TextField
              label="Date"
              type="date"
              value={editData.date}
              onChange={(e) => setEditData({ ...editData, date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <MuiButton
                onClick={() => setOpenEditDialog(false)}
                sx={{ borderRadius: '12px', textTransform: 'none' }}
              >
                Cancel
              </MuiButton>
              <MuiButton
                onClick={handleSaveEdit}
                variant="contained"
                sx={{ borderRadius: '12px', textTransform: 'none', bgcolor: '#6d28d9', '&:hover': { bgcolor: '#5b21b6' } }}
              >
                Save Changes
              </MuiButton>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

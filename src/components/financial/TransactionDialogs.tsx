import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, TextField, FormControl, InputLabel, Select, MenuItem, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Transaction, Category, Merchant, TransactionItem } from '../../types/financial';

interface EditTransactionDialogProps {
  open: boolean;
  transaction: Transaction | null;
  editForm: {
    category: string;
    merchant: string;
    amount: string;
    date: Date | null;
  };
  categories: Category[];
  merchants: Merchant[];
  onClose: () => void;
  onSave: () => void;
  onFormChange: (field: string, value: any) => void;
}

export function EditTransactionDialog({
  open,
  transaction,
  editForm,
  categories,
  merchants,
  onClose,
  onSave,
  onFormChange,
}: EditTransactionDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Transaction</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={editForm.category}
              onChange={(e) => onFormChange('category', e.target.value)}
              label="Category"
            >
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.category_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Merchant</InputLabel>
            <Select
              value={editForm.merchant}
              onChange={(e) => onFormChange('merchant', e.target.value)}
              label="Merchant"
            >
              {merchants.map((merchant) => (
                <MenuItem key={merchant._id} value={merchant._id}>
                  {merchant.merchant_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Amount"
            type="number"
            value={editForm.amount}
            onChange={(e) => onFormChange('amount', e.target.value)}
            fullWidth
          />
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date"
              value={editForm.date}
              onChange={(date) => onFormChange('date', date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface DeleteTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteTransactionDialog({ open, onClose, onConfirm }: DeleteTransactionDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Transaction</DialogTitle>
      <DialogContent>
        <Typography>Are you sure you want to delete this transaction?</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface MergeTransactionDialogProps {
  open: boolean;
  transaction: Transaction | null;
  mergeWithId: string;
  transactions: Transaction[];
  onClose: () => void;
  onConfirm: () => void;
  onMergeWithChange: (id: string) => void;
}

export function MergeTransactionDialog({
  open,
  transaction,
  mergeWithId,
  transactions,
  onClose,
  onConfirm,
  onMergeWithChange,
}: MergeTransactionDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Merge Transaction</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>
          Merge transaction Rs. {transaction?.amount.toFixed(2)} with:
        </Typography>
        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>Select Transaction</InputLabel>
          <Select
            value={mergeWithId}
            onChange={(e) => onMergeWithChange(e.target.value)}
            label="Select Transaction"
          >
            {transactions
              .filter((t) => t._id !== transaction?._id)
              .map((t) => (
                <MenuItem key={t._id} value={t._id}>
                  Rs. {t.amount.toFixed(2)} - {new Date(t.date).toLocaleDateString()}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant="contained" disabled={!mergeWithId}>
          Merge
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface EditItemDialogProps {
  open: boolean;
  item: TransactionItem | null;
  editForm: {
    name: string;
    quantity: string;
    unit_price: string;
    total_price: string;
    category: string;
  };
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
  onFormChange: (field: string, value: string) => void;
}

export function EditItemDialog({
  open,
  item,
  editForm,
  categories,
  onClose,
  onSave,
  onFormChange,
}: EditItemDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Item</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Item Name"
            value={editForm.name}
            onChange={(e) => onFormChange('name', e.target.value)}
            fullWidth
            required
          />
          <TextField
            label="Quantity"
            type="number"
            value={editForm.quantity}
            onChange={(e) => onFormChange('quantity', e.target.value)}
            fullWidth
            required
            inputProps={{ step: '0.01', min: '0' }}
          />
          <TextField
            label="Unit Price"
            type="number"
            value={editForm.unit_price}
            onChange={(e) => {
              const unitPrice = parseFloat(e.target.value) || 0;
              const quantity = parseFloat(editForm.quantity) || 0;
              onFormChange('unit_price', e.target.value);
              onFormChange('total_price', (unitPrice * quantity).toFixed(2));
            }}
            fullWidth
            required
            inputProps={{ step: '0.01', min: '0' }}
          />
          <TextField
            label="Total Price"
            type="number"
            value={editForm.total_price}
            onChange={(e) => onFormChange('total_price', e.target.value)}
            fullWidth
            required
            inputProps={{ step: '0.01', min: '0' }}
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={editForm.category}
              onChange={(e) => onFormChange('category', e.target.value)}
              label="Category"
            >
              <MenuItem value="">None</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat.category_name}>
                  {cat.category_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={onSave}
          variant="contained"
          disabled={!editForm.name || !editForm.quantity || !editForm.unit_price || !editForm.total_price}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface DeleteItemDialogProps {
  open: boolean;
  item: TransactionItem | null;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteItemDialog({ open, item, onClose, onConfirm }: DeleteItemDialogProps) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Item</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete "{item?.name}"? This action cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
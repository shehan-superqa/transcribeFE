import { useState, useRef, useEffect } from 'react';
import { TableCell, TextField } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';
import { updateItem } from '../../lib/api/financialApi';
import { getMissingFieldStyle } from '../../utils/transactionHelpers';

interface EditableItemCellProps {
  value: number | string | null | undefined;
  field: 'quantity' | 'unit_price' | 'total_price';
  itemId: string | null | undefined;
  transactionId: string;
  isMissing: boolean;
  align?: 'left' | 'right' | 'center';
  formatValue?: (value: number | string) => string;
  parseValue?: (value: string) => number | null;
  onUpdate?: (itemId: string, field: string, value: number) => void;
  onError?: (error: string) => void;
  sx?: any;
}

export default function EditableItemCell({
  value,
  field,
  itemId,
  transactionId,
  isMissing,
  align = 'right',
  formatValue,
  parseValue,
  onUpdate,
  onError,
  sx = {},
}: EditableItemCellProps) {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    // Only allow editing if item has an ID (is an API item, not embedded)
    if (!itemId) return;
    
    setIsEditing(true);
    if (isMissing || value === null || value === undefined || value === 0) {
      setEditValue('');
    } else {
      // For formatted values, extract the numeric part
      if (formatValue) {
        const numStr = String(value).replace(/[^\d.-]/g, '');
        setEditValue(numStr || '');
      } else {
        setEditValue(String(value));
      }
    }
  };

  const handleBlur = async () => {
    if (!itemId) return;
    
    await saveValue();
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await saveValue();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue('');
    }
  };

  const saveValue = async () => {
    if (!itemId) return;
    
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      setIsEditing(false);
      return;
    }

    let numericValue: number;
    
    if (parseValue) {
      const parsed = parseValue(trimmedValue);
      if (parsed === null) {
        setIsEditing(false);
        return;
      }
      numericValue = parsed;
    } else {
      numericValue = parseFloat(trimmedValue);
      if (isNaN(numericValue)) {
        setIsEditing(false);
        return;
      }
    }

    // Don't update if value hasn't changed
    if (numericValue === value) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    try {
      const updateData: any = { [field]: numericValue };
      
      // If updating unit_price and we have quantity, auto-calculate total_price
      if (field === 'unit_price' && value !== null && value !== undefined) {
        // We'd need quantity here, but for now just update unit_price
        // The backend might handle this
      }
      
      // If updating quantity and we have unit_price, auto-calculate total_price
      if (field === 'quantity' && value !== null && value !== undefined) {
        // Similar logic
      }

      const response = await updateItem(itemId, updateData);
      
      if (response.success) {
        setIsEditing(false);
        onUpdate?.(itemId, field, numericValue);
      } else {
        throw new Error('Update failed');
      }
    } catch (error: any) {
      onError?.(error.message || 'Failed to update value');
      setIsEditing(false);
    } finally {
      setIsUpdating(false);
    }
  };

  // Determine if value should be considered missing
  const isValueMissing = value === null || value === undefined || value === 0;
  
  const displayValue = isValueMissing
    ? 'N/A'
    : formatValue 
      ? formatValue(value)
      : String(value);

  const cellSx = {
    color: theme.palette.text.primary,
    cursor: itemId ? 'pointer' : 'default',
    position: 'relative',
    ...getMissingFieldStyle(isMissing, theme),
    ...sx,
    '&:hover': itemId ? {
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.02)',
    } : {},
  };

  if (isEditing && itemId) {
    return (
      <TableCell align={align} sx={cellSx}>
        <TextField
          inputRef={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          size="small"
          type="number"
          disabled={isUpdating}
          sx={{
            width: '100%',
            '& .MuiInputBase-input': {
              padding: '4px 8px',
              fontSize: '0.875rem',
              textAlign: align,
            },
          }}
          autoFocus
        />
      </TableCell>
    );
  }

  return (
    <TableCell 
      align={align} 
      sx={cellSx}
      onClick={handleClick}
      title={itemId ? 'Click to edit' : undefined}
    >
      {displayValue}
    </TableCell>
  );
}


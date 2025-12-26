import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import { listItems } from '../../lib/api/financialApi';
import ItemsTable from './ItemsTable';

// Define the interface that matches ItemsTable's expected props
interface TableItem {
  id: string;
  transactionId: string;
  transactionDate: Date;
  transactionAmount: number;
  transactionStatus: string;
  merchantName: string;
  categoryName: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemCategory?: string;
}

export default function ItemsSection() {
  const [items, setItems] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'itemName' | 'transactionId' | 'merchant' | 'category' | 'quantity' | 'unitPrice' | 'totalPrice' | 'transactionDate'>('transactionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch items from the API
      const response = await listItems({
        limit: 50,
        date_from: '2025-01-01T00:00:00Z',
        date_to: '2025-12-31T23:59:59Z'
      });
      
      if (response.success && response.items) {
        // Transform the API response to match the ItemsTable interface
        const transformedItems = response.items.map(item => ({
          id: item._id,
          transactionId: item.transaction_id || 'N/A',
          transactionDate: new Date(item.created_at || Date.now()),
          transactionAmount: 0, // Default value
          transactionStatus: 'confirmed', // Default status
          merchantName: 'N/A', // Placeholder for merchant name
          categoryName: item.category || 'Uncategorized',
          itemName: item.name || 'Unnamed Item',
          quantity: item.quantity || 0,
          unitPrice: item.unit_price || 0,
          totalPrice: item.total_price || 0,
          itemCategory: item.category
        }));
        
        setItems(transformedItems);
      } else {
        setError('Failed to fetch items');
      }
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSort = (field: 'itemName' | 'transactionId' | 'merchant' | 'category' | 'quantity' | 'unitPrice' | 'totalPrice' | 'transactionDate') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Sort items based on current sort criteria
  const sortedItems = [...items].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'itemName':
        comparison = a.itemName.localeCompare(b.itemName);
        break;
      case 'transactionId':
        comparison = a.transactionId.localeCompare(b.transactionId);
        break;
      case 'merchant':
        comparison = a.merchantName.localeCompare(b.merchantName);
        break;
      case 'category':
        comparison = a.categoryName.localeCompare(b.categoryName);
        break;
      case 'quantity':
        comparison = a.quantity - b.quantity;
        break;
      case 'unitPrice':
        comparison = a.unitPrice - b.unitPrice;
        break;
      case 'totalPrice':
        comparison = a.totalPrice - b.totalPrice;
        break;
      case 'transactionDate':
        comparison = a.transactionDate.getTime() - b.transactionDate.getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', padding: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ padding: 4 }}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
        Transaction Items
      </Typography>
      
      <ItemsTable
        items={sortedItems}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
      />
    </Box>
  );
}
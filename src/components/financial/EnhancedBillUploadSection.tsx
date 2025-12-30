import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  TextField, 
  LinearProgress, 
  Alert, 
  Chip,
  ButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { 
  CloudUpload, 
  CameraAlt, 
  CheckCircle, 
  ContentPaste,
  Delete,
  Edit,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { uploadBill, uploadBillsBulk, getBillStatus, getBulkUploadStatus } from '../../lib/api/financialApi';
import { Transaction } from '../../types/financial';
import CameraCapture from './CameraCapture';
import { useFinancialJobProgress } from '../../hooks/useFinancialJobProgress';
import ManualTransactionDialog from './ManualTransactionDialog';

interface BillUploadSectionProps {
  onTransactionCreated?: (transaction: Transaction) => void;
  categories?: any[];
}

interface UploadItem {
  id: string;
  file: File;
  type: 'earning' | 'expense';
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  jobId?: string;
  batchJobId?: string;
  streamUrl?: string;
  transaction?: Transaction;
  error?: string;
  message?: string;
}

export default function EnhancedBillUploadSection({ onTransactionCreated, categories }: BillUploadSectionProps) {
  const { theme } = useTheme();
  const [uploadType, setUploadType] = useState<'earning' | 'expense'>('expense');
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
  const [showCamera, setShowCamera] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [categoryOverride, setCategoryOverride] = useState('');
  const [merchantOverride, setMerchantOverride] = useState('');
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAddToQueue = useCallback((files: File[], type: 'earning' | 'expense') => {
    const newItems: UploadItem[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      type,
      status: 'pending',
      progress: 0,
    }));
    setUploadQueue(prev => [...prev, ...newItems]);
  }, []);

  const handleRemoveFromQueue = useCallback((id: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleUploadSingle = useCallback(async (file: File, type: 'earning' | 'expense') => {
    const itemId = `${Date.now()}-${Math.random()}`;
    const newItem: UploadItem = {
      id: itemId,
      file,
      type,
      status: 'uploading',
      progress: 0,
    };
    
    setUploadQueue([newItem]);
    setIsProcessing(true);

    try {
      const result = await uploadBill(file, {
        transaction_type: type,
        category_override: categoryOverride || undefined,
        merchant_override: merchantOverride || undefined,
      });

      if (result.success && result.job_id) {
        setUploadQueue(prev => prev.map(item => 
          item.id === itemId 
            ? { ...item, jobId: result.job_id, streamUrl: result.stream_url, status: 'analyzing' }
            : item
        ));
      } else {
        throw new Error('Failed to upload bill');
      }
    } catch (err: any) {
      setUploadQueue(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, status: 'error', error: err.message || 'Failed to upload bill' }
          : item
      ));
      setIsProcessing(false);
    }
  }, [categoryOverride, merchantOverride]);

  const pollBulkUploadStatus = useCallback(async (batchJobId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await getBulkUploadStatus(batchJobId);
        
        if (status.success) {
          // Update individual items based on results
          setUploadQueue(prev => prev.map(item => {
            const result = status.results.find(r => r.job_id === item.jobId);
            if (result) {
              if (result.status === 'completed' && result.transaction) {
                onTransactionCreated?.(result.transaction);
                return { ...item, status: 'completed', transaction: result.transaction, progress: 100 };
              } else if (result.status === 'failed') {
                return { ...item, status: 'error', error: result.error || 'Processing failed' };
              } else if (result.status === 'processing') {
                return { ...item, status: 'analyzing' };
              }
            }
            return item;
          }));

          // Stop polling if all are completed or failed
          if (status.status === 'completed' || status.status === 'failed') {
            clearInterval(pollInterval);
            setIsProcessing(false);
          }
        }
      } catch (err) {
        console.error('Error polling bulk upload status:', err);
        clearInterval(pollInterval);
        setIsProcessing(false);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 5 * 60 * 1000);
  }, [onTransactionCreated]);

  const handleProcessQueue = useCallback(async () => {
    setIsProcessing(true);
    
    const pendingItems = uploadQueue.filter(i => i.status === 'pending');
    if (pendingItems.length === 0) return;

    try {
      // Update all items to uploading status
      setUploadQueue(prev => prev.map(i => 
        pendingItems.some(p => p.id === i.id) ? { ...i, status: 'uploading' } : i
      ));

      // Use bulk upload API for multiple files
      const files = pendingItems.map(item => item.file);
      const result = await uploadBillsBulk(files, {
        transaction_type: uploadType,
        category_override: categoryOverride || undefined,
        merchant_override: merchantOverride || undefined,
      });

      if (result.success && result.batch_job_id) {
        // Update all pending items with batch job ID and individual job IDs
        setUploadQueue(prev => prev.map((i, index) => {
          const pendingIndex = pendingItems.findIndex(p => p.id === i.id);
          if (pendingIndex !== -1 && result.individual_job_ids[pendingIndex]) {
            return {
              ...i,
              batchJobId: result.batch_job_id,
              jobId: result.individual_job_ids[pendingIndex],
              status: 'analyzing',
            };
          }
          return i;
        }));

        // Start polling for bulk upload status
        pollBulkUploadStatus(result.batch_job_id);
      } else {
        throw new Error('Failed to upload bills');
      }
    } catch (err: any) {
      setUploadQueue(prev => prev.map(i => 
        pendingItems.some(p => p.id === i.id)
          ? { ...i, status: 'error', error: err.message || 'Failed to upload bills' }
          : i
      ));
      setIsProcessing(false);
    }
  }, [uploadQueue, uploadType, categoryOverride, merchantOverride, pollBulkUploadStatus]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    if (uploadMode === 'single') {
      await handleUploadSingle(acceptedFiles[0], uploadType);
    } else {
      handleAddToQueue(acceptedFiles, uploadType);
    }
  }, [uploadMode, uploadType, handleUploadSingle, handleAddToQueue]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv'],
    },
    maxFiles: uploadMode === 'single' ? 1 : undefined,
    disabled: isProcessing && uploadMode === 'single',
  });

  const handleCameraCapture = (file: File) => {
    if (uploadMode === 'single') {
      handleUploadSingle(file, uploadType);
    } else {
      handleAddToQueue([file], uploadType);
    }
  };

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (isProcessing && uploadMode === 'single') return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          const file = new File([blob], `pasted-image-${Date.now()}.png`, {
            type: blob.type || 'image/png',
          });
          
          if (uploadMode === 'single') {
            await handleUploadSingle(file, uploadType);
          } else {
            handleAddToQueue([file], uploadType);
          }
        }
        break;
      }
    }
  }, [isProcessing, uploadMode, uploadType, handleUploadSingle, handleAddToQueue]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.focus();

    const handlePasteEvent = (e: ClipboardEvent) => {
      handlePaste(e);
    };

    container.addEventListener('paste', handlePasteEvent);
    window.addEventListener('paste', handlePasteEvent);

    return () => {
      container.removeEventListener('paste', handlePasteEvent);
      window.removeEventListener('paste', handlePasteEvent);
    };
  }, [handlePaste]);

  // Monitor job progress for items in queue (single upload mode)
  useEffect(() => {
    const analyzingItems = uploadQueue.filter(
      item => item.status === 'analyzing' && item.jobId && !item.batchJobId
    );
    
    if (analyzingItems.length === 0) return;

    const checkInterval = setInterval(async () => {
      for (const item of analyzingItems) {
        try {
          const result = await getBillStatus(item.jobId!);
          
          if (result.job.status === 'completed' && result.transaction) {
            setUploadQueue(prev => prev.map(i => 
              i.id === item.id 
                ? { ...i, status: 'completed', transaction: result.transaction, progress: 100 }
                : i
            ));
            onTransactionCreated?.(result.transaction);
          } else if (result.job.status === 'failed') {
            setUploadQueue(prev => prev.map(i => 
              i.id === item.id 
                ? { ...i, status: 'error', error: 'Processing failed' }
                : i
            ));
          }
        } catch (err: any) {
          console.error('Error checking job status:', err);
        }
      }

      // Check if all single upload items are completed or errored
      const allDone = uploadQueue.every(item => 
        item.status === 'completed' || item.status === 'error' || (item.batchJobId && item.status === 'analyzing')
      );
      if (allDone && uploadQueue.length > 0 && !uploadQueue.some(item => item.batchJobId)) {
        setIsProcessing(false);
        clearInterval(checkInterval);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup after 5 minutes
    const timeout = setTimeout(() => clearInterval(checkInterval), 5 * 60 * 1000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeout);
    };
  }, [uploadQueue, onTransactionCreated]);

  const reset = () => {
    setUploadQueue([]);
    setIsProcessing(false);
    setCategoryOverride('');
    setMerchantOverride('');
  };

  const completedCount = uploadQueue.filter(i => i.status === 'completed').length;
  const errorCount = uploadQueue.filter(i => i.status === 'error').length;
  const pendingCount = uploadQueue.filter(i => i.status === 'pending').length;

  return (
    <Box ref={containerRef} tabIndex={0}>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      <ManualTransactionDialog
        open={showManualDialog}
        onClose={() => setShowManualDialog(false)}
        onSave={(transaction) => {
          console.log('Manual transaction created:', transaction);
          onTransactionCreated?.(transaction as any);
          setShowManualDialog(false);
        }}
        categories={categories || []}
      />

      <Paper 
        elevation={0} 
        sx={{ 
          p: '1.5rem', 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box sx={{ mb: '2rem' }}>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              fontFamily: "'Inter', sans-serif",
              color: theme.palette.text.primary, 
              fontWeight: 600,
              fontSize: '1.25rem',
              lineHeight: 1.2,
              mb: '0.5rem',
            }}
          >
            Upload Bills & Receipts
          </Typography>
          <Typography 
            variant="body1" 
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 400,
              lineHeight: 1.5,
              color: theme.palette.text.secondary,
              mb: '0.5rem',
            }}
          >
            Upload bills, receipts, or documents for automatic processing. Select whether it's an expense or earning first.
          </Typography>
        </Box>

        {/* Transaction Type Selection */}
        <Box sx={{ mb: '2rem' }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              mb: 1,
              color: theme.palette.text.primary,
            }}
          >
            Transaction Type
          </Typography>
          <ButtonGroup fullWidth>
            <Button
              variant={uploadType === 'expense' ? 'contained' : 'outlined'}
              onClick={() => setUploadType('expense')}
              startIcon={<TrendingDown />}
              sx={{
                fontFamily: "'Inter', sans-serif",
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Expense
            </Button>
            <Button
              variant={uploadType === 'earning' ? 'contained' : 'outlined'}
              onClick={() => setUploadType('earning')}
              startIcon={<TrendingUp />}
              sx={{
                fontFamily: "'Inter', sans-serif",
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Earning
            </Button>
          </ButtonGroup>
        </Box>

        {/* Upload Mode Selection */}
        <Box sx={{ mb: '2rem' }}>
          <Typography 
            variant="subtitle2" 
            sx={{ 
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              mb: 1,
              color: theme.palette.text.primary,
            }}
          >
            Upload Mode
          </Typography>
          <ButtonGroup fullWidth>
            <Button
              variant={uploadMode === 'single' ? 'contained' : 'outlined'}
              onClick={() => setUploadMode('single')}
              sx={{
                fontFamily: "'Inter', sans-serif",
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Single Upload
            </Button>
            <Button
              variant={uploadMode === 'bulk' ? 'contained' : 'outlined'}
              onClick={() => setUploadMode('bulk')}
              sx={{
                fontFamily: "'Inter', sans-serif",
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Bulk Upload
            </Button>
          </ButtonGroup>
        </Box>

        {/* Optional Overrides */}
        <Box sx={{ display: 'flex', gap: '1rem', mb: '2rem' }}>
          <TextField
            label="Category Override (optional)"
            value={categoryOverride}
            onChange={(e) => setCategoryOverride(e.target.value)}
            size="small"
            fullWidth
            disabled={isProcessing}
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
              },
              '& .MuiInputLabel-root': {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
              },
            }}
          />
          <TextField
            label="Merchant Override (optional)"
            value={merchantOverride}
            onChange={(e) => setMerchantOverride(e.target.value)}
            size="small"
            fullWidth
            disabled={isProcessing}
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
              },
              '& .MuiInputLabel-root': {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
              },
            }}
          />
        </Box>

        {/* Upload Options */}
        <Box sx={{ display: 'flex', gap: '1rem', mb: '2rem', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<CameraAlt />}
            onClick={() => setShowCamera(true)}
            disabled={isProcessing && uploadMode === 'single'}
            sx={{ 
              fontFamily: "'Inter', sans-serif",
              flex: '1 1 auto', 
              minWidth: '120px',
              padding: '0.625rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Take Photo
          </Button>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setShowManualDialog(true)}
            disabled={isProcessing && uploadMode === 'single'}
            sx={{ 
              fontFamily: "'Inter', sans-serif",
              flex: '1 1 auto', 
              minWidth: '120px',
              padding: '0.625rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 500,
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            Manual Entry
          </Button>
          <Box
            {...getRootProps()}
            sx={{
              flex: 1,
              border: `3px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
              borderRadius: 3,
              padding: '40px 24px',
              textAlign: 'center',
              cursor: (isProcessing && uploadMode === 'single') ? 'not-allowed' : 'pointer',
              backgroundColor: isDragActive 
                ? (theme.palette.mode === 'dark' ? 'rgba(0, 198, 255, 0.15)' : '#f0f9ff')
                : theme.palette.background.default,
              transition: 'all 0.3s ease',
              position: 'relative',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 198, 255, 0.1)' : '#f0f9ff',
                transform: 'scale(1.02)',
              },
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 64, color: isDragActive ? theme.palette.primary.main : theme.palette.text.secondary, mb: 2 }} />
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                fontFamily: "'Inter', sans-serif",
                color: theme.palette.text.primary, 
                fontWeight: 600,
                fontSize: '1rem',
                lineHeight: 1.2,
                mb: '0.5rem',
              }}
            >
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 400,
                lineHeight: 1.5,
                color: theme.palette.text.secondary,
              }}
            >
              or click to browse • Supports: Images, PDF, Excel, CSV
            </Typography>
          </Box>
        </Box>

        {/* Bulk Upload Queue */}
        {uploadMode === 'bulk' && uploadQueue.length > 0 && (
          <Box sx={{ mb: '2rem' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                Upload Queue ({uploadQueue.length} items)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {pendingCount > 0 && (
                  <Button
                    variant="contained"
                    onClick={handleProcessQueue}
                    disabled={isProcessing}
                    sx={{ textTransform: 'none' }}
                  >
                    Process Queue ({pendingCount})
                  </Button>
                )}
                <Button
                  variant="outlined"
                  onClick={reset}
                  disabled={isProcessing}
                  sx={{ textTransform: 'none' }}
                >
                  Clear All
                </Button>
              </Box>
            </Box>

            {(completedCount > 0 || errorCount > 0) && (
              <Box sx={{ mb: 2 }}>
                <Alert severity="info">
                  Completed: {completedCount} | Errors: {errorCount} | Pending: {pendingCount}
                </Alert>
              </Box>
            )}

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>File Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {uploadQueue.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.file.name}</TableCell>
                      <TableCell>
                        <Chip 
                          label={item.type} 
                          size="small" 
                          color={item.type === 'earning' ? 'success' : 'warning'}
                          icon={item.type === 'earning' ? <TrendingUp /> : <TrendingDown />}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.status} 
                          size="small" 
                          color={
                            item.status === 'completed' ? 'success' :
                            item.status === 'error' ? 'error' :
                            item.status === 'analyzing' ? 'info' :
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {item.status === 'analyzing' || item.status === 'uploading' ? (
                          <LinearProgress variant="indeterminate" sx={{ width: '100%' }} />
                        ) : item.status === 'completed' ? (
                          <LinearProgress variant="determinate" value={100} color="success" />
                        ) : null}
                      </TableCell>
                      <TableCell align="right">
                        {item.status === 'pending' && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveFromQueue(item.id)}
                            disabled={isProcessing}
                          >
                            <Delete />
                          </IconButton>
                        )}
                        {item.status === 'completed' && item.transaction && (
                          <Chip 
                            label={`Rs. ${item.transaction.amount.toFixed(2)}`} 
                            size="small" 
                            color="success"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Single Upload Progress */}
        {uploadMode === 'single' && uploadQueue.length > 0 && uploadQueue[0].status !== 'completed' && (
          <Box sx={{ mb: '1.5rem', p: 2, backgroundColor: theme.palette.background.default, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Typography 
                variant="subtitle2"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                }}
              >
                Processing: {uploadQueue[0].file.name}
              </Typography>
              <Chip 
                label={uploadQueue[0].status} 
                size="small" 
                color={uploadQueue[0].status === 'error' ? 'error' : 'info'}
              />
            </Box>
            <LinearProgress 
              variant="indeterminate"
              sx={{
                height: 8,
                borderRadius: 1,
                backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#e5e7eb',
              }}
            />
          </Box>
        )}

        {/* Success Messages */}
        {uploadQueue.filter(i => i.status === 'completed').map((item) => (
          item.transaction && (
            <Alert
              key={item.id}
              severity="success"
              icon={<CheckCircle />}
              sx={{ mb: 2 }}
              onClose={() => handleRemoveFromQueue(item.id)}
            >
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                Transaction Created: {item.file.name}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <Typography variant="body2" component="div">
                  <strong>Amount:</strong> Rs. {item.transaction.amount.toFixed(2)}
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>Merchant:</strong> {item.transaction.merchant_id || 'Unknown'}
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>Category:</strong> {item.transaction.category_id || 'Unknown'}
                </Typography>
              </Box>
            </Alert>
          )
        ))}

        {/* Error Messages */}
        {uploadQueue.filter(i => i.status === 'error').map((item) => (
          <Alert
            key={item.id}
            severity="error"
            sx={{ mb: 2 }}
            onClose={() => handleRemoveFromQueue(item.id)}
          >
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
              Error: {item.file.name}
            </Typography>
            <Typography variant="body2">{item.error}</Typography>
          </Alert>
        ))}
      </Paper>
    </Box>
  );
}

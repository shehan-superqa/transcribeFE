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
  Tabs,
  Tab,
  Badge,
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
  SwapHoriz,
  PlayArrow,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { uploadBill, uploadBillsBulk, getBillStatus, getBulkUploadStatus, getActiveBills } from '../../lib/api/financialApi';
import { Transaction } from '../../types/financial';
import CameraCapture from './CameraCapture';
import { useFinancialJobProgress } from '../../hooks/useFinancialJobProgress';
import ManualTransactionDialog from './ManualTransactionDialog';
import ProgressTab from './ProgressTab';

interface BillUploadSectionProps {
  onTransactionCreated?: (transaction: Transaction) => void;
  categories?: any[];
}

interface UploadItem {
  id: string;
  file: File;
  type: 'earning' | 'expense' | 'mix';
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  jobId?: string;
  batchJobId?: string;
  streamUrl?: string;
  transaction?: Transaction;
  error?: string;
  message?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`upload-tabpanel-${index}`}
      aria-labelledby={`upload-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `upload-tab-${index}`,
    'aria-controls': `upload-tabpanel-${index}`,
  };
}

// Component to monitor upload item progress via SSE
interface UploadItemProgressMonitorProps {
  item: UploadItem;
  onUpdate: (item: UploadItem) => void;
  theme: any;
}

function UploadItemProgressMonitor({ item, onUpdate, theme }: UploadItemProgressMonitorProps) {
  const { progress, status, message, isConnected } = useFinancialJobProgress(
    item.jobId || null,
    item.streamUrl
  );

  useEffect(() => {
    if (!item.jobId) return;

    const updated: UploadItem = {
      ...item,
      progress: progress !== undefined ? progress : item.progress,
      message: message || item.message,
    };

    // Handle completion
    if (status === 'completed') {
      // Fetch final result
      getBillStatus(item.jobId).then(result => {
        if (result.job.status === 'completed' && result.transaction) {
          onUpdate({
            ...updated,
            status: 'completed',
            transaction: result.transaction,
            progress: 100,
          });
        }
      }).catch(() => {
        // Ignore errors
      });
    } else if (status === 'error' || status === 'failed') {
      onUpdate({
        ...updated,
        status: 'error',
        error: message || 'Processing failed',
      });
    } else if (status && status !== item.status && (status === 'processing' || status === 'queued')) {
      // Update status if changed to processing/queued
      onUpdate({
        ...updated,
        status: status as any,
      });
    } else if (progress !== undefined && progress !== item.progress) {
      // Update progress
      onUpdate(updated);
    }
  }, [status, progress, message, item.jobId, item.id, item.status, item.progress, onUpdate]);

  const currentProgress = progress !== undefined ? progress : item.progress;
  const currentStatus = status || item.status;

  return (
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
          Processing: {item.file.name}
          {message && (
            <Typography 
              variant="caption"
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.7rem',
                color: theme.palette.text.secondary,
                display: 'block',
                mt: 0.5,
              }}
            >
              {message}
            </Typography>
          )}
        </Typography>
        <Chip 
          label={currentStatus} 
          size="small" 
          color={currentStatus === 'error' ? 'error' : 'info'}
        />
      </Box>
      <LinearProgress 
        variant={currentProgress > 0 ? 'determinate' : 'indeterminate'}
        value={currentProgress}
        sx={{
          height: 8,
          borderRadius: 1,
          backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#e5e7eb',
        }}
      />
      {isConnected && (
        <Chip
          label="Live"
          size="small"
          color="success"
          sx={{ mt: 1, fontSize: '0.65rem', height: '20px' }}
        />
      )}
    </Box>
  );
}

export default function EnhancedBillUploadSection({ onTransactionCreated, categories }: BillUploadSectionProps) {
  const { theme } = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [uploadType, setUploadType] = useState<'earning' | 'expense' | 'mix'>('expense');
  const [uploadMode, setUploadMode] = useState<'single' | 'bulk'>('single');
  const [showCamera, setShowCamera] = useState(false);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [categoryOverride, setCategoryOverride] = useState('');
  const [merchantOverride, setMerchantOverride] = useState('');
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasActiveJobs, setHasActiveJobs] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleAddToQueue = useCallback((files: File[], type: 'earning' | 'expense' | 'mix') => {
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

  const handleUploadSingle = useCallback(async (file: File, type: 'earning' | 'expense' | 'mix') => {
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
        transaction_type: type, // Send 'expense', 'earning', or 'mix'
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
        transaction_type: uploadType, // Send 'expense', 'earning', or 'mix'
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

  // Monitor job progress via SSE for items in queue
  useEffect(() => {
    const analyzingItems = uploadQueue.filter(
      item => item.status === 'analyzing' && item.jobId && !item.batchJobId && item.streamUrl
    );
    
    if (analyzingItems.length === 0) {
      // Check if all items are done
      const allDone = uploadQueue.every(item => 
        item.status === 'completed' || item.status === 'error' || (item.batchJobId && item.status === 'analyzing')
      );
      if (allDone && uploadQueue.length > 0 && !uploadQueue.some(item => item.batchJobId)) {
        setIsProcessing(false);
      }
      return;
    }

    // Set up SSE monitoring for each analyzing item
    // Each item will be monitored via useFinancialJobProgress hook in the UI
    // We handle completion updates via the progress hook callbacks
  }, [uploadQueue]);


  // Check for active jobs once on mount and when upload queue changes
  useEffect(() => {
    const checkActiveJobs = async () => {
      try {
        const response = await getActiveBills();
        if (response.success) {
          const active = response.active_jobs.filter(
            job => job.status === 'queued' || job.status === 'processing'
          );
          setHasActiveJobs(active.length > 0);
        }
      } catch (err) {
        console.error('Error checking active jobs:', err);
      }
    };

    // Check once on mount
    checkActiveJobs();

    // Also check when upload queue changes (new uploads started)
    // No polling - rely on SSE updates for real-time status changes
  }, []);

  // Update hasActiveJobs based on upload queue status
  useEffect(() => {
    const hasActiveInQueue = uploadQueue.some(
      item => item.status === 'analyzing' || item.status === 'uploading'
    );
    if (hasActiveInQueue) {
      setHasActiveJobs(true);
    } else {
      // Only set to false if queue is empty, otherwise check API
      if (uploadQueue.length === 0) {
        // Check API once to see if there are other active jobs
        getActiveBills().then(response => {
          if (response.success) {
            const active = response.active_jobs.filter(
              job => job.status === 'queued' || job.status === 'processing'
            );
            setHasActiveJobs(active.length > 0);
          }
        }).catch(() => {
          // Ignore errors
        });
      }
    }
  }, [uploadQueue]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '2rem' }}>
          <Typography 
            variant="h5" 
            gutterBottom 
            sx={{ 
              fontFamily: "'Inter', sans-serif",
              color: theme.palette.text.primary, 
              fontWeight: 600,
              fontSize: '1.25rem',
              lineHeight: 1.2,
              mb: 0,
            }}
          >
            Upload Bills & Receipts
          </Typography>
          {hasActiveJobs && (
            <Badge
              badgeContent=""
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                  boxShadow: `0 0 0 0 ${theme.palette.error.main}`,
                },
                '@keyframes pulse': {
                  '0%, 100%': {
                    opacity: 1,
                  },
                  '50%': {
                    opacity: 0.5,
                  },
                },
              }}
            >
              <Button
                variant="contained"
                startIcon={<PlayArrow />}
                onClick={() => setTabValue(1)}
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  textTransform: 'none',
                  fontWeight: 600,
                  backgroundColor: theme.palette.error.main,
                  boxShadow: hasActiveJobs
                    ? `0 0 20px ${theme.palette.error.main}40, 0 0 40px ${theme.palette.error.main}20`
                    : 'none',
                  animation: hasActiveJobs ? 'glow 2s ease-in-out infinite' : 'none',
                  '@keyframes glow': {
                    '0%, 100%': {
                      boxShadow: `0 0 20px ${theme.palette.error.main}40, 0 0 40px ${theme.palette.error.main}20`,
                    },
                    '50%': {
                      boxShadow: `0 0 30px ${theme.palette.error.main}60, 0 0 60px ${theme.palette.error.main}40`,
                    },
                  },
                  '&:hover': {
                    backgroundColor: theme.palette.error.dark,
                  },
                }}
              >
                View Progress
              </Button>
            </Badge>
          )}
        </Box>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.875rem',
                minHeight: 48,
                color: theme.palette.text.secondary,
              },
              '& .MuiTab-root.Mui-selected': {
                color: theme.palette.primary.main,
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
                height: 3,
              },
            }}
          >
            <Tab label="Upload" {...a11yProps(0)} />
            <Tab 
              label={
                <Badge 
                  badgeContent={hasActiveJobs ? '!' : 0} 
                  color="error"
                  invisible={!hasActiveJobs}
                >
                  Progress
                </Badge>
              } 
              {...a11yProps(1)} 
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: '2rem' }}>
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
              Upload bills, receipts, or documents for automatic processing. Select whether it's an expense, earning, or mix of both.
            </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 400,
              lineHeight: 1.5,
              color: theme.palette.text.secondary,
              display: 'block',
              mt: '0.5rem',
            }}
          >
            Supports: Images, PDF, Excel, CSV • You can also paste an image (Ctrl+V / Cmd+V)
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
            <Button
              variant={uploadType === 'mix' ? 'contained' : 'outlined'}
              onClick={() => setUploadType('mix')}
              startIcon={<SwapHoriz />}
              sx={{
                fontFamily: "'Inter', sans-serif",
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Mix
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
            startIcon={<ContentPaste />}
            onClick={async () => {
              // Try to read from clipboard API if available
              try {
                const clipboardItems = await navigator.clipboard.read();
                for (const clipboardItem of clipboardItems) {
                  for (const type of clipboardItem.types) {
                    if (type.startsWith('image/')) {
                      const blob = await clipboardItem.getType(type);
                      const file = new File([blob], `pasted-image-${Date.now()}.png`, {
                        type: blob.type || 'image/png',
                      });
                      if (uploadMode === 'single') {
                        await handleUploadSingle(file, uploadType);
                      } else {
                        handleAddToQueue([file], uploadType);
                      }
                      return;
                    }
                  }
                }
              } catch (err) {
                // Clipboard API not available or permission denied
                // Focus container so user can paste manually with Ctrl+V/Cmd+V
                containerRef.current?.focus();
              }
            }}
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
            Paste Image
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
                          label={item.type === 'mix' ? 'Mix' : item.type === 'earning' ? 'Earning' : 'Expense'} 
                          size="small" 
                          color={
                            item.type === 'earning' ? 'success' : 
                            item.type === 'mix' ? 'info' : 
                            'warning'
                          }
                          icon={
                            item.type === 'earning' ? <TrendingUp /> : 
                            item.type === 'mix' ? <SwapHoriz /> : 
                            <TrendingDown />
                          }
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

        {/* Single Upload Progress with SSE */}
        {uploadMode === 'single' && uploadQueue.length > 0 && uploadQueue[0].status !== 'completed' && uploadQueue[0].jobId && (
          <UploadItemProgressMonitor
            item={uploadQueue[0]}
            onUpdate={(updatedItem) => {
              setUploadQueue(prev => prev.map(i => 
                i.id === updatedItem.id ? updatedItem : i
              ));
              if (updatedItem.status === 'completed' && updatedItem.transaction) {
                onTransactionCreated?.(updatedItem.transaction);
                setIsProcessing(false);
              } else if (updatedItem.status === 'error') {
                setIsProcessing(false);
              }
            }}
            theme={theme}
          />
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
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ProgressTab />
        </TabPanel>
      </Paper>
    </Box>
  );
}

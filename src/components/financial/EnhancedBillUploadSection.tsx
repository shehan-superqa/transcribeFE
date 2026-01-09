import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
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
  Collapse,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Radio,
  RadioGroup,
  FormControlLabel,
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
  UploadFile,
  Image as ImageIcon,
  PictureAsPdf,
  TableChart,
  Tune,
  ExpandMore,
  Description,
  Visibility,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { uploadBill, uploadBillsBulk, getBillStatus, getBulkUploadStatus, getActiveBills } from '../../lib/api/financialApi';
import { Transaction } from '../../types/financial';
import CameraCapture from './CameraCapture';
import { useFinancialJobProgress } from '../../hooks/useFinancialJobProgress';
import ManualTransactionDialog from './ManualTransactionDialog';
import ProgressTab from './ProgressTab';
import '../../css/components/financial/EnhancedBillUploadSection.css';

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
      {value === index && <div style={{ paddingTop: 0 }}>{children}</div>}
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
    <div style={{ marginBottom: '1.5rem', padding: '16px', backgroundColor: theme.palette.background.default, borderRadius: '4px', border: `1px solid ${theme.palette.divider}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
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
      </div>
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
    </div>
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
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Sync dark mode class with theme
  useEffect(() => {
    const html = document.documentElement;
    if (theme.palette.mode === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }, [theme.palette.mode]);

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
    <div ref={containerRef} tabIndex={0}>
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

      <div 
        style={{ 
          padding: 0,
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: 0,
          boxShadow: 'none',
        }}
        >
        <TabPanel value={tabValue} index={0}>
          <div className="upload-section">
            {/* New Transaction Section */}
            <div className="upload-card" style={{ marginBottom: '24px' }}>
              <div className="upload-card-content">
                <div style={{ marginBottom: '32px' }}>
                  <h2 className="upload-title">New Transaction</h2>
                  <p className="upload-description">Select options and drop your files below to start automatic processing.</p>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <Button
                    variant="outlined"
                    startIcon={<CameraAlt />}
                    onClick={() => setShowCamera(true)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      px: 2,
                      py: 1,
                      borderColor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                      bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#F9FAFB',
                      color: theme.palette.text.primary,
                      fontFamily: "'Inter', sans-serif",
                      '&:hover': {
                        borderColor: '#6D28D9',
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                        color: '#6D28D9',
                      },
                    }}
                  >
                    Scan with Camera
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Edit />}
                    onClick={() => setShowManualDialog(true)}
                    sx={{
                      textTransform: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 500,
                      px: 2,
                      py: 1,
                      borderColor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                      bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#F9FAFB',
                      color: theme.palette.text.primary,
                      fontFamily: "'Inter', sans-serif",
                      '&:hover': {
                        borderColor: '#6D28D9',
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                        color: '#6D28D9',
                      },
                    }}
                  >
                    Manual Entry
                  </Button>
                </div>

                {/* Transaction Type and Upload Mode Grid */}
                <div className="upload-options-grid">
                  {/* Transaction Type Selection */}
                  <div>
                    <label className="upload-option-label">Transaction Type</label>
                    <div className="segmented-control">
                      <input
                        type="radio"
                        id="expense"
                        name="transaction-type"
                        checked={uploadType === 'expense'}
                        onChange={() => setUploadType('expense')}
                      />
                      <label htmlFor="expense">Expense</label>
                      <input
                        type="radio"
                        id="earning"
                        name="transaction-type"
                        checked={uploadType === 'earning'}
                        onChange={() => setUploadType('earning')}
                      />
                      <label htmlFor="earning">Earning</label>
                      <input
                        type="radio"
                        id="mix"
                        name="transaction-type"
                        checked={uploadType === 'mix'}
                        onChange={() => setUploadType('mix')}
                      />
                      <label htmlFor="mix">Mixed</label>
                    </div>
                  </div>

                  {/* Upload Mode Selection */}
                  <div>
                    <label className="upload-option-label">Upload Mode</label>
                    <div className="segmented-control">
                      <input
                        type="radio"
                        id="single"
                        name="upload-mode"
                        checked={uploadMode === 'single'}
                        onChange={() => setUploadMode('single')}
                      />
                      <label htmlFor="single">Single Upload</label>
                      <input
                        type="radio"
                        id="bulk"
                        name="upload-mode"
                        checked={uploadMode === 'bulk'}
                        onChange={() => setUploadMode('bulk')}
                      />
                      <label htmlFor="bulk">Bulk Processing</label>
                    </div>
                  </div>
                </div>

                {/* Drag and Drop Area */}
                <div
                  {...getRootProps()}
                  className={`drag-drop-area ${isDragActive ? 'drag-active' : ''}`}
                  style={{ cursor: (isProcessing && uploadMode === 'single') ? 'not-allowed' : 'pointer' }}
                >
                  <input {...getInputProps()} />
                  <div className="upload-icon-container">
                    <UploadFile className="upload-icon" />
                  </div>
                  <h3 className="drag-drop-title">Drag and drop your files here</h3>
                  <p className="drag-drop-subtitle">or click to browse from your computer</p>
                  <div className="file-types">
                    <div className="file-type-item">
                      <ImageIcon className="file-type-icon" />
                      <span>Images</span>
                    </div>
                    <div className="file-type-item">
                      <PictureAsPdf className="file-type-icon" />
                      <span>PDF</span>
                    </div>
                    <div className="file-type-item">
                      <TableChart className="file-type-icon" />
                      <span>CSV / Excel</span>
                    </div>
                  </div>
                </div>

                {/* Advanced Options Collapsible */}
                <details className="advanced-options" open={showAdvancedOptions} onToggle={(e) => setShowAdvancedOptions((e.target as HTMLDetailsElement).open)}>
                  <summary>
                    <span className="advanced-options-title">
                      <Tune className="advanced-options-icon" />
                      Advanced Options
                    </span>
                    <ExpandMore className="expand-icon" />
                  </summary>
                  <div className="advanced-options-content">
                    <div className="advanced-options-field">
                      <label>Category Override (Optional)</label>
                      <select
                        value={categoryOverride}
                        onChange={(e) => setCategoryOverride(e.target.value)}
                        disabled={isProcessing}
                      >
                        <option value="">Auto-detect</option>
                        {categories?.map((cat: any) => (
                          <option key={cat._id || cat.id} value={cat._id || cat.id}>
                            {cat.category_name || cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="advanced-options-field">
                      <label>Merchant Override (Optional)</label>
                      <input
                        type="text"
                        value={merchantOverride}
                        onChange={(e) => setMerchantOverride(e.target.value)}
                        disabled={isProcessing}
                        placeholder="Enter merchant name"
                      />
                    </div>
                  </div>
                </details>
              </div>
            </div>

            {/* Recent Uploads Section */}
            <div className="recent-uploads-card">
              <div className="recent-uploads-header">
                <h3 className="recent-uploads-title">Recent Uploads</h3>
              </div>
              <div className="recent-uploads-table-container">
                <table className="recent-uploads-table">
                  <thead>
                    <tr>
                      <th>File Name</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadQueue.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="empty-state">
                          No recent uploads
                        </td>
                      </tr>
                    ) : (
                      uploadQueue.slice(0, 5).map((item) => {
                        const date = new Date();
                        const statusLabel = item.status === 'completed' ? 'PROCESSED' : 
                                           item.status === 'analyzing' ? 'ANALYZING' : 
                                           item.status === 'error' ? 'ERROR' : 
                                           item.status === 'uploading' ? 'UPLOADING' : 'PENDING';
                        const statusClass = item.status === 'completed' ? 'processed' : 
                                           item.status === 'analyzing' ? 'analyzing' : 
                                           item.status === 'error' ? 'error' : 'pending';

                        return (
                          <tr key={item.id}>
                            <td>
                              <div className="file-name-cell">
                                <Description className="file-icon" />
                                <span className="file-name">{item.file.name}</span>
                              </div>
                            </td>
                            <td>
                              <span className={`status-badge ${statusClass}`}>
                                {statusLabel}
                              </span>
                            </td>
                            <td className="date-cell">
                              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </td>
                            <td className="action-cell">
                              <button className="action-button">
                                <Visibility className="action-icon" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Bulk Upload Queue */}
          {uploadMode === 'bulk' && uploadQueue.length > 0 && (
            <div style={{ marginBottom: '2rem', marginTop: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Typography variant="h6" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                  Upload Queue ({uploadQueue.length} items)
                </Typography>
                <div style={{ display: 'flex', gap: '8px' }}>
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
                </div>
              </div>

              {(completedCount > 0 || errorCount > 0) && (
                <div style={{ marginBottom: '16px' }}>
                  <Alert severity="info">
                    Completed: {completedCount} | Errors: {errorCount} | Pending: {pendingCount}
                  </Alert>
                </div>
              )}
            </div>
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
              <div style={{ marginTop: '4px' }}>
                <Typography variant="body2" component="div">
                  <strong>Amount:</strong> Rs. {item.transaction.amount.toFixed(2)}
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>Merchant:</strong> {item.transaction.merchant_id || 'Unknown'}
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>Category:</strong> {item.transaction.category_id || 'Unknown'}
                </Typography>
              </div>
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
      </div>
    </div>
  );
}

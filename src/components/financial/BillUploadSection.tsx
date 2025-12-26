import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Paper, Typography, Button, TextField, LinearProgress, Alert, Chip } from '@mui/material';
import { CloudUpload, CameraAlt, CheckCircle, ContentPaste } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { uploadBill, getBillStatus } from '../../lib/api/financialApi';
import { Transaction } from '../../types/financial';
import CameraCapture from './CameraCapture';
import { useFinancialJobProgress } from '../../hooks/useFinancialJobProgress';

interface BillUploadSectionProps {
  onTransactionCreated?: (transaction: Transaction) => void;
}

export default function BillUploadSection({ onTransactionCreated }: BillUploadSectionProps) {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [categoryOverride, setCategoryOverride] = useState('');
  const [merchantOverride, setMerchantOverride] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Use SSE for real-time progress updates
  const { progress, status, message, step, details, error: progressError, isConnected } = useFinancialJobProgress(jobId, streamUrl);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    setTransaction(null);
    setJobId(null);
    setStreamUrl(undefined);

    try {
      const result = await uploadBill(
        file,
        categoryOverride || undefined,
        merchantOverride || undefined
      );

      if (result.success && result.job_id) {
        setJobId(result.job_id);
        setStreamUrl(result.stream_url); // Use stream_url from API response
        setUploading(true);
      } else {
        throw new Error('Failed to upload bill');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload bill');
      setUploading(false);
      setJobId(null);
      setStreamUrl(undefined);
    }
  }, [categoryOverride, merchantOverride]);

  // Handle progress updates and completion
  useEffect(() => {
    if (status === 'completed' && jobId) {
      // Fetch the final transaction when job completes
      const fetchTransaction = async () => {
        try {
          const result = await getBillStatus(jobId);
          if (result.transaction) {
            setTransaction(result.transaction);
            onTransactionCreated?.(result.transaction);
          }
          setUploading(false);
        } catch (err: any) {
          setError(err.message || 'Failed to fetch transaction');
          setUploading(false);
        }
      };
      fetchTransaction();
    } else if (status === 'error' || status === 'failed') {
      setError(progressError || message || 'Bill processing failed');
      setUploading(false);
    } else if (status === 'processing' || status === 'idle') {
      setUploading(true);
    }
  }, [status, jobId, progressError, message, onTransactionCreated]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    await handleUpload(file);
  }, [handleUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  const handleCameraCapture = (file: File) => {
    handleUpload(file);
  };

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    // Only handle paste if the component is focused/active and not uploading
    if (uploading) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) {
          // Convert blob to File with a proper name
          const file = new File([blob], `pasted-image-${Date.now()}.png`, {
            type: blob.type || 'image/png',
          });
          await handleUpload(file);
        }
        break;
      }
    }
  }, [uploading, handleUpload]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Focus the container to enable paste events
    container.focus();

    const handlePasteEvent = (e: ClipboardEvent) => {
      handlePaste(e);
    };

    container.addEventListener('paste', handlePasteEvent);
    // Also listen on window for paste events when component is mounted
    window.addEventListener('paste', handlePasteEvent);

    return () => {
      container.removeEventListener('paste', handlePasteEvent);
      window.removeEventListener('paste', handlePasteEvent);
    };
  }, [handlePaste]);

  const reset = () => {
    setUploading(false);
    setJobId(null);
    setStreamUrl(undefined);
    setError(null);
    setTransaction(null);
    setCategoryOverride('');
    setMerchantOverride('');
  };

  return (
    <Box ref={containerRef} tabIndex={0}>
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

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
            Upload Bill or Receipt
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
            Upload a bill image or PDF for automatic processing. We'll extract the details and categorize it for you.
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
            Supports: JPG, PNG, WEBP, PDF • You can also paste an image (Ctrl+V / Cmd+V)
          </Typography>
        </Box>

        {/* Optional Overrides */}
        <Box sx={{ display: 'flex', gap: '1rem', mb: '2rem' }}>
          <TextField
            label="Category Override (optional)"
            value={categoryOverride}
            onChange={(e) => setCategoryOverride(e.target.value)}
            size="small"
            fullWidth
            disabled={uploading}
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
            disabled={uploading}
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
            disabled={uploading}
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
                      await handleUpload(file);
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
            disabled={uploading}
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
          <Box
            {...getRootProps()}
            sx={{
              flex: 1,
              border: `3px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
              borderRadius: 3,
              padding: '40px 24px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
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
            aria-label="Upload bill or receipt by dragging and dropping or clicking to select"
          >
            <input {...getInputProps()} aria-label="File input for bill upload" />
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
              {isDragActive ? 'Drop file here' : 'Drag & drop file here'}
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
              or click to browse files
            </Typography>
          </Box>
        </Box>

        {/* Progress - Real-time from SSE */}
        {uploading && (
          <Box sx={{ mb: '1.5rem', p: 2, backgroundColor: theme.palette.background.default, borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                  variant="subtitle2"
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    lineHeight: 1.5,
                    color: theme.palette.text.primary,
                  }}
                >
                  Processing Progress
                </Typography>
                {isConnected && (
                  <Chip 
                    label="Live" 
                    size="small" 
                    color="success" 
                    sx={{ 
                      height: 20, 
                      fontSize: '0.7rem',
                      '& .MuiChip-label': { px: 0.75 }
                    }} 
                  />
                )}
              </Box>
              <Typography 
                variant="body2"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  lineHeight: 1.5,
                  color: theme.palette.primary.main,
                }}
              >
                {Math.round(progress)}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{
                height: 8,
                borderRadius: 1,
                backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#e5e7eb',
                mb: 1.5,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            />
            {message && (
              <Typography 
                variant="body2"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: theme.palette.text.secondary,
                  mb: step ? 0.5 : 0,
                }}
              >
                {message}
              </Typography>
            )}
            {step && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Typography 
                  variant="caption"
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: theme.palette.text.secondary,
                    textTransform: 'uppercase',
                  }}
                >
                  Current Step:
                </Typography>
                <Chip
                  label={step.charAt(0).toUpperCase() + step.slice(1)}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.75rem',
                    height: 22,
                  }}
                />
              </Box>
            )}
          </Box>
        )}

        {/* Error */}
        {(error || progressError) && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => { setError(null); }}>
            {error || progressError}
          </Alert>
        )}

        {/* Success */}
        {transaction && (
          <Alert
            severity="success"
            icon={<CheckCircle />}
            sx={{ mb: 2 }}
            onClose={reset}
            role="alert"
            aria-live="polite"
          >
            <Typography 
              variant="subtitle1" 
              gutterBottom 
              sx={{ 
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                fontSize: '1rem',
                lineHeight: 1.2,
                mb: '0.5rem',
              }}
            >
              Transaction Created Successfully!
            </Typography>
            <Box sx={{ mt: '0.5rem' }}>
              <Typography 
                variant="body2" 
                component="div"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: theme.palette.text.primary,
                  mb: '0.25rem',
                }}
              >
                <strong>Amount:</strong> Rs. {transaction.amount.toFixed(2)}
              </Typography>
              <Typography 
                variant="body2" 
                component="div"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: theme.palette.text.primary,
                  mb: '0.25rem',
                }}
              >
                <strong>Merchant:</strong> {transaction.merchant_id || 'Unknown'}
              </Typography>
              <Typography 
                variant="body2" 
                component="div"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: theme.palette.text.primary,
                  mb: '0.25rem',
                }}
              >
                <strong>Category:</strong> {transaction.category_id || 'Unknown'}
              </Typography>
              <Typography 
                variant="body2" 
                component="div" 
                sx={{ 
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: theme.palette.text.primary,
                  mt: '0.5rem',
                }}
              >
                <strong>Confidence:</strong>{' '}
                <Chip
                  label={`${(transaction.confidence_category * 100).toFixed(1)}%`}
                  size="small"
                  color={transaction.confidence_category > 0.9 ? 'success' : transaction.confidence_category > 0.7 ? 'warning' : 'error'}
                  sx={{ ml: 0.5 }}
                />
              </Typography>
            </Box>
          </Alert>
        )}
      </Paper>
    </Box>
  );
}





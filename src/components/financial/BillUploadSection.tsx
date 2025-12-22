import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Paper, Typography, Button, TextField, LinearProgress, Alert } from '@mui/material';
import { CloudUpload, CameraAlt, CheckCircle, ContentPaste } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { uploadBill, getBillStatus } from '../../lib/api/financialApi';
import { Transaction } from '../../types/financial';
import CameraCapture from './CameraCapture';

interface BillUploadSectionProps {
  onTransactionCreated?: (transaction: Transaction) => void;
}

export default function BillUploadSection({ onTransactionCreated }: BillUploadSectionProps) {
  const { theme } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [categoryOverride, setCategoryOverride] = useState('');
  const [merchantOverride, setMerchantOverride] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const pollJobStatus = useCallback(async (jobId: string) => {
    const maxAttempts = 60; // 60 seconds max
    let attempts = 0;

    const poll = async () => {
      try {
        const result = await getBillStatus(jobId);
        attempts++;

        if (result.job.status === 'completed') {
          setProgress(100);
          setStatus('Processing completed!');
          setUploading(false);
          if (result.transaction) {
            setTransaction(result.transaction);
            onTransactionCreated?.(result.transaction);
          }
        } else if (result.job.status === 'failed') {
          setError('Bill processing failed');
          setUploading(false);
          setStatus('');
        } else if (result.job.status === 'processing') {
          setProgress(Math.min(attempts * 2, 90)); // Progress indicator
          setStatus('Processing bill...');
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000); // Poll every second
          } else {
            setError('Processing timeout');
            setUploading(false);
            setStatus('');
          }
        } else {
          // Pending
          setProgress(10);
          setStatus('Waiting for processing to start...');
          if (attempts < maxAttempts) {
            setTimeout(poll, 1000);
          } else {
            setError('Processing timeout');
            setUploading(false);
            setStatus('');
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to check status');
        setUploading(false);
        setStatus('');
      }
    };

    poll();
  }, [onTransactionCreated]);

  const handleUpload = useCallback(async (file: File) => {
    setUploading(true);
    setError(null);
    setProgress(0);
    setStatus('Uploading file...');
    setTransaction(null);

    try {
      const result = await uploadBill(
        file,
        categoryOverride || undefined,
        merchantOverride || undefined
      );

      if (result.success && result.job_id) {
        setJobId(result.job_id);
        setStatus('Processing bill...');
        pollJobStatus(result.job_id);
      } else {
        throw new Error('Failed to upload bill');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload bill');
      setUploading(false);
      setStatus('');
    }
  }, [categoryOverride, merchantOverride, pollJobStatus]);

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
    setProgress(0);
    setStatus('');
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

      <Paper elevation={1} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
          Upload Bill
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Upload a bill image or PDF for AI processing. Supports JPG, PNG, WEBP, and PDF formats.
          You can also paste an image from your clipboard (Ctrl+V / Cmd+V).
        </Typography>

        {/* Optional Overrides */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField
            label="Category Override (optional)"
            value={categoryOverride}
            onChange={(e) => setCategoryOverride(e.target.value)}
            size="small"
            fullWidth
            disabled={uploading}
          />
          <TextField
            label="Merchant Override (optional)"
            value={merchantOverride}
            onChange={(e) => setMerchantOverride(e.target.value)}
            size="small"
            fullWidth
            disabled={uploading}
          />
        </Box>

        {/* Upload Options */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<CameraAlt />}
            onClick={() => setShowCamera(true)}
            disabled={uploading}
            sx={{ 
              flex: '1 1 auto', 
              minWidth: '120px',
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 198, 255, 0.1)' : '#f0f9ff',
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
              flex: '1 1 auto', 
              minWidth: '120px',
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 198, 255, 0.1)' : '#f0f9ff',
              },
            }}
          >
            Paste Image
          </Button>
          <Box
            {...getRootProps()}
            sx={{
              flex: 1,
              border: '2px dashed',
              borderColor: isDragActive ? theme.palette.primary.main : theme.palette.divider,
              borderRadius: '8px',
              padding: '24px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              backgroundColor: isDragActive 
                ? (theme.palette.mode === 'dark' ? 'rgba(0, 198, 255, 0.1)' : '#f0f9ff')
                : theme.palette.background.default,
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 198, 255, 0.1)' : '#f0f9ff',
              },
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 48, color: theme.palette.text.secondary, mb: 1 }} />
            <Typography variant="body1" gutterBottom sx={{ color: theme.palette.text.primary }}>
              {isDragActive ? 'Drop file here' : 'Drag & drop file here'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to select
            </Typography>
          </Box>
        </Box>

        {/* Progress */}
        {uploading && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">{status}</Typography>
              <Typography variant="body2">{progress}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} />
          </Box>
        )}

        {/* Error */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Success */}
        {transaction && (
          <Alert
            severity="success"
            icon={<CheckCircle />}
            sx={{ mb: 2 }}
            onClose={reset}
          >
            <Typography variant="subtitle2" gutterBottom>
              Transaction Created Successfully!
            </Typography>
            <Typography variant="body2">
              Amount: Rs. {transaction.amount.toFixed(2)}
              <br />
              Merchant: {transaction.merchant_id || 'Unknown'}
              <br />
              Category: {transaction.category_id || 'Unknown'}
              <br />
              Confidence: {(transaction.confidence_category * 100).toFixed(1)}%
            </Typography>
          </Alert>
        )}
      </Paper>
    </Box>
  );
}

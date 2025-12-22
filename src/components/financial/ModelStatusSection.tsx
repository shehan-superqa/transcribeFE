import { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, Card, CardContent, LinearProgress, Alert, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Refresh, PlayArrow } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { getModelStatus, reloadModel, triggerRetraining } from '../../lib/api/financialApi';
import { ModelStatusResponse } from '../../types/financial';

export default function ModelStatusSection() {
  const { theme } = useTheme();
  const [modelStatus, setModelStatus] = useState<ModelStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    loadModelStatus();
  }, []);

  const loadModelStatus = async () => {
    setLoading(true);
    try {
      const response = await getModelStatus();
      if (response.success) {
        setModelStatus(response);
      }
    } catch (error) {
      console.error('Failed to load model status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReload = async () => {
    setReloading(true);
    try {
      await reloadModel();
      await loadModelStatus();
      setSnackbar({ open: true, message: 'Model reloaded successfully!', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to reload model: ' + error.message, severity: 'error' });
    } finally {
      setReloading(false);
    }
  };

  const handleRetrain = async () => {
    setConfirmDialogOpen(true);
  };

  const confirmRetrain = async () => {
    setConfirmDialogOpen(false);
    setRetraining(true);
    try {
      const response = await triggerRetraining({ days_back: 30, min_samples: 50 });
      if (response.success && response.results) {
        setSnackbar({
          open: true,
          message: `Retraining completed! Accuracy: ${(response.results.accuracy * 100).toFixed(2)}%, Model Version: ${response.results.model_version}`,
          severity: 'success',
        });
        await loadModelStatus();
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to trigger retraining: ' + error.message, severity: 'error' });
    } finally {
      setRetraining(false);
    }
  };

  if (loading) {
    return (
      <Paper elevation={1} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
        <Typography sx={{ color: theme.palette.text.primary }}>Loading model status...</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper elevation={1} sx={{ p: 2, backgroundColor: theme.palette.background.paper }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>Model Status</Typography>
          <Button startIcon={<Refresh />} onClick={loadModelStatus} size="small">
            Refresh
          </Button>
        </Box>
        {modelStatus && (
          <Box>
            <Alert severity={modelStatus.model_loaded ? 'success' : 'warning'} sx={{ mb: 2 }}>
              Model Status: {modelStatus.model_loaded ? 'Loaded' : 'Not Loaded'}
            </Alert>
            <Typography variant="body2" color="text.secondary">
              Categorization Method: {modelStatus.categorization_method}
            </Typography>
          </Box>
        )}
      </Paper>

      {modelStatus?.model_info && (
        <Card elevation={1} sx={{ backgroundColor: theme.palette.background.paper }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
              Model Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                <strong>Version:</strong> {modelStatus.model_info.model_version}
              </Typography>
              <Typography variant="body2">
                <strong>Accuracy:</strong> {(modelStatus.model_info.accuracy * 100).toFixed(2)}%
              </Typography>
              <Box sx={{ mt: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={modelStatus.model_info.accuracy * 100}
                  sx={{ height: 8, borderRadius: 1 }}
                />
              </Box>
              <Typography variant="body2">
                <strong>Training Samples:</strong> {modelStatus.model_info.training_samples}
              </Typography>
              <Typography variant="body2">
                <strong>Test Samples:</strong> {modelStatus.model_info.test_samples}
              </Typography>
              <Typography variant="body2">
                <strong>Categories:</strong> {modelStatus.model_info.categories}
              </Typography>
              <Typography variant="body2">
                <strong>Trained At:</strong> {new Date(modelStatus.model_info.trained_at).toLocaleString()}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      <Paper elevation={1} sx={{ p: 2, backgroundColor: theme.palette.background.paper }}>
        <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
          Model Actions
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleReload}
            disabled={reloading}
          >
            {reloading ? 'Reloading...' : 'Reload Model'}
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayArrow />}
            onClick={handleRetrain}
            disabled={retraining}
          >
            {retraining ? 'Retraining...' : 'Trigger Retraining'}
          </Button>
        </Box>
      </Paper>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Retraining</DialogTitle>
        <DialogContent>
          <Typography>Trigger model retraining? This may take some time.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmRetrain} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

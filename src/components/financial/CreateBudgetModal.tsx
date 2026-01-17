import { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  IconButton,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Slider,
  Alert,
  Grid,
  Divider,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  NotificationsActive as NotificationsActiveIcon,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { Budget, CreateBudgetRequest, UpdateBudgetRequest, Category } from '../../types/financial';

interface CreateBudgetModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBudgetRequest | UpdateBudgetRequest) => Promise<void>;
  budget?: Budget | null;
  categories?: Category[];
  loading?: boolean;
}

export default function CreateBudgetModal({
  open,
  onClose,
  onSubmit,
  budget,
  categories = [],
  loading = false,
}: CreateBudgetModalProps) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<CreateBudgetRequest>({
    name: '',
    category_id: null,
    amount: 0,
    period: 'monthly',
    budget_type: 'fixed',
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    alert_thresholds: {
      warning: 70,
      critical: 95,
    },
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name,
        category_id: budget.category_id,
        amount: budget.amount,
        period: budget.period,
        budget_type: budget.budget_type || 'fixed',
        start_date: budget.start_date.split('T')[0],
        end_date: budget.end_date ? budget.end_date.split('T')[0] : null,
        alert_thresholds: budget.alert_thresholds,
      });
    } else {
      setFormData({
        name: '',
        category_id: null,
        amount: 0,
        period: 'monthly',
        budget_type: 'fixed',
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        alert_thresholds: {
          warning: 70,
          critical: 95,
        },
      });
    }
    setError(null);
  }, [budget, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Budget name is required');
      return;
    }
    if (!formData.amount || formData.amount <= 0) {
      setError('Budget amount must be greater than 0');
      return;
    }
    if (formData.alert_thresholds.warning >= formData.alert_thresholds.critical) {
      setError('Warning threshold must be less than critical threshold');
      return;
    }

    try {
      const submitData = budget
        ? ({
            name: formData.name,
            amount: formData.amount,
            period: formData.period,
            budget_type: formData.budget_type,
            start_date: formData.start_date,
            end_date: formData.end_date,
            alert_thresholds: formData.alert_thresholds,
          } as UpdateBudgetRequest)
        : ({
            ...formData,
            start_date: new Date(formData.start_date + 'T00:00:00').toISOString(),
            end_date: formData.end_date ? new Date(formData.end_date + 'T23:59:59').toISOString() : null,
          } as CreateBudgetRequest);

      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save budget');
    }
  };

  // Calculate preview percentage (mock 82% for demo)
  const previewPercentage = 82;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxWidth: '800px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 4,
          py: 3,
          borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              fontSize: '1.5rem',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {budget ? 'Edit Budget' : 'Create Budget'}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
              mt: 0.5,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Set up your spending limits and notifications.
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              color: theme.palette.text.primary,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Content */}
      <Box
        sx={{
          p: 4,
          backgroundColor: theme.palette.background.paper,
          overflowY: 'auto',
          flex: 1,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
            },
          },
        }}
      >
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ mb: 3, borderRadius: '12px' }}
          >
            {error}
          </Alert>
        )}

        {/* Budget Details Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <AccountBalanceWalletIcon
              sx={{
                color: theme.palette.primary.main,
                fontSize: '1.5rem',
              }}
            />
            <Typography
              variant="overline"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: theme.palette.text.secondary,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Budget Details
            </Typography>
          </Box>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    fontSize: '0.875rem',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Budget Name *
                </Typography>
                <TextField
                  placeholder="e.g. Monthly Groceries"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  fullWidth
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#d1d5db',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputBase-input': {
                      py: 1.25,
                      px: 2,
                      fontFamily: "'Inter', sans-serif",
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    fontSize: '0.875rem',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Category (Optional)
                </Typography>
                <FormControl
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#d1d5db',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiSelect-select': {
                      py: 1.25,
                      px: 2,
                      fontFamily: "'Inter', sans-serif",
                    },
                  }}
                >
                  <Select
                    value={formData.category_id || ''}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <em>None</em>
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat._id} value={cat._id}>
                        {cat.category_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    fontSize: '0.875rem',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Budget Amount *
                </Typography>
                <Box sx={{ position: 'relative' }}>
                  <Typography
                    sx={{
                      position: 'absolute',
                      left: 16,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: theme.palette.text.secondary,
                      zIndex: 1,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    $
                  </Typography>
                  <TextField
                    type="number"
                    placeholder="0.00"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    fullWidth
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                        borderRadius: '8px',
                        pl: 4,
                        '& fieldset': {
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb',
                        },
                        '&:hover fieldset': {
                          borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#d1d5db',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: '2px',
                        },
                      },
                      '& .MuiInputBase-input': {
                        py: 1.25,
                        fontFamily: "'Inter', sans-serif",
                      },
                    }}
                  />
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    fontSize: '0.875rem',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Period
                </Typography>
                <FormControl
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#d1d5db',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiSelect-select': {
                      py: 1.25,
                      px: 2,
                      fontFamily: "'Inter', sans-serif",
                    },
                  }}
                >
                  <Select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="yearly">Yearly</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    fontSize: '0.875rem',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Start Date
                </Typography>
                <TextField
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  fullWidth
                  disabled={!!budget}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#d1d5db',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputBase-input': {
                      py: 1.25,
                      px: 2,
                      fontFamily: "'Inter', sans-serif",
                    },
                  }}
                />
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    fontSize: '0.875rem',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  End Date (Optional)
                </Typography>
                <TextField
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
                  fullWidth
                  disabled={!!budget}
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f9fafb',
                      borderRadius: '8px',
                      '& fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb',
                      },
                      '&:hover fieldset': {
                        borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#d1d5db',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: '2px',
                      },
                    },
                    '& .MuiInputBase-input': {
                      py: 1.25,
                      px: 2,
                      fontFamily: "'Inter', sans-serif",
                    },
                  }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        <Divider sx={{ my: 4, borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

        {/* Notifications Section */}
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <NotificationsActiveIcon
              sx={{
                color: theme.palette.primary.main,
                fontSize: '1.5rem',
              }}
            />
            <Typography
              variant="overline"
              sx={{
                fontSize: '0.75rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: theme.palette.text.secondary,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Notifications
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.875rem',
              mb: 4,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Choose when you want to be alerted about your spending progress.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {/* Warning Threshold */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    fontSize: '0.875rem',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Warning Threshold
                </Typography>
                <Chip
                  label={`${formData.alert_thresholds.warning}%`}
                  size="small"
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(251, 191, 36, 0.2)' : '#fef3c7',
                    color: theme.palette.mode === 'dark' ? '#fbbf24' : '#d97706',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: '24px',
                  }}
                />
              </Box>
              <Slider
                value={formData.alert_thresholds.warning}
                onChange={(_, value) =>
                  setFormData({
                    ...formData,
                    alert_thresholds: { ...formData.alert_thresholds, warning: value as number },
                  })
                }
                min={0}
                max={formData.alert_thresholds.critical - 1}
                step={1}
                sx={{
                  color: theme.palette.primary.main,
                  height: 8,
                  '& .MuiSlider-thumb': {
                    width: 18,
                    height: 18,
                    backgroundColor: theme.palette.primary.main,
                    border: '3px solid white',
                    boxShadow: `0 0 10px ${theme.palette.primary.main}40`,
                    '&:hover': {
                      boxShadow: `0 0 15px ${theme.palette.primary.main}60`,
                    },
                  },
                  '& .MuiSlider-track': {
                    height: 8,
                    borderRadius: '8px',
                  },
                  '& .MuiSlider-rail': {
                    height: 8,
                    borderRadius: '8px',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb',
                  },
                }}
              />
            </Box>

            {/* Critical Threshold */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 500,
                    color: theme.palette.text.primary,
                    fontSize: '0.875rem',
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Critical Threshold
                </Typography>
                <Chip
                  label={`${formData.alert_thresholds.critical}%`}
                  size="small"
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(244, 63, 94, 0.2)' : '#ffe4e6',
                    color: theme.palette.mode === 'dark' ? '#f43f5e' : '#e11d48',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    height: '24px',
                  }}
                />
              </Box>
              <Slider
                value={formData.alert_thresholds.critical}
                onChange={(_, value) =>
                  setFormData({
                    ...formData,
                    alert_thresholds: { ...formData.alert_thresholds, critical: value as number },
                  })
                }
                min={formData.alert_thresholds.warning + 1}
                max={100}
                step={1}
                sx={{
                  color: theme.palette.primary.main,
                  height: 8,
                  '& .MuiSlider-thumb': {
                    width: 18,
                    height: 18,
                    backgroundColor: theme.palette.primary.main,
                    border: '3px solid white',
                    boxShadow: `0 0 10px ${theme.palette.primary.main}40`,
                    '&:hover': {
                      boxShadow: `0 0 15px ${theme.palette.primary.main}60`,
                    },
                  },
                  '& .MuiSlider-track': {
                    height: 8,
                    borderRadius: '8px',
                  },
                  '& .MuiSlider-rail': {
                    height: 8,
                    borderRadius: '8px',
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb',
                  },
                }}
              />
            </Box>

            {/* Alert Preview */}
            <Box
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f9fafb',
                p: 3,
                borderRadius: '12px',
                border: `1px dashed ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb'}`,
              }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontSize: '0.625rem',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: theme.palette.text.secondary,
                  mb: 2,
                  display: 'block',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Alert Preview
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Chip
                    label="Budget Used"
                    size="small"
                    sx={{
                      backgroundColor: `${theme.palette.primary.main}1A`,
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      fontSize: '0.625rem',
                      textTransform: 'uppercase',
                      height: '20px',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: theme.palette.primary.main,
                      fontSize: '0.75rem',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {previewPercentage}%
                  </Typography>
                </Box>
                <Box
                  sx={{
                    height: 12,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : '#e5e7eb',
                    borderRadius: '999px',
                    overflow: 'hidden',
                    position: 'relative',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      height: '100%',
                      width: `${previewPercentage}%`,
                      backgroundColor: theme.palette.primary.main,
                      borderRadius: '999px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 0.5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box
                      sx={{
                        height: 6,
                        width: '1px',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#cbd5e1',
                        mb: 0.5,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.625rem',
                        color: theme.palette.text.secondary,
                        textTransform: 'uppercase',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Warning ({formData.alert_thresholds.warning}%)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Box
                      sx={{
                        height: 6,
                        width: '1px',
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#cbd5e1',
                        mb: 0.5,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.625rem',
                        color: theme.palette.text.secondary,
                        textTransform: 'uppercase',
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Critical ({formData.alert_thresholds.critical}%)
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          px: 4,
          py: 3,
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#f9fafb',
          borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            px: 3,
            py: 1,
            color: theme.palette.text.secondary,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            px: 4,
            py: 1.25,
            backgroundColor: theme.palette.primary.main,
            color: 'white',
            fontWeight: 700,
            borderRadius: '8px',
            boxShadow: `0 4px 14px 0 ${theme.palette.primary.main}33`,
            fontFamily: "'Inter', sans-serif",
            '&:hover': {
              backgroundColor: theme.palette.primary.dark,
              boxShadow: `0 6px 20px 0 ${theme.palette.primary.main}40`,
            },
            '&:active': {
              transform: 'scale(0.98)',
            },
            '&:disabled': {
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            },
          }}
        >
          {loading ? 'Creating...' : budget ? 'Update Budget' : 'Create Budget'}
        </Button>
      </Box>
    </Dialog>
  );
}

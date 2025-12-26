import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Avatar,
  AvatarGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Savings as SavingsIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { SavingsGoal } from '../../types/financial';

// Dummy data
const dummySavingsGoals: SavingsGoal[] = [
  {
    _id: '1',
    user_id: 'user1',
    name: 'Emergency Fund',
    description: 'Build a 6-month emergency fund',
    target_amount: 15000,
    current_amount: 8500,
    currency: 'USD',
    deadline: '2024-12-31',
    category: 'Emergency',
    is_shared: true,
    contributors: [
      { user_id: 'user1', name: 'John Doe', contribution_amount: 5000, contribution_percentage: 58.8 },
      { user_id: 'user2', name: 'Jane Smith', contribution_amount: 3500, contribution_percentage: 41.2 },
    ],
    auto_save_rules: {
      enabled: true,
      frequency: 'monthly',
      amount: 500,
      per_user: true,
    },
    status: 'active',
    created_at: '2024-01-01',
    updated_at: '2024-01-28',
  },
  {
    _id: '2',
    user_id: 'user1',
    name: 'Vacation Fund',
    description: 'Save for summer vacation to Europe',
    target_amount: 5000,
    current_amount: 3200,
    currency: 'USD',
    deadline: '2024-06-01',
    category: 'Travel',
    is_shared: true,
    contributors: [
      { user_id: 'user1', name: 'John Doe', contribution_amount: 1800, contribution_percentage: 56.3 },
      { user_id: 'user2', name: 'Jane Smith', contribution_amount: 1400, contribution_percentage: 43.7 },
    ],
    auto_save_rules: {
      enabled: true,
      frequency: 'weekly',
      amount: 100,
      per_user: true,
    },
    status: 'active',
    created_at: '2024-01-01',
    updated_at: '2024-01-28',
  },
  {
    _id: '3',
    user_id: 'user1',
    name: 'New Car',
    description: 'Down payment for a new car',
    target_amount: 10000,
    current_amount: 10000,
    currency: 'USD',
    category: 'Vehicle',
    is_shared: false,
    contributors: [
      { user_id: 'user1', name: 'John Doe', contribution_amount: 10000, contribution_percentage: 100 },
    ],
    status: 'completed',
    created_at: '2023-06-01',
    updated_at: '2024-01-15',
    completed_at: '2024-01-15',
  },
];

export default function SavingsSection() {
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(dummySavingsGoals);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    target_amount: '',
    deadline: '',
    category: '',
    is_shared: false,
    auto_save_enabled: false,
    auto_save_frequency: 'monthly' as 'daily' | 'weekly' | 'monthly',
    auto_save_amount: '',
  });

  const handleOpenDialog = (goal?: SavingsGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormData({
        name: goal.name,
        description: goal.description || '',
        target_amount: goal.target_amount.toString(),
        deadline: goal.deadline?.split('T')[0] || '',
        category: goal.category || '',
        is_shared: goal.is_shared,
        auto_save_enabled: goal.auto_save_rules?.enabled || false,
        auto_save_frequency: goal.auto_save_rules?.frequency || 'monthly',
        auto_save_amount: goal.auto_save_rules?.amount?.toString() || '',
      });
    } else {
      setEditingGoal(null);
      setFormData({
        name: '',
        description: '',
        target_amount: '',
        deadline: '',
        category: '',
        is_shared: false,
        auto_save_enabled: false,
        auto_save_frequency: 'monthly',
        auto_save_amount: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingGoal(null);
  };

  const handleSave = () => {
    if (editingGoal) {
      setSavingsGoals(savingsGoals.map(g =>
        g._id === editingGoal._id
          ? {
              ...g,
              name: formData.name,
              description: formData.description,
              target_amount: parseFloat(formData.target_amount),
              deadline: formData.deadline || undefined,
              category: formData.category,
              is_shared: formData.is_shared,
              auto_save_rules: formData.auto_save_enabled ? {
                enabled: true,
                frequency: formData.auto_save_frequency,
                amount: parseFloat(formData.auto_save_amount),
                per_user: formData.is_shared,
              } : undefined,
              updated_at: new Date().toISOString(),
            }
          : g
      ));
    } else {
      const newGoal: SavingsGoal = {
        _id: Date.now().toString(),
        user_id: 'user1',
        name: formData.name,
        description: formData.description,
        target_amount: parseFloat(formData.target_amount),
        current_amount: 0,
        currency: 'USD',
        deadline: formData.deadline || undefined,
        category: formData.category,
        is_shared: formData.is_shared,
        contributors: [
          { user_id: 'user1', name: 'John Doe', contribution_amount: 0, contribution_percentage: 100 },
        ],
        auto_save_rules: formData.auto_save_enabled ? {
          enabled: true,
          frequency: formData.auto_save_frequency,
          amount: parseFloat(formData.auto_save_amount),
          per_user: formData.is_shared,
        } : undefined,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setSavingsGoals([...savingsGoals, newGoal]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setSavingsGoals(savingsGoals.filter(g => g._id !== id));
  };

  const activeGoals = savingsGoals.filter(g => g.status === 'active');
  const completedGoals = savingsGoals.filter(g => g.status === 'completed');
  const totalSaved = savingsGoals.reduce((sum, g) => sum + g.current_amount, 0);
  const totalTarget = activeGoals.reduce((sum, g) => sum + g.target_amount, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Savings Goals
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: '12px', textTransform: 'none' }}
        >
          Add Savings Goal
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SavingsIcon color="primary" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Total Saved
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                ${totalSaved.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon color="success" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Target Amount
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ${totalTarget.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SavingsIcon color="info" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Active Goals
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {activeGoals.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CheckCircleIcon color="success" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Completed
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                {completedGoals.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Goals */}
      {activeGoals.length > 0 && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Active Goals
          </Typography>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {activeGoals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              const daysRemaining = goal.deadline
                ? Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null;

              return (
                <Grid item xs={12} md={6} key={goal._id}>
                  <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                            {goal.name}
                          </Typography>
                          {goal.description && (
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {goal.description}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {goal.category && (
                              <Chip label={goal.category} size="small" sx={{ borderRadius: '8px' }} />
                            )}
                            {goal.is_shared && (
                              <Chip label="Shared" size="small" color="primary" sx={{ borderRadius: '8px' }} />
                            )}
                            {goal.auto_save_rules?.enabled && (
                              <Chip label="Auto-Save" size="small" color="success" sx={{ borderRadius: '8px' }} />
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => handleOpenDialog(goal)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(goal._id)} color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">
                            Progress
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            ${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={Math.min(progress, 100)}
                          sx={{
                            height: 10,
                            borderRadius: '5px',
                            backgroundColor: 'rgba(0,0,0,0.1)',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: progress >= 100 ? 'success.main' : 'primary.main',
                            },
                          }}
                        />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {progress.toFixed(1)}% Complete
                          </Typography>
                          {daysRemaining !== null && (
                            <Typography variant="caption" color="text.secondary">
                              {daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {goal.is_shared && goal.contributors.length > 0 && (
                        <Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Contributors:
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.875rem' } }}>
                              {goal.contributors.map((contributor) => (
                                <Avatar key={contributor.user_id} sx={{ bgcolor: 'primary.main' }}>
                                  {contributor.name.split(' ').map(n => n[0]).join('')}
                                </Avatar>
                              ))}
                            </AvatarGroup>
                            <Box sx={{ flex: 1 }}>
                              {goal.contributors.map((contributor) => (
                                <Box key={contributor.user_id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="caption" color="text.secondary">
                                    {contributor.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                    ${contributor.contribution_amount.toFixed(2)} ({contributor.contribution_percentage.toFixed(1)}%)
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        </>
      )}

      {/* Completed Goals */}
      {completedGoals.length > 0 && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Completed Goals
          </Typography>
          <Grid container spacing={2}>
            {completedGoals.map((goal) => (
              <Grid item xs={12} md={6} key={goal._id}>
                <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'success.main', opacity: 0.8 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 40 }} />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {goal.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Completed on {goal.completed_at ? new Date(goal.completed_at).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                      ${goal.current_amount.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingGoal ? 'Edit Savings Goal' : 'Add Savings Goal'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Goal Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <TextField
              label="Target Amount"
              type="number"
              value={formData.target_amount}
              onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              fullWidth
              required
              InputProps={{ startAdornment: '$' }}
            />

            <TextField
              label="Deadline (Optional)"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              fullWidth
              placeholder="e.g., Emergency, Travel, Vehicle"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_shared}
                  onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                />
              }
              label="Shared Goal (Family members can contribute)"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.auto_save_enabled}
                  onChange={(e) => setFormData({ ...formData, auto_save_enabled: e.target.checked })}
                />
              }
              label="Enable Auto-Save"
            />

            {formData.auto_save_enabled && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Auto-Save Frequency</InputLabel>
                  <Select
                    value={formData.auto_save_frequency}
                    label="Auto-Save Frequency"
                    onChange={(e) => setFormData({ ...formData, auto_save_frequency: e.target.value as any })}
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Auto-Save Amount"
                  type="number"
                  value={formData.auto_save_amount}
                  onChange={(e) => setFormData({ ...formData, auto_save_amount: e.target.value })}
                  fullWidth
                  required={formData.auto_save_enabled}
                  InputProps={{ startAdornment: '$' }}
                />
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: '12px', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={!formData.name || !formData.target_amount}
            sx={{ borderRadius: '12px', textTransform: 'none' }}
          >
            {editingGoal ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

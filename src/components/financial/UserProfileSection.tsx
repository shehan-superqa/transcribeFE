import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Chip,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import {
  Person,
  Add,
  Delete,
  Edit,
  Savings,
  School,
  HealthAndSafety,
  Elderly,
  CheckCircle,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { generateDummyUserProfile, DummyUserProfile } from '../../lib/dummyData';

interface FamilyMember {
  name: string;
  relationship: string;
  age: number;
}

interface FutureExpensePrediction {
  id: string;
  type: 'education' | 'retirement' | 'healthcare' | 'wedding';
  person: string;
  yearsAway: number;
  estimatedCost: number;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

export default function UserProfileSection() {
  const { theme } = useTheme();
  const [profile, setProfile] = useState<DummyUserProfile>(generateDummyUserProfile());
  const [editMode, setEditMode] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [newMember, setNewMember] = useState<FamilyMember>({ name: '', relationship: '', age: 0 });
  const [predictions, setPredictions] = useState<FutureExpensePrediction[]>([]);

  useEffect(() => {
    // Load profile from localStorage if exists
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  useEffect(() => {
    // Generate predictions based on profile
    generatePredictions();
  }, [profile]);

  const saveProfile = () => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setEditMode(false);
  };

  const generatePredictions = () => {
    const newPredictions: FutureExpensePrediction[] = [];

    // Education predictions for children
    profile.familyMembers
      .filter(m => (m.relationship === 'Son' || m.relationship === 'Daughter') && m.age < 25)
      .forEach(child => {
        // Primary/Secondary Education
        if (child.age < 18) {
          const yearsUntilSchool = Math.max(0, 18 - child.age);
          newPredictions.push({
            id: `edu-school-${child.name}`,
            type: 'education',
            person: child.name,
            yearsAway: yearsUntilSchool,
            estimatedCost: 500000 * yearsUntilSchool,
            description: `School education expenses for ${child.name} (${yearsUntilSchool} years)`,
            priority: 'high',
          });
        }

        // University Education
        if (child.age < 22) {
          const yearsUntilUniversity = Math.max(0, 18 - child.age);
          newPredictions.push({
            id: `edu-uni-${child.name}`,
            type: 'education',
            person: child.name,
            yearsAway: yearsUntilUniversity,
            estimatedCost: 2500000,
            description: `University education for ${child.name}`,
            priority: yearsUntilUniversity <= 5 ? 'high' : 'medium',
          });
        }

        // Wedding expenses
        if (child.age >= 18 && child.age < 35) {
          const estimatedYearsToWedding = 25 - child.age;
          if (estimatedYearsToWedding > 0) {
            newPredictions.push({
              id: `wedding-${child.name}`,
              type: 'wedding',
              person: child.name,
              yearsAway: estimatedYearsToWedding,
              estimatedCost: 1500000,
              description: `Wedding expenses for ${child.name}`,
              priority: estimatedYearsToWedding <= 3 ? 'high' : 'medium',
            });
          }
        }
      });

    // Retirement support for parents
    profile.familyMembers
      .filter(m => (m.relationship === 'Father' || m.relationship === 'Mother') && m.age >= 55)
      .forEach(parent => {
        const yearsUntilRetirement = Math.max(0, 65 - parent.age);
        const yearsOfSupport = 20; // Assume 20 years of retirement support
        const monthlySupport = 30000;
        const totalCost = monthlySupport * 12 * yearsOfSupport;

        newPredictions.push({
          id: `retirement-${parent.name}`,
          type: 'retirement',
          person: parent.name,
          yearsAway: yearsUntilRetirement,
          estimatedCost: totalCost,
          description: `Retirement support for ${parent.name} (Rs. ${monthlySupport.toLocaleString()}/month for ${yearsOfSupport} years)`,
          priority: yearsUntilRetirement <= 5 ? 'high' : 'medium',
        });
      });

    // Healthcare predictions for elderly
    profile.familyMembers
      .filter(m => m.age >= 60)
      .forEach(member => {
        newPredictions.push({
          id: `healthcare-${member.name}`,
          type: 'healthcare',
          person: member.name,
          yearsAway: 0,
          estimatedCost: 500000,
          description: `Healthcare fund for ${member.name} (ongoing)`,
          priority: 'high',
        });
      });

    setPredictions(newPredictions.sort((a, b) => {
      // Sort by priority and years away
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return a.yearsAway - b.yearsAway;
    }));
  };

  const handleAddMember = () => {
    if (!newMember.name || !newMember.relationship || newMember.age <= 0) return;

    setProfile({
      ...profile,
      familyMembers: [...profile.familyMembers, newMember],
    });
    setNewMember({ name: '', relationship: '', age: 0 });
    setShowAddMemberDialog(false);
  };

  const handleRemoveMember = (index: number) => {
    setProfile({
      ...profile,
      familyMembers: profile.familyMembers.filter((_, i) => i !== index),
    });
  };

  const handleAddToSavings = (prediction: FutureExpensePrediction) => {
    // This would integrate with the savings goals system
    alert(`Adding "${prediction.description}" to savings goals with target amount Rs. ${prediction.estimatedCost.toLocaleString()}`);
    // In a real implementation, this would call the savings API
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'education':
        return <School />;
      case 'retirement':
        return <Elderly />;
      case 'healthcare':
        return <HealthAndSafety />;
      default:
        return <Savings />;
    }
  };

  const profileCompleteness = () => {
    let score = 0;
    if (profile.name) score += 20;
    if (profile.age > 0) score += 20;
    if (profile.occupation) score += 20;
    if (profile.monthlyIncome > 0) score += 20;
    if (profile.familyMembers.length > 0) score += 20;
    return score;
  };

  const completeness = profileCompleteness();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Person sx={{ fontSize: 40, color: theme.palette.primary.main }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
              User Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your personal information for AI-powered financial predictions
            </Typography>
          </Box>
          <Button
            variant={editMode ? 'contained' : 'outlined'}
            onClick={() => editMode ? saveProfile() : setEditMode(true)}
          >
            {editMode ? 'Save Profile' : 'Edit Profile'}
          </Button>
        </Box>

        {/* Profile Completeness */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Profile Completeness
            </Typography>
            <Typography variant="body2" fontWeight={600}>
              {completeness}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={completeness}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Personal Information */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Full Name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              disabled={!editMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={profile.age}
              onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) || 0 })}
              disabled={!editMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Occupation"
              value={profile.occupation}
              onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
              disabled={!editMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Monthly Income"
              type="number"
              value={profile.monthlyIncome}
              onChange={(e) => setProfile({ ...profile, monthlyIncome: parseInt(e.target.value) || 0 })}
              disabled={!editMode}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>Rs.</Typography>,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Family Members */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Family Members
          </Typography>
          {editMode && (
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setShowAddMemberDialog(true)}
              size="small"
            >
              Add Member
            </Button>
          )}
        </Box>

        {profile.familyMembers.length === 0 ? (
          <Alert severity="info">
            Add family members to get personalized financial predictions for education, retirement, and healthcare.
          </Alert>
        ) : (
          <List>
            {profile.familyMembers.map((member, index) => (
              <ListItem key={index} divider={index < profile.familyMembers.length - 1}>
                <ListItemText
                  primary={member.name}
                  secondary={`${member.relationship} • ${member.age} years old`}
                />
                {editMode && (
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleRemoveMember(index)} color="error">
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Future Expense Predictions */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
          AI-Powered Future Expense Predictions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Based on your family profile, here are predicted future expenses you should plan for:
        </Typography>

        {predictions.length === 0 ? (
          <Alert severity="info">
            Add family members to see personalized expense predictions.
          </Alert>
        ) : (
          <Grid container spacing={2}>
            {predictions.map((prediction) => (
              <Grid item xs={12} md={6} key={prediction.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                        }}
                      >
                        {getTypeIcon(prediction.type)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                          {prediction.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                          <Chip
                            label={prediction.priority.toUpperCase()}
                            size="small"
                            color={getPriorityColor(prediction.priority)}
                          />
                          <Chip
                            label={prediction.yearsAway === 0 ? 'Ongoing' : `${prediction.yearsAway} years away`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Estimated Cost
                        </Typography>
                        <Typography variant="h6" color="primary" fontWeight={700}>
                          Rs. {prediction.estimatedCost.toLocaleString()}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<Savings />}
                        onClick={() => handleAddToSavings(prediction)}
                        sx={{ textTransform: 'none' }}
                      >
                        Add to Savings
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onClose={() => setShowAddMemberDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Family Member</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Relationship"
              select
              SelectProps={{ native: true }}
              value={newMember.relationship}
              onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
            >
              <option value="">Select...</option>
              <option value="Spouse">Spouse</option>
              <option value="Son">Son</option>
              <option value="Daughter">Daughter</option>
              <option value="Father">Father</option>
              <option value="Mother">Mother</option>
              <option value="Brother">Brother</option>
              <option value="Sister">Sister</option>
              <option value="Other">Other</option>
            </TextField>
            <TextField
              fullWidth
              label="Age"
              type="number"
              value={newMember.age || ''}
              onChange={(e) => setNewMember({ ...newMember, age: parseInt(e.target.value) || 0 })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddMemberDialog(false)}>Cancel</Button>
          <Button
            onClick={handleAddMember}
            variant="contained"
            disabled={!newMember.name || !newMember.relationship || newMember.age <= 0}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

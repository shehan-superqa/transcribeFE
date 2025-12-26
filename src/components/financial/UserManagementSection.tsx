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
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Avatar,
  Alert,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
} from '@mui/icons-material';
import { FamilyMember } from '../../types/financial';

// Dummy data
const dummyFamilyMembers: FamilyMember[] = [
  {
    _id: '1',
    user_id: 'user1',
    family_group_id: 'family1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'owner',
    joined_at: '2024-01-01',
    status: 'active',
  },
  {
    _id: '2',
    user_id: 'user2',
    family_group_id: 'family1',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'admin',
    joined_at: '2024-01-05',
    status: 'active',
  },
  {
    _id: '3',
    user_id: 'user3',
    family_group_id: 'family1',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'member',
    joined_at: '2024-01-10',
    status: 'active',
  },
  {
    _id: '4',
    user_id: 'user4',
    family_group_id: 'family1',
    name: 'Alice Williams',
    email: 'alice@example.com',
    role: 'member',
    joined_at: '2024-01-15',
    status: 'invited',
  },
];

export default function UserManagementSection() {
  const [members, setMembers] = useState<FamilyMember[]>(dummyFamilyMembers);
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    name: '',
    role: 'member' as 'admin' | 'member',
  });

  const handleOpenInviteDialog = () => {
    setInviteData({
      email: '',
      name: '',
      role: 'member',
    });
    setOpenInviteDialog(true);
  };

  const handleCloseInviteDialog = () => {
    setOpenInviteDialog(false);
  };

  const handleSendInvite = () => {
    const newMember: FamilyMember = {
      _id: Date.now().toString(),
      user_id: `user${Date.now()}`,
      family_group_id: 'family1',
      name: inviteData.name,
      email: inviteData.email,
      role: inviteData.role,
      joined_at: new Date().toISOString(),
      status: 'invited',
    };
    setMembers([...members, newMember]);
    handleCloseInviteDialog();
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter(m => m._id !== id));
  };

  const handleResendInvite = (member: FamilyMember) => {
    console.log('Resending invite to:', member.email);
    // In a real app, this would trigger an API call
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'error';
      case 'admin':
        return 'warning';
      default:
        return 'default';
    }
  };

  const activeMembers = members.filter(m => m.status === 'active');
  const invitedMembers = members.filter(m => m.status === 'invited');

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenInviteDialog}
          sx={{ borderRadius: '12px', textTransform: 'none' }}
        >
          Invite Member
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3, borderRadius: '12px' }}>
        <Typography variant="body2">
          Invite family members to collaborate on finances. Each member can track their own transactions and contribute to shared goals.
        </Typography>
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Total Members
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                {members.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Active Members
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {activeMembers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                Pending Invites
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {invitedMembers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Members */}
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Active Members
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {activeMembers.map((member) => (
          <Grid item xs={12} md={6} key={member._id}>
            <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: 'primary.main',
                      fontSize: '1.25rem',
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(member.name)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {member.name}
                      </Typography>
                      <Chip
                        label={member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        size="small"
                        color={getRoleColor(member.role) as any}
                        sx={{ borderRadius: '8px' }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EmailIcon fontSize="small" />
                      {member.email}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  {member.role !== 'owner' && (
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveMember(member._id)}
                      sx={{ border: '1px solid', borderColor: 'error.main' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pending Invites */}
      {invitedMembers.length > 0 && (
        <>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Pending Invites
          </Typography>
          <Grid container spacing={2}>
            {invitedMembers.map((member) => (
              <Grid item xs={12} md={6} key={member._id}>
                <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'warning.main', opacity: 0.8 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 56,
                          height: 56,
                          bgcolor: 'warning.main',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                        }}
                      >
                        <PendingIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            {member.name}
                          </Typography>
                          <Chip
                            label="Invited"
                            size="small"
                            color="warning"
                            sx={{ borderRadius: '8px' }}
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <EmailIcon fontSize="small" />
                          {member.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Invited {new Date(member.joined_at).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleResendInvite(member)}
                          sx={{ borderRadius: '8px', textTransform: 'none' }}
                        >
                          Resend
                        </Button>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={() => handleRemoveMember(member._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Invite Dialog */}
      <Dialog
        open={openInviteDialog}
        onClose={handleCloseInviteDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Invite Family Member
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: '12px' }}>
              <Typography variant="body2">
                Send an invitation to a family member. They'll receive an email with instructions to join your financial group.
              </Typography>
            </Alert>

            <TextField
              label="Email Address"
              type="email"
              value={inviteData.email}
              onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
              fullWidth
              required
              placeholder="member@example.com"
            />

            <TextField
              label="Name"
              value={inviteData.name}
              onChange={(e) => setInviteData({ ...inviteData, name: e.target.value })}
              fullWidth
              required
              placeholder="John Doe"
            />

            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={inviteData.role}
                label="Role"
                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value as 'admin' | 'member' })}
              >
                <MenuItem value="member">
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Member
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Can view and add their own transactions
                    </Typography>
                  </Box>
                </MenuItem>
                <MenuItem value="admin">
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Admin
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Can manage all transactions and invite members
                    </Typography>
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseInviteDialog} sx={{ borderRadius: '12px', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSendInvite}
            variant="contained"
            disabled={!inviteData.email || !inviteData.name}
            startIcon={<CheckCircleIcon />}
            sx={{ borderRadius: '12px', textTransform: 'none' }}
          >
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

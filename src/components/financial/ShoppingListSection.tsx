import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tab,
  Tabs,
  Alert,
  Divider,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  ShoppingCart,
  CheckCircle,
  LocalGroceryStore,
  Home,
  Build,
  MoreHoriz,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

interface ShoppingItem {
  id: string;
  name: string;
  quantity?: string;
  notes?: string;
  purchased: boolean;
  addedDate: Date;
}

interface ShoppingList {
  id: string;
  name: string;
  icon: string;
  items: ShoppingItem[];
  createdDate: Date;
}

const listTemplates = [
  { name: 'Groceries', icon: 'grocery' },
  { name: 'Household', icon: 'home' },
  { name: 'Hardware', icon: 'build' },
  { name: 'Other', icon: 'more' },
];

const getListIcon = (iconName: string) => {
  switch (iconName) {
    case 'grocery':
      return <LocalGroceryStore />;
    case 'home':
      return <Home />;
    case 'build':
      return <Build />;
    default:
      return <MoreHoriz />;
  }
};

export default function ShoppingListSection() {
  const { theme } = useTheme();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeListIndex, setActiveListIndex] = useState(0);
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [showAddItemDialog, setShowAddItemDialog] = useState(false);
  const [showEditItemDialog, setShowEditItemDialog] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('grocery');
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);

  // Load lists from localStorage on mount
  useEffect(() => {
    const savedLists = localStorage.getItem('shoppingLists');
    if (savedLists) {
      const parsed = JSON.parse(savedLists);
      // Convert date strings back to Date objects
      const listsWithDates = parsed.map((list: any) => ({
        ...list,
        createdDate: new Date(list.createdDate),
        items: list.items.map((item: any) => ({
          ...item,
          addedDate: new Date(item.addedDate),
        })),
      }));
      setLists(listsWithDates);
    } else {
      // Create default grocery list
      const defaultList: ShoppingList = {
        id: 'list-1',
        name: 'Groceries',
        icon: 'grocery',
        items: [],
        createdDate: new Date(),
      };
      setLists([defaultList]);
    }
  }, []);

  // Save lists to localStorage whenever they change
  useEffect(() => {
    if (lists.length > 0) {
      localStorage.setItem('shoppingLists', JSON.stringify(lists));
    }
  }, [lists]);

  const handleCreateList = () => {
    if (!newListName.trim()) return;

    const newList: ShoppingList = {
      id: `list-${Date.now()}`,
      name: newListName,
      icon: selectedIcon,
      items: [],
      createdDate: new Date(),
    };

    setLists([...lists, newList]);
    setActiveListIndex(lists.length);
    setNewListName('');
    setSelectedIcon('grocery');
    setShowNewListDialog(false);
  };

  const handleDeleteList = (listId: string) => {
    const newLists = lists.filter(l => l.id !== listId);
    setLists(newLists);
    if (activeListIndex >= newLists.length) {
      setActiveListIndex(Math.max(0, newLists.length - 1));
    }
  };

  const handleAddItem = () => {
    if (!newItemName.trim()) return;

    const newItem: ShoppingItem = {
      id: `item-${Date.now()}`,
      name: newItemName,
      quantity: newItemQuantity || undefined,
      notes: newItemNotes || undefined,
      purchased: false,
      addedDate: new Date(),
    };

    const updatedLists = [...lists];
    updatedLists[activeListIndex].items.push(newItem);
    setLists(updatedLists);

    setNewItemName('');
    setNewItemQuantity('');
    setNewItemNotes('');
    setShowAddItemDialog(false);
  };

  const handleEditItem = () => {
    if (!editingItem || !newItemName.trim()) return;

    const updatedLists = [...lists];
    const itemIndex = updatedLists[activeListIndex].items.findIndex(i => i.id === editingItem.id);
    
    if (itemIndex !== -1) {
      updatedLists[activeListIndex].items[itemIndex] = {
        ...editingItem,
        name: newItemName,
        quantity: newItemQuantity || undefined,
        notes: newItemNotes || undefined,
      };
      setLists(updatedLists);
    }

    setEditingItem(null);
    setNewItemName('');
    setNewItemQuantity('');
    setNewItemNotes('');
    setShowEditItemDialog(false);
  };

  const handleToggleItem = (itemId: string) => {
    const updatedLists = [...lists];
    const item = updatedLists[activeListIndex].items.find(i => i.id === itemId);
    if (item) {
      item.purchased = !item.purchased;
      setLists(updatedLists);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedLists = [...lists];
    updatedLists[activeListIndex].items = updatedLists[activeListIndex].items.filter(i => i.id !== itemId);
    setLists(updatedLists);
  };

  const handleClearPurchased = () => {
    const updatedLists = [...lists];
    updatedLists[activeListIndex].items = updatedLists[activeListIndex].items.filter(i => !i.purchased);
    setLists(updatedLists);
  };

  const openEditDialog = (item: ShoppingItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemQuantity(item.quantity || '');
    setNewItemNotes(item.notes || '');
    setShowEditItemDialog(true);
  };

  const activeList = lists[activeListIndex];
  const pendingItems = activeList?.items.filter(i => !i.purchased) || [];
  const purchasedItems = activeList?.items.filter(i => i.purchased) || [];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              Shopping Lists
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Inter', sans-serif",
                color: theme.palette.text.secondary,
              }}
            >
              Manage your shopping lists. These do not affect your financial calculations.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setShowNewListDialog(true)}
            sx={{
              textTransform: 'none',
              borderRadius: '8px',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            New List
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Shopping lists are for planning purposes only and won't be included in your financial reports or budgets.
          </Typography>
        </Alert>

        {lists.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <ShoppingCart sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Shopping Lists Yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Create your first shopping list to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowNewListDialog(true)}
              sx={{ textTransform: 'none' }}
            >
              Create List
            </Button>
          </Box>
        ) : (
          <>
            {/* List Tabs */}
            <Tabs
              value={activeListIndex}
              onChange={(_, newValue) => setActiveListIndex(newValue)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                mb: 3,
                borderBottom: `1px solid ${theme.palette.divider}`,
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                },
              }}
            >
              {lists.map((list, index) => (
                <Tab
                  key={list.id}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getListIcon(list.icon)}
                      <span>{list.name}</span>
                      <Chip
                        label={list.items.filter(i => !i.purchased).length}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </Box>
                  }
                />
              ))}
            </Tabs>

            {/* Active List Content */}
            {activeList && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                      {activeList.name}
                    </Typography>
                    <Chip
                      label={`${pendingItems.length} pending`}
                      size="small"
                      color="primary"
                    />
                    {purchasedItems.length > 0 && (
                      <Chip
                        label={`${purchasedItems.length} purchased`}
                        size="small"
                        color="success"
                      />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {purchasedItems.length > 0 && (
                      <Button
                        size="small"
                        onClick={handleClearPurchased}
                        sx={{ textTransform: 'none' }}
                      >
                        Clear Purchased
                      </Button>
                    )}
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => setShowAddItemDialog(true)}
                      sx={{ textTransform: 'none' }}
                    >
                      Add Item
                    </Button>
                    {lists.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteList(activeList.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Box>
                </Box>

                {activeList.items.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4, border: `2px dashed ${theme.palette.divider}`, borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      No items in this list yet
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<Add />}
                      onClick={() => setShowAddItemDialog(true)}
                      sx={{ textTransform: 'none', mt: 1 }}
                    >
                      Add First Item
                    </Button>
                  </Box>
                ) : (
                  <>
                    {/* Pending Items */}
                    {pendingItems.length > 0 && (
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                          To Buy
                        </Typography>
                        <List sx={{ bgcolor: theme.palette.background.default, borderRadius: 2 }}>
                          {pendingItems.map((item, index) => (
                            <Box key={item.id}>
                              <ListItem
                                sx={{
                                  '&:hover': {
                                    bgcolor: theme.palette.action.hover,
                                  },
                                }}
                              >
                                <Checkbox
                                  checked={item.purchased}
                                  onChange={() => handleToggleItem(item.id)}
                                  sx={{ mr: 1 }}
                                />
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {item.name}
                                      </Typography>
                                      {item.quantity && (
                                        <Chip label={item.quantity} size="small" variant="outlined" />
                                      )}
                                    </Box>
                                  }
                                  secondary={item.notes}
                                />
                                <ListItemSecondaryAction>
                                  <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => openEditDialog(item)}
                                    sx={{ mr: 1 }}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => handleDeleteItem(item.id)}
                                    color="error"
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                              {index < pendingItems.length - 1 && <Divider />}
                            </Box>
                          ))}
                        </List>
                      </Box>
                    )}

                    {/* Purchased Items */}
                    {purchasedItems.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                          Purchased
                        </Typography>
                        <List sx={{ bgcolor: theme.palette.background.default, borderRadius: 2 }}>
                          {purchasedItems.map((item, index) => (
                            <Box key={item.id}>
                              <ListItem
                                sx={{
                                  opacity: 0.6,
                                  '&:hover': {
                                    bgcolor: theme.palette.action.hover,
                                  },
                                }}
                              >
                                <Checkbox
                                  checked={item.purchased}
                                  onChange={() => handleToggleItem(item.id)}
                                  sx={{ mr: 1 }}
                                />
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          fontWeight: 500,
                                          textDecoration: 'line-through',
                                        }}
                                      >
                                        {item.name}
                                      </Typography>
                                      {item.quantity && (
                                        <Chip label={item.quantity} size="small" variant="outlined" />
                                      )}
                                      <CheckCircle fontSize="small" color="success" />
                                    </Box>
                                  }
                                  secondary={item.notes}
                                />
                                <ListItemSecondaryAction>
                                  <IconButton
                                    edge="end"
                                    size="small"
                                    onClick={() => handleDeleteItem(item.id)}
                                    color="error"
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                              {index < purchasedItems.length - 1 && <Divider />}
                            </Box>
                          ))}
                        </List>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* New List Dialog */}
      <Dialog open={showNewListDialog} onClose={() => setShowNewListDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Shopping List</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="List Name"
            fullWidth
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Typography variant="subtitle2" gutterBottom>
            Choose an icon:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {listTemplates.map((template) => (
              <Button
                key={template.icon}
                variant={selectedIcon === template.icon ? 'contained' : 'outlined'}
                onClick={() => setSelectedIcon(template.icon)}
                sx={{ flex: 1, flexDirection: 'column', py: 2 }}
              >
                {getListIcon(template.icon)}
                <Typography variant="caption" sx={{ mt: 0.5 }}>
                  {template.name}
                </Typography>
              </Button>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewListDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateList} variant="contained" disabled={!newListName.trim()}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={showAddItemDialog} onClose={() => setShowAddItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            fullWidth
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Quantity (optional)"
            fullWidth
            value={newItemQuantity}
            onChange={(e) => setNewItemQuantity(e.target.value)}
            placeholder="e.g., 2kg, 1 bottle, 3 pcs"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Notes (optional)"
            fullWidth
            multiline
            rows={2}
            value={newItemNotes}
            onChange={(e) => setNewItemNotes(e.target.value)}
            placeholder="Any additional notes..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddItemDialog(false)}>Cancel</Button>
          <Button onClick={handleAddItem} variant="contained" disabled={!newItemName.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={showEditItemDialog} onClose={() => setShowEditItemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Item Name"
            fullWidth
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Quantity (optional)"
            fullWidth
            value={newItemQuantity}
            onChange={(e) => setNewItemQuantity(e.target.value)}
            placeholder="e.g., 2kg, 1 bottle, 3 pcs"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Notes (optional)"
            fullWidth
            multiline
            rows={2}
            value={newItemNotes}
            onChange={(e) => setNewItemNotes(e.target.value)}
            placeholder="Any additional notes..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEditItemDialog(false)}>Cancel</Button>
          <Button onClick={handleEditItem} variant="contained" disabled={!newItemName.trim()}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

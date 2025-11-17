/**
 * Batch processing tab component
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';

export default function BatchTab() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#e0e0e0', mb: 3 }}>
        Batch Processing
      </Typography>
      <Paper sx={{ p: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Batch Processing
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<FolderIcon />} 
          sx={{ 
            mb: 2,
            backgroundColor: '#00c6ff',
            color: '#121212',
            '&:hover': { backgroundColor: '#00b0e6' },
          }}
        >
          Select Files
        </Button>
        {files.length > 0 && (
          <List>
            {files.map((file, index) => (
              <ListItem 
                key={index}
                sx={{
                  backgroundColor: '#121212',
                  border: '1px solid #333333',
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemText 
                  primary={<Typography sx={{ color: '#e0e0e0' }}>{file.name}</Typography>} 
                  secondary={<Typography sx={{ color: '#a0a0a0' }}>{`${(file.size / (1024 * 1024)).toFixed(2)} MB`}</Typography>} 
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}


/**
 * File uploader component with drag-and-drop
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  useTheme,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { validateFile, formatFileSize, type FileValidationResult } from '../../../utils/fileValidation';
import './FileUploader.css';

export interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  disabled?: boolean;
  currentFile?: File | null;
}

export default function FileUploader({
  onFileSelect,
  acceptedTypes,
  maxSize,
  disabled = false,
  currentFile,
}: FileUploaderProps) {
  const theme = useTheme();
  const [validationError, setValidationError] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const validation: FileValidationResult = validateFile(file, maxSize);

      if (!validation.valid) {
        setValidationError(validation.error || 'Invalid file');
        return;
      }

      setValidationError(null);
      onFileSelect(file);
    },
    [onFileSelect, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes
      ? Object.fromEntries(acceptedTypes.map((ext) => [`.${ext}`, []]))
      : undefined,
    disabled,
    multiple: false,
  });

  return (
    <Box>
      <Paper
        {...getRootProps()}
        className={`file-uploader ${isDragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}
        sx={{
          p: 4,
          border: 2,
          borderStyle: 'dashed',
          borderColor: isDragActive ? theme.palette.primary.main : theme.palette.divider,
          backgroundColor: theme.palette.background.paper,
          borderRadius: '0.75rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: disabled ? theme.palette.divider : theme.palette.primary.main,
            backgroundColor: disabled ? theme.palette.background.paper : (theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50]),
          },
        }}
      >
        <input {...getInputProps()} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main }} />
          <Typography 
            variant="body1" 
            sx={{ 
              color: theme.palette.text.primary,
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              textAlign: 'center',
            }}
          >
            {isDragActive
              ? 'Drop the file here'
              : 'Drag & drop an audio or video file here, or click to select'}
          </Typography>
          {currentFile && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                }}
              >
                Selected: {currentFile.name}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                }}
              >
                Size: {formatFileSize(currentFile.size)}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
      {validationError && (
        <Typography 
          sx={{ 
            mt: 1, 
            color: theme.palette.error.main,
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.875rem',
          }}
        >
          {validationError}
        </Typography>
      )}
    </Box>
  );
}


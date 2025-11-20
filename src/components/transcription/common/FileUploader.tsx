/**
 * File uploader component with drag-and-drop
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
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
          borderColor: isDragActive ? '#00c6ff' : '#333333',
          backgroundColor: isDragActive ? '#1a1a1a' : '#1e1e1e',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: disabled ? '#333333' : '#00c6ff',
            backgroundColor: disabled ? '#1e1e1e' : '#1a1a1a',
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
          <CloudUploadIcon sx={{ fontSize: 48, color: '#00c6ff' }} />
          <Typography variant="h6" sx={{ color: '#e0e0e0' }}>
            {isDragActive
              ? 'Drop the file here'
              : 'Drag & drop an audio or video file here, or click to select'}
          </Typography>
          {currentFile && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: '#a0a0a0' }}>
                Selected: {currentFile.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0a0a0' }}>
                Size: {formatFileSize(currentFile.size)}
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
      {validationError && (
        <Typography sx={{ mt: 1, color: '#f44336' }}>
          {validationError}
        </Typography>
      )}
    </Box>
  );
}


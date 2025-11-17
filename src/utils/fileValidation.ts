/**
 * File validation utilities
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Allowed audio file extensions
 */
export const ALLOWED_AUDIO_EXTENSIONS = [
  'wav',
  'mp3',
  'm4a',
  'flac',
  'ogg',
  'aac',
  'wma',
];

/**
 * Allowed video file extensions
 */
export const ALLOWED_VIDEO_EXTENSIONS = [
  'mp4',
  'avi',
  'mov',
  'mkv',
  'wmv',
  'flv',
  'webm',
];

/**
 * All allowed extensions
 */
export const ALLOWED_EXTENSIONS = [
  ...ALLOWED_AUDIO_EXTENSIONS,
  ...ALLOWED_VIDEO_EXTENSIONS,
];

/**
 * Maximum file size (500MB)
 */
export const MAX_FILE_SIZE = 500 * 1024 * 1024;

/**
 * Validate file extension
 */
export function validateFileExtension(filename: string): FileValidationResult {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  if (!ext) {
    return {
      valid: false,
      error: 'File has no extension',
    };
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `File type .${ext} is not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSize: number = MAX_FILE_SIZE): FileValidationResult {
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size (${fileSizeMB} MB) exceeds maximum allowed size (${maxSizeMB} MB)`,
    };
  }

  return { valid: true };
}

/**
 * Validate file (extension + size)
 */
export function validateFile(file: File, maxSize?: number): FileValidationResult {
  // Validate extension
  const extResult = validateFileExtension(file.name);
  if (!extResult.valid) {
    return extResult;
  }

  // Validate size
  const sizeResult = validateFileSize(file, maxSize);
  if (!sizeResult.valid) {
    return sizeResult;
  }

  return { valid: true };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get file info for display
 */
export function getFileInfo(file: File): {
  name: string;
  size: string;
  sizeMB: number;
  type: string;
  extension: string;
} {
  return {
    name: file.name,
    size: formatFileSize(file.size),
    sizeMB: file.size / (1024 * 1024),
    type: file.type,
    extension: file.name.split('.').pop()?.toLowerCase() || '',
  };
}


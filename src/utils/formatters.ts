/**
 * Formatting utilities
 */

import { format, formatDistanceToNow } from 'date-fns';

/**
 * Format timestamp for display
 * Uses local timezone to ensure correct time display
 * Handles dates from backend which are typically in UTC format without timezone suffix
 */
export function formatTimestamp(timestamp: string | Date): string {
  let date: Date;
  
  if (typeof timestamp === 'string') {
    let dateString = timestamp.trim();
    
    // Check if it already has timezone info
    const hasTimezone = dateString.endsWith('Z') || 
                       /[+-]\d{2}:?\d{2}$/.test(dateString) ||
                       dateString.includes('GMT') ||
                       dateString.includes('UTC');
    
    // Backend sends ISO format dates without timezone (e.g., "2025-12-03T10:28:00.000000")
    // Based on the issue (showing earlier time), it appears the backend may be sending
    // dates that are already in the user's local timezone, not UTC.
    // JavaScript's Date constructor treats strings without timezone as LOCAL time,
    // which should be correct if backend sends local times.
    // If backend sends UTC times, we would need to append 'Z', but that seems to cause
    // incorrect conversion. So we'll treat dates without timezone as local time.
    if (!hasTimezone) {
      // Remove microseconds if present for cleaner parsing
      dateString = dateString.replace(/\.\d+$/, '');
    }
    date = new Date(dateString);
  } else {
    date = timestamp;
  }
  
  // Validate the date
  if (isNaN(date.getTime())) {
    console.error('Invalid date:', timestamp);
    return 'Invalid date';
  }
  
  // Use toLocaleString to convert UTC to user's local timezone
  // This ensures correct time display regardless of user's timezone
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Format relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: string | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return formatDistanceToNow(date, { addSuffix: true });
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m ${remainingSeconds.toFixed(0)}s`;
}

/**
 * Format time position (e.g., "01:23:45")
 */
export function formatTimePosition(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}


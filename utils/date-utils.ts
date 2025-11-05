/**
 * Date utility functions for consistent date formatting across the application
 */

/**
 * Formats a date string or Date object to "DD-MMM-YYYY" format (e.g., "30-May-2025")
 * @param date - Date string, Date object, timestamp, or null/undefined
 * @returns Formatted date string or "-" for null/undefined
 */
export function formatDate(date: string | Date | number | null | undefined): string {
  if (!date || date === null || date === undefined) {
    return '-';
  }
  
  let dateObj: Date;
  
  if (typeof date === 'string') {
    if (date.trim() === '' || date === 'null' || date === 'undefined') {
      return '-';
    }
    dateObj = new Date(date);
  } else if (typeof date === 'number') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return '-';
  }
  
  if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '-';
  }

  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
  const year = dateObj.getFullYear();

  return `${day}-${month}-${year}`;
}

/**
 * Formats a date string or Date object to "DD-MMM-YYYY HH:MM" format (e.g., "30-May-2025 14:30")
 * @param date - Date string, Date object, timestamp, or null/undefined
 * @returns Formatted date and time string or "-" for null/undefined
 */
export function formatDateTime(date: string | Date | number | null | undefined): string {
  if (!date) {
    return '-';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : date;
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    return '-';
  }

  const formattedDate = formatDate(dateObj);
  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');

  return `${formattedDate} ${hours}:${minutes}`;
}

/**
 * Formats a date string or Date object to "HH:MM" format (e.g., "14:30")
 * @param date - Date string, Date object, timestamp, or null/undefined
 * @returns Formatted time string or "-" for null/undefined
 */
export function formatTime(date: string | Date | number | null | undefined): string {
  if (!date) {
    return '-';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : date;
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    return '-';
  }

  const hours = dateObj.getHours().toString().padStart(2, '0');
  const minutes = dateObj.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}

/**
 * Gets a relative time string (e.g., "2 hours ago", "yesterday")
 * @param date - Date string, Date object, timestamp, or null/undefined
 * @returns Relative time string or "-" for null/undefined
 */
export function getRelativeTime(date: string | Date | number | null | undefined): string {
  if (!date) {
    return '-';
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : 
                  typeof date === 'number' ? new Date(date) : date;
  
  if (!dateObj || isNaN(dateObj.getTime())) {
    return '-';
  }

  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInDays === 1) {
    return 'Yesterday';
  } else if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else {
    return formatDate(dateObj);
  }
}

/**
 * Utility functions for displaying relative time
 */

export function timeAgo(timestamp: string | number | Date): string {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  
  // If timestamp is in the future or invalid, return "just now"
  if (diffMs < 0 || isNaN(diffMs)) {
    return 'just now';
  }
  
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 30) {
    return 'just now';
  } else if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  } else if (diffMinutes < 60) {
    return diffMinutes === 1 ? '1 min ago' : `${diffMinutes} mins ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  } else if (diffDays < 7) {
    return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
  } else {
    return past.toLocaleDateString();
  }
}

export function formatLastUpdated(timestamp: string | number | Date | null): string {
  if (!timestamp) {
    return 'Never updated';
  }
  
  return `Updated ${timeAgo(timestamp)}`;
}

export function getUpdateStatusColor(timestamp: string | number | Date | null): 'success' | 'warning' | 'error' | 'default' {
  if (!timestamp) {
    return 'default';
  }
  
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now.getTime() - past.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  if (diffMinutes < 2) {
    return 'success'; // Very fresh (green)
  } else if (diffMinutes < 10) {
    return 'warning'; // Getting stale (yellow)
  } else {
    return 'error'; // Stale (red)
  }
}
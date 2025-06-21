/**
 * Format a date string to a readable format
 * @param dateString ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  // Format options
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a date to display relative time (e.g. "2 days ago")
 * @param dateString ISO date string
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  const secondsDiff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (secondsDiff < 60) {
    return 'just now';
  }
  
  const minutesDiff = Math.floor(secondsDiff / 60);
  if (minutesDiff < 60) {
    return `${minutesDiff} ${minutesDiff === 1 ? 'minute' : 'minutes'} ago`;
  }
  
  const hoursDiff = Math.floor(minutesDiff / 60);
  if (hoursDiff < 24) {
    return `${hoursDiff} ${hoursDiff === 1 ? 'hour' : 'hours'} ago`;
  }
  
  const daysDiff = Math.floor(hoursDiff / 24);
  if (daysDiff < 30) {
    return `${daysDiff} ${daysDiff === 1 ? 'day' : 'days'} ago`;
  }
  
  const monthsDiff = Math.floor(daysDiff / 30);
  if (monthsDiff < 12) {
    return `${monthsDiff} ${monthsDiff === 1 ? 'month' : 'months'} ago`;
  }
  
  const yearsDiff = Math.floor(monthsDiff / 12);
  return `${yearsDiff} ${yearsDiff === 1 ? 'year' : 'years'} ago`;
}

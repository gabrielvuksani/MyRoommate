// Utility functions for formatting names consistently across the app

export function formatDisplayName(firstName: string | null, lastName: string | null, fallback?: string): string {
  if (!firstName && !lastName) {
    return fallback || '';
  }
  
  if (!firstName) {
    return lastName || '';
  }
  
  if (!lastName) {
    return firstName;
  }
  
  // Format as "FirstName L." for last name initial
  const lastInitial = lastName.charAt(0).toUpperCase() + '.';
  return `${firstName} ${lastInitial}`;
}

export function formatShortName(firstName: string | null, lastName: string | null, email?: string | null): string {
  if (firstName) {
    return firstName;
  }
  
  if (email) {
    return email.split('@')[0];
  }
  
  return 'User';
}

export function getProfileInitials(firstName: string | null, lastName: string | null, email?: string | null): string {
  // For profile pictures, show both initials when available, similar to iOS Contacts
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return '??';
}
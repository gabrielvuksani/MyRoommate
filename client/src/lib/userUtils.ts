/**
 * User type differentiation utilities
 * Central location for all user state logic throughout the app
 */

export interface UserFlags {
  isNewUser: boolean;
  isExistingUser: boolean;
  needsOnboarding: boolean;
  hasHousehold: boolean;
}

/**
 * Determine user type and onboarding state
 * @param user - User object from authentication
 * @param household - Household object from API
 * @param isAuthenticated - Authentication status
 * @param currentPath - Current URL path to track onboarding state
 * @returns UserFlags object with all differentiation flags
 */
export function getUserFlags(user: any, household: any, isAuthenticated: boolean, location: string) {
  if (!isAuthenticated || !user) {
    return {
      isNewUser: false,
      isExistingUser: false,
      needsOnboarding: false,
      hasHousehold: false
    };
  }

  // Check if user is a new signup (flag set during registration)
  const isNewSignup = sessionStorage.getItem('is_new_signup') === 'true';
  
  // User needs onboarding if they are a new signup
  const needsOnboarding = isNewSignup;
  
  // Clear the flag after checking (but only if they've completed onboarding)
  if (isNewSignup && location !== '/onboarding' && household) {
    sessionStorage.removeItem('is_new_signup');
  }
  
  // User has household if household object exists
  const hasHousehold = !!household;
  
  // Check if user is existing but without household
  const isExistingUser = !isNewSignup && !household;

  return {
    isNewUser: isNewSignup,
    isExistingUser,
    needsOnboarding,
    hasHousehold
  };
}

/**
 * Determine which onboarding step to show for different user types
 * @param stepNumber - The step number to check
 * @param isNewUser - Whether user is a new signup
 * @returns Whether the step should be shown
 */
export function shouldShowOnboardingStep(stepNumber: number, isNewUser: boolean): boolean {
  // Step 2 (name entry) has been removed - all users use their signup names
  return stepNumber !== 2;
}

/**
 * Get the appropriate navigation flow for different user types
 * @param currentStep - Current onboarding step
 * @param isNewUser - Whether user is new
 * @param isReturningUser - Whether user is returning
 * @returns Next step number or navigation instruction
 */
export function getNextOnboardingStep(currentStep: number, isNewUser: boolean, isReturningUser: boolean): number {
  // Skip step 2 entirely - go directly from step 1 to step 3
  if (currentStep === 1) {
    return 3;
  } else if (currentStep === 3) {
    return 4;
  }
  return currentStep;
}

/**
 * Get the appropriate back navigation for different user types
 * @param currentStep - Current onboarding step
 * @param isReturningUser - Whether user is returning
 * @returns Previous step number
 */
export function getPreviousOnboardingStep(currentStep: number, isReturningUser: boolean): number {
  // Skip step 2 entirely - go directly from step 3 back to step 1
  if (currentStep === 3) {
    return 1;
  } else if (currentStep === 4) {
    return 3;
  } else if (currentStep > 1) {
    return currentStep - 1;
  }
  return currentStep;
}

/**
 * Get profile initials from user object
 * @param user - User object with firstName, lastName, and email
 * @returns Two character initials
 */
export function getProfileInitials(user: any): string {
  if (!user) return 'U';
  
  const firstName = user.firstName || '';
  const lastName = user.lastName || '';
  const email = user.email || '';
  
  if (firstName && lastName) {
    return (firstName[0] + lastName[0]).toUpperCase();
  } else if (firstName) {
    return firstName[0].toUpperCase();
  } else if (email) {
    return email[0].toUpperCase();
  }
  
  return 'U';
}
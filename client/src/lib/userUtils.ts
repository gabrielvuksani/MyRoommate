/**
 * User type differentiation utilities
 * Central location for all user state logic throughout the app
 */

export interface UserFlags {
  isNewUser: boolean;          // User without firstName (needs full onboarding with name setup)
  isReturningUser: boolean;    // User with firstName but no household (returning user)
  needsOnboarding: boolean;    // User needs to complete onboarding flow
  hasHousehold: boolean;       // User has an active household
  isInOnboarding: boolean;     // User is currently in the onboarding process
}

/**
 * Determine user type and onboarding state
 * @param user - User object from authentication
 * @param household - Household object from API
 * @param isAuthenticated - Authentication status
 * @param currentPath - Current URL path to track onboarding state
 * @returns UserFlags object with all differentiation flags
 */
export function getUserFlags(user: any, household: any, isAuthenticated: boolean, currentPath?: string): UserFlags {
  if (!isAuthenticated || !user) {
    return {
      isNewUser: false,
      isReturningUser: false,
      needsOnboarding: false,
      hasHousehold: false,
      isInOnboarding: false
    };
  }

  // User is currently in onboarding flow
  const isInOnboarding = currentPath === '/onboarding';
  
  // New user: no firstName (needs full onboarding including name entry)
  const isNewUser = !user.firstName;
  
  // Returning user: has firstName but no household
  const isReturningUser = !!user.firstName && !household;
  
  // User needs onboarding if they don't have a household (new or returning)
  const needsOnboarding = !household;
  
  // User has an active household
  const hasHousehold = !!household;

  return {
    isNewUser,
    isReturningUser,
    needsOnboarding,
    hasHousehold,
    isInOnboarding
  };
}

/**
 * Determine which onboarding step to show for different user types
 * @param stepNumber - The step number to check
 * @param isNewUser - Whether user is new (no firstName)
 * @returns Whether the step should be shown
 */
export function shouldShowOnboardingStep(stepNumber: number, isNewUser: boolean): boolean {
  if (stepNumber === 2) return isNewUser; // Only new users see name entry step
  return true; // All other steps visible to both user types
}

/**
 * Get the appropriate navigation flow for different user types
 * @param currentStep - Current onboarding step
 * @param isNewUser - Whether user is new
 * @param isReturningUser - Whether user is returning
 * @returns Next step number or navigation instruction
 */
export function getNextOnboardingStep(currentStep: number, isNewUser: boolean, isReturningUser: boolean): number {
  if (currentStep === 1 && isReturningUser) {
    // Returning users skip name step and go directly to household choice
    return 3;
  } else if (currentStep < 4) {
    return currentStep + 1;
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
  if (currentStep === 3 && isReturningUser) {
    // Returning users go back to step 1 (skip name step)
    return 1;
  } else if (currentStep > 1) {
    return currentStep - 1;
  }
  return currentStep;
}
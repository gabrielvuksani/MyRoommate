/**
 * User type differentiation utilities
 * Central location for all user state logic throughout the app
 */

export interface UserFlags {
  isNewUser: boolean;          // User without firstName (needs name entry)
  isExistingUser: boolean;     // User with firstName but no household
  needsOnboarding: boolean;    // User without firstName
  hasNoHousehold: boolean;     // User with firstName but no household
  isFullyOnboarded: boolean;   // User with firstName and household
}

/**
 * Determine user type and onboarding state
 * @param user - User object from authentication
 * @param household - Household object from API
 * @param isAuthenticated - Authentication status
 * @returns UserFlags object with all differentiation flags
 */
export function getUserFlags(user: any, household: any, isAuthenticated: boolean): UserFlags {
  // User without firstName needs full onboarding including name entry
  const isNewUser = isAuthenticated && user && !user.firstName;
  
  // User with firstName but no household (existing user returning)
  const isExistingUser = isAuthenticated && user && user.firstName && !household;
  
  // Legacy compatibility flags
  const needsOnboarding = isNewUser;
  const hasNoHousehold = isExistingUser;
  const isFullyOnboarded = isAuthenticated && user && user.firstName && household;

  return {
    isNewUser,
    isExistingUser,
    needsOnboarding,
    hasNoHousehold,
    isFullyOnboarded
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
 * @param isExistingUser - Whether user is existing
 * @returns Next step number or navigation instruction
 */
export function getNextOnboardingStep(currentStep: number, isNewUser: boolean, isExistingUser: boolean): number {
  if (currentStep === 1 && isExistingUser) {
    // Existing users skip name step and go directly to household choice
    return 3;
  } else if (currentStep < 4) {
    return currentStep + 1;
  }
  return currentStep;
}

/**
 * Get the appropriate back navigation for different user types
 * @param currentStep - Current onboarding step
 * @param isExistingUser - Whether user is existing
 * @returns Previous step number
 */
export function getPreviousOnboardingStep(currentStep: number, isExistingUser: boolean): number {
  if (currentStep === 3 && isExistingUser) {
    // Existing users go back to step 1 (skip name step)
    return 1;
  } else if (currentStep > 1) {
    return currentStep - 1;
  }
  return currentStep;
}
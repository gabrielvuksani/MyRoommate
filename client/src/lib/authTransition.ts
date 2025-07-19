// Handle authentication transitions to prevent 404 flashes
const AUTH_TRANSITION_KEY = 'auth_transition';

export const AuthTransition = {
  setInProgress: () => {
    sessionStorage.setItem(AUTH_TRANSITION_KEY, 'true');
  },
  
  clear: () => {
    sessionStorage.removeItem(AUTH_TRANSITION_KEY);
  },
  
  isInProgress: () => {
    return sessionStorage.getItem(AUTH_TRANSITION_KEY) === 'true';
  }
};
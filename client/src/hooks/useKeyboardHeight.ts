import { useState, useEffect } from 'react';

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // For iOS/Android PWA detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;

    // Visual viewport API for modern browsers
    if ('visualViewport' in window && window.visualViewport) {
      const handleViewportChange = () => {
        const viewport = window.visualViewport!;
        const hasKeyboard = window.innerHeight - viewport.height > 50;
        
        setKeyboardHeight(hasKeyboard ? window.innerHeight - viewport.height : 0);
        setIsKeyboardVisible(hasKeyboard);
      };

      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);

      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
          window.visualViewport.removeEventListener('scroll', handleViewportChange);
        }
      };
    }
    
    // Fallback for older browsers
    const initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = initialHeight - currentHeight;
      const hasKeyboard = heightDiff > 50;

      setKeyboardHeight(hasKeyboard ? heightDiff : 0);
      setIsKeyboardVisible(hasKeyboard);
    };

    // Also listen to focus/blur events on inputs
    const handleFocus = () => {
      setTimeout(() => {
        handleResize();
      }, 300); // Delay to allow keyboard animation
    };

    const handleBlur = () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible };
}
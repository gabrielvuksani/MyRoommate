import { useState, useEffect } from 'react';

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    let initialHeight = window.innerHeight;
    let keyboardDetectionTimeout: NodeJS.Timeout;
    
    // Enhanced keyboard detection with better timing
    const checkKeyboard = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = initialHeight - currentHeight;
      const hasKeyboard = heightDiff > 120; // More reliable threshold
      
      setKeyboardHeight(hasKeyboard ? heightDiff : 0);
      setIsKeyboardVisible(hasKeyboard);
    };

    // Enhanced resize handling with debouncing
    const handleResize = () => {
      clearTimeout(keyboardDetectionTimeout);
      
      keyboardDetectionTimeout = setTimeout(() => {
        // Update initial height if window is resized when keyboard is not visible
        if (!isKeyboardVisible) {
          initialHeight = window.innerHeight;
        }
        checkKeyboard();
      }, 50); // Debounce for performance
    };

    // Enhanced focus handling with multiple detection methods
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Multiple checks for better keyboard detection
        setTimeout(checkKeyboard, 150);
        setTimeout(checkKeyboard, 300);
        setTimeout(checkKeyboard, 500); // Final check after keyboard animation
      }
    };

    // Enhanced blur handling with proper cleanup
    const handleBlur = () => {
      clearTimeout(keyboardDetectionTimeout);
      
      keyboardDetectionTimeout = setTimeout(() => {
        const currentHeight = window.innerHeight;
        const heightDiff = initialHeight - currentHeight;
        
        // Only hide keyboard if height actually returned to normal
        if (heightDiff <= 50) {
          setKeyboardHeight(0);
          setIsKeyboardVisible(false);
        }
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      clearTimeout(keyboardDetectionTimeout);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, [isKeyboardVisible]);

  return { keyboardHeight, isKeyboardVisible };
}
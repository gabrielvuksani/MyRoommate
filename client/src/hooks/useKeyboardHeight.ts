import { useState, useEffect } from 'react';

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Use viewport height instead of window.innerHeight for better cross-environment consistency
    let initialHeight = window.visualViewport?.height || window.innerHeight;
    let keyboardDetectionTimeout: NodeJS.Timeout;
    
    // Enhanced keyboard detection with better timing and environment-aware thresholds
    const checkKeyboard = () => {
      const currentHeight = window.visualViewport?.height || window.innerHeight;
      const heightDiff = initialHeight - currentHeight;
      // Dynamic threshold based on initial viewport size for better cross-environment support
      const threshold = Math.max(120, initialHeight * 0.15); // 15% of viewport or 120px minimum
      const hasKeyboard = heightDiff > threshold;
      
      setKeyboardHeight(hasKeyboard ? heightDiff : 0);
      setIsKeyboardVisible(hasKeyboard);
    };

    // Enhanced resize handling with debouncing and environment-aware viewport detection
    const handleResize = () => {
      clearTimeout(keyboardDetectionTimeout);
      
      keyboardDetectionTimeout = setTimeout(() => {
        // Update initial height if window is resized when keyboard is not visible
        if (!isKeyboardVisible) {
          initialHeight = window.visualViewport?.height || window.innerHeight;
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

    // Enhanced blur handling with proper cleanup and environment-aware detection
    const handleBlur = () => {
      clearTimeout(keyboardDetectionTimeout);
      
      keyboardDetectionTimeout = setTimeout(() => {
        const currentHeight = window.visualViewport?.height || window.innerHeight;
        const heightDiff = initialHeight - currentHeight;
        
        // Dynamic threshold for blur detection based on initial viewport size
        const blurThreshold = Math.max(50, initialHeight * 0.05); // 5% of viewport or 50px minimum
        
        // Only hide keyboard if height actually returned to normal
        if (heightDiff <= blurThreshold) {
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
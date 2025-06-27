import { useState, useEffect } from 'react';

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    let initialHeight = window.innerHeight;
    
    // Simple height-based detection
    const checkKeyboard = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = initialHeight - currentHeight;
      const hasKeyboard = heightDiff > 100; // Increased threshold for reliability
      
      setKeyboardHeight(hasKeyboard ? heightDiff : 0);
      setIsKeyboardVisible(hasKeyboard);
    };

    // Handle window resize
    const handleResize = () => {
      // Update initial height if window is resized when keyboard is not visible
      if (!isKeyboardVisible) {
        initialHeight = window.innerHeight;
      }
      checkKeyboard();
    };

    // Handle focus events
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setTimeout(checkKeyboard, 300);
      }
    };

    const handleBlur = () => {
      setTimeout(() => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('focusout', handleBlur);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('focusout', handleBlur);
    };
  }, [isKeyboardVisible]);

  return { keyboardHeight, isKeyboardVisible };
}
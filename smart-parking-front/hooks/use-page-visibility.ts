import { useState, useEffect } from 'react';

/**
 * Hook to detect if the browser tab is visible or hidden
 * Uses the Page Visibility API
 */
export const usePageVisibility = () => {
  const [isVisible, setIsVisible] = useState(() => {
    // Check if document is available (SSR safety)
    if (typeof document === 'undefined') {
      return true;
    }
    return !document.hidden;
  });

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also listen for focus/blur events as fallback
    const handleFocus = () => setIsVisible(true);
    const handleBlur = () => setIsVisible(false);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return isVisible;
};






/**
 * Performance optimization utilities
 */

import { useMemo, useCallback, useRef } from 'react';

/**
 * Debounce hook for React
 */
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

/**
 * Throttle hook for React
 */
export const useThrottle = (callback, delay) => {
  const lastRun = useRef(Date.now());

  return useCallback((...args) => {
    if (Date.now() - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = Date.now();
    }
  }, [callback, delay]);
};

/**
 * Memoize expensive calculations
 */
export const useMemoizedValue = (value, deps) => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => value, Array.isArray(deps) ? [...deps, value] : [deps, value]);
};

/**
 * Check if component should re-render
 */
export const shouldUpdate = (prevProps, nextProps, keys) => {
  if (!keys || keys.length === 0) {
    return prevProps !== nextProps;
  }
  
  return keys.some(key => prevProps[key] !== nextProps[key]);
};

/**
 * Batch state updates
 */
export const batchUpdates = (updates) => {
  // React 18+ automatically batches, but this helps with older versions
  return (dispatch) => {
    updates.forEach(update => dispatch(update));
  };
};

import { useCallback, useRef, useState } from 'react';

/**
 * Hook to prevent double-clicks and improve button responsiveness
 * Automatically disables button during async operations
 */
export function useButtonAction<T extends (...args: any[]) => Promise<any>>(
  action: T,
  options: {
    debounceMs?: number;
    onSuccess?: (result: Awaited<ReturnType<T>>) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const { debounceMs = 300, onSuccess, onError } = options;
  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | undefined> => {
      // Prevent multiple simultaneous executions
      if (isProcessingRef.current) {
        return;
      }

      // Clear any pending debounce
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      return new Promise((resolve, reject) => {
        timeoutRef.current = setTimeout(async () => {
          if (isProcessingRef.current) {
            resolve(undefined);
            return;
          }

          isProcessingRef.current = true;
          setIsLoading(true);

          try {
            const result = await action(...args);
            onSuccess?.(result);
            resolve(result);
            return result;
          } catch (error) {
            const err = error instanceof Error ? error : new Error(String(error));
            onError?.(err);
            reject(error);
            throw error;
          } finally {
            isProcessingRef.current = false;
            setIsLoading(false);
            timeoutRef.current = null;
          }
        }, debounceMs);
      });
    },
    [action, debounceMs, onSuccess, onError]
  );

  return {
    execute,
    isLoading,
  };
}


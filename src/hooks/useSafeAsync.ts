import { useState, useCallback } from 'react';
import { showErrorToast, showSuccessToast } from '@/utils/errorHandler';

interface UseSafeAsyncOptions {
  onSuccess?: () => void;
  onError?: (error: any) => void;
  successMessage?: string;
}

/**
 * ✅ FIX: Hook to handle async operations safely
 */
export function useSafeAsync(options: UseSafeAsyncOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const execute = useCallback(
    async (fn: () => Promise<any>) => {
      setLoading(true);
      setError(null);

      try {
        const result = await fn();

        if (options.successMessage) {
          showSuccessToast(options.successMessage);
        }

        if (options.onSuccess) {
          options.onSuccess();
        }

        return result;
      } catch (err) {
        console.error('[useSafeAsync] Error:', err);
        setError(err);

        showErrorToast(err);

        if (options.onError) {
          options.onError(err);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return { execute, loading, error };
}
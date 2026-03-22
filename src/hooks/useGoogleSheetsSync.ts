/**
 * Hook stub — sincronização com Google Sheets desativada.
 * Toda persistência é feita via JSON local (localStorage).
 */
import { useCallback } from 'react';

export function useGoogleSheetsSync() {
  const invalidateTable = useCallback(async (_tableName: string) => {
    // no-op: dados locais não precisam de invalidação de cache externo
  }, []);

  const getPerformanceStats = useCallback(() => {
    return { totalSyncs: 0, avgSyncTime: 0, errors: 0 };
  }, []);

  const getCacheStats = useCallback(() => {
    return { hits: 0, misses: 0, size: 0 };
  }, []);

  const clearCache = useCallback(async () => {
    // no-op
  }, []);

  return { invalidateTable, getPerformanceStats, getCacheStats, clearCache };
}

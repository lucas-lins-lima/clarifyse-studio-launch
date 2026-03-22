/**
 * Stub — sincronização com Google Sheets desativada. Toda persistência é via JSON local.
 */
export const syncManager = {
  startPeriodicSync(_interval: number): void {},
  stopPeriodicSync(): void {},
  async syncNow(): Promise<void> {},
  getPerformanceStats() { return { totalSyncs: 0, avgSyncTime: 0, errors: 0 }; },
};

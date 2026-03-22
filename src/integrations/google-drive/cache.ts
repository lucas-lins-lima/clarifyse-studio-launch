/**
 * Stub — cache desativado. Toda persistência é via JSON local.
 */
export const cacheManager = {
  async get(_key: string): Promise<any> { return null; },
  async set(_key: string, _value: any): Promise<void> {},
  async invalidate(_key: string): Promise<void> {},
  async clear(): Promise<void> {},
  getStats() { return { hits: 0, misses: 0, size: 0 }; },
};

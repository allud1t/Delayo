import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAnalyticsStats,
  trackTabDelayed,
  trackTabWoken,
  trackTabDeleted,
  trackSupportOpened,
  trackPixCopied,
  setAnalyticsEnabled,
  isAnalyticsEnabled,
  initialAnalyticsStats,
  saveAnalyticsStats,
} from './analytics';

function createLocalStorageMock(): Storage {
  let store = new Map<string, string>();

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store = new Map<string, string>();
    },
    key: (index: number) => [...store.keys()][index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe('analytics service', () => {
  beforeEach(async () => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
    await setAnalyticsEnabled(true);
    await saveAnalyticsStats({ ...initialAnalyticsStats });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('initializes with default stats', async () => {
    const stats = await getAnalyticsStats();
    expect(stats.totalDelayedTabs).toBe(0);
    expect(stats.totalWokenTabs).toBe(0);
  });

  it('tracks delayed tabs correctly', async () => {
    await trackTabDelayed({ presetId: 'quick_1h', count: 3, mode: 'highlighted' });

    const stats = await getAnalyticsStats();
    expect(stats.totalDelayedTabs).toBe(3);
    expect(stats.presetUsageCount['quick_1h']).toBe(3);
    expect(stats.modeUsageCount.highlighted).toBe(3);
    expect(stats.firstUsedAt).toBeDefined();
    expect(stats.lastUsedAt).toBeDefined();
  });

  it('tracks woken and deleted tabs', async () => {
    await trackTabWoken(2);
    await trackTabDeleted(1);

    const stats = await getAnalyticsStats();
    expect(stats.totalWokenTabs).toBe(2);
    expect(stats.totalDeletedTabs).toBe(1);
  });

  it('tracks donation interactions', async () => {
    await trackSupportOpened();
    await trackPixCopied();

    const stats = await getAnalyticsStats();
    expect(stats.supportModalOpened).toBe(1);
    expect(stats.pixKeyCopied).toBe(1);
  });

  it('respects analytics disabled setting', async () => {
    await trackTabDelayed({ presetId: 'tonight', count: 1, mode: 'active' });
    await setAnalyticsEnabled(false);
    expect(await isAnalyticsEnabled()).toBe(false);

    await trackTabDelayed({ presetId: 'tonight', count: 1, mode: 'active' });

    const stats = await getAnalyticsStats();
    expect(stats.totalDelayedTabs).toBe(1);
    expect(stats.presetUsageCount.tonight).toBe(1);
  });
});

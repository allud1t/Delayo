import { AnalyticsStats, TabSelectionMode } from '@types';

const ANALYTICS_STORAGE_KEY = 'analyticsStats';
const ANALYTICS_ENABLED_KEY = 'analyticsEnabled';

export const initialAnalyticsStats: AnalyticsStats = {
  totalDelayedTabs: 0,
  presetUsageCount: {},
  modeUsageCount: {
    active: 0,
    highlighted: 0,
    window: 0,
  },
  totalWokenTabs: 0,
  totalDeletedTabs: 0,
  supportModalOpened: 0,
  pixKeyCopied: 0,
};

function hasChromeStorage(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.storage !== 'undefined' &&
    typeof chrome.storage.local !== 'undefined'
  );
}

export async function isAnalyticsEnabled(): Promise<boolean> {
  if (hasChromeStorage()) {
    const res = await chrome.storage.local.get(ANALYTICS_ENABLED_KEY);
    return res[ANALYTICS_ENABLED_KEY] !== false;
  }

  if (typeof localStorage !== 'undefined') {
    const val = localStorage.getItem(ANALYTICS_ENABLED_KEY);
    return val !== 'false';
  }

  return true;
}

export async function setAnalyticsEnabled(enabled: boolean): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [ANALYTICS_ENABLED_KEY]: enabled });
    return;
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ANALYTICS_ENABLED_KEY, String(enabled));
  }
}

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  try {
    if (hasChromeStorage()) {
      const res = await chrome.storage.local.get(ANALYTICS_STORAGE_KEY);
      const stored = res[ANALYTICS_STORAGE_KEY] as Partial<AnalyticsStats> | undefined;

      return {
        ...initialAnalyticsStats,
        ...stored,
        presetUsageCount: {
          ...initialAnalyticsStats.presetUsageCount,
          ...(stored?.presetUsageCount || {}),
        },
        modeUsageCount: {
          ...initialAnalyticsStats.modeUsageCount,
          ...(stored?.modeUsageCount || {}),
        },
      };
    }

    if (typeof localStorage !== 'undefined') {
      const storedJson = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (storedJson) {
        const stored = JSON.parse(storedJson) as Partial<AnalyticsStats>;
        return {
          ...initialAnalyticsStats,
          ...stored,
          presetUsageCount: {
            ...initialAnalyticsStats.presetUsageCount,
            ...(stored?.presetUsageCount || {}),
          },
          modeUsageCount: {
            ...initialAnalyticsStats.modeUsageCount,
            ...(stored?.modeUsageCount || {}),
          },
        };
      }
    }
  } catch {
    // Return defaults on error
  }

  return { ...initialAnalyticsStats };
}

export async function saveAnalyticsStats(
  stats: AnalyticsStats
): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [ANALYTICS_STORAGE_KEY]: stats });
    return;
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(stats));
  }
}

export async function trackTabDelayed(params: {
  presetId: string;
  count: number;
  mode: TabSelectionMode;
}): Promise<void> {
  const enabled = await isAnalyticsEnabled();
  if (!enabled) return;

  const stats = await getAnalyticsStats();
  const now = Date.now();

  stats.totalDelayedTabs += params.count;
  stats.presetUsageCount[params.presetId] =
    (stats.presetUsageCount[params.presetId] || 0) + params.count;
  stats.modeUsageCount[params.mode] =
    (stats.modeUsageCount[params.mode] || 0) + params.count;

  if (!stats.firstUsedAt) {
    stats.firstUsedAt = now;
  }
  stats.lastUsedAt = now;

  await saveAnalyticsStats(stats);
}

export async function trackTabWoken(count: number = 1): Promise<void> {
  const enabled = await isAnalyticsEnabled();
  if (!enabled) return;

  const stats = await getAnalyticsStats();
  stats.totalWokenTabs += count;
  stats.lastUsedAt = Date.now();

  await saveAnalyticsStats(stats);
}

export async function trackTabDeleted(count: number = 1): Promise<void> {
  const enabled = await isAnalyticsEnabled();
  if (!enabled) return;

  const stats = await getAnalyticsStats();
  stats.totalDeletedTabs += count;
  stats.lastUsedAt = Date.now();

  await saveAnalyticsStats(stats);
}

export async function trackSupportOpened(): Promise<void> {
  const enabled = await isAnalyticsEnabled();
  if (!enabled) return;

  const stats = await getAnalyticsStats();
  stats.supportModalOpened += 1;
  stats.lastUsedAt = Date.now();

  await saveAnalyticsStats(stats);
}

export async function trackPixCopied(): Promise<void> {
  const enabled = await isAnalyticsEnabled();
  if (!enabled) return;

  const stats = await getAnalyticsStats();
  stats.pixKeyCopied += 1;
  stats.lastUsedAt = Date.now();

  await saveAnalyticsStats(stats);
}

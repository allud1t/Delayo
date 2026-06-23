import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getDelaySettings,
  getOnboardingCompleted,
  normalizeLanguageCode,
  setSavedLanguage,
} from './extensionStorage';

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

describe('extensionStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createLocalStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normalizes supported language codes', () => {
    expect(normalizeLanguageCode('pt-BR')).toBe('pt');
    expect(normalizeLanguageCode('es-MX')).toBe('es');
    expect(normalizeLanguageCode('de-DE')).toBeNull();
  });

  it('normalizes partial delay settings with defaults', async () => {
    localStorage.setItem('delaySettings', JSON.stringify({ laterToday: 5 }));

    await expect(getDelaySettings()).resolves.toEqual(
      expect.objectContaining({
        laterToday: 5,
        laterTodayMinutes: 0,
        nextWeekSameDay: false,
        nextMonthSameDay: true,
      })
    );
  });

  it('normalizes quick delay settings to at least one minute', async () => {
    localStorage.setItem(
      'delaySettings',
      JSON.stringify({ laterToday: 0, laterTodayMinutes: 0 })
    );

    await expect(getDelaySettings()).resolves.toEqual(
      expect.objectContaining({
        laterToday: 0,
        laterTodayMinutes: 1,
      })
    );
  });

  it('writes saved language through the storage adapter', async () => {
    await setSavedLanguage('es');

    expect(localStorage.getItem('savedLanguage')).toBe('"es"');
  });

  it('reads onboarding completion through the shared adapter', async () => {
    localStorage.setItem('onboardingCompleted', 'true');

    await expect(getOnboardingCompleted()).resolves.toBe(true);
  });
});

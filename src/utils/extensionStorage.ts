import { defaultDelaySettings, normalizeDelaySettings } from '@domain/delaySettings';
import {
  DelayedTab,
  DelaySettings,
  ExtensionStorageSchema,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  TabSelectionMode,
  ThemePreference,
} from '@types';

type StorageKey = keyof ExtensionStorageSchema;

function hasChromeStorage(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    typeof chrome.storage !== 'undefined' &&
    typeof chrome.storage.local !== 'undefined'
  );
}

function hasLocalStorage(): boolean {
  return typeof localStorage !== 'undefined';
}

function readLocalStorageValue(key: StorageKey): unknown {
  if (!hasLocalStorage()) {
    return undefined;
  }

  const storedValue = localStorage.getItem(key);

  if (storedValue === null) {
    return undefined;
  }

  try {
    return JSON.parse(storedValue);
  } catch {
    return storedValue;
  }
}

function writeLocalStorageValue(key: StorageKey, value: unknown): void {
  if (!hasLocalStorage()) {
    return;
  }

  localStorage.setItem(key, JSON.stringify(value));
}

async function readStorageValue<K extends StorageKey>(
  key: K
): Promise<ExtensionStorageSchema[K] | undefined> {
  if (hasChromeStorage()) {
    const storedValue = await chrome.storage.local.get(key);

    if (storedValue[key] !== undefined) {
      return storedValue[key] as ExtensionStorageSchema[K];
    }
  }

  return readLocalStorageValue(key) as ExtensionStorageSchema[K] | undefined;
}

export async function setStorageValue<K extends StorageKey>(
  key: K,
  value: ExtensionStorageSchema[K]
): Promise<void> {
  if (hasChromeStorage()) {
    await chrome.storage.local.set({ [key]: value });
    return;
  }

  writeLocalStorageValue(key, value);
}

export function normalizeLanguageCode(
  language: string | null | undefined
): SupportedLanguage | null {
  const baseLanguage = language?.split('-')[0]?.toLowerCase();

  if (
    baseLanguage &&
    SUPPORTED_LANGUAGES.includes(baseLanguage as SupportedLanguage)
  ) {
    return baseLanguage as SupportedLanguage;
  }

  return null;
}

export async function getSavedLanguage(): Promise<SupportedLanguage | null> {
  return normalizeLanguageCode(await readStorageValue('savedLanguage'));
}

export async function setSavedLanguage(
  language: SupportedLanguage
): Promise<void> {
  await setStorageValue('savedLanguage', language);
}

export async function getDelaySettings(): Promise<DelaySettings> {
  const storedSettings = await readStorageValue('delaySettings');

  return normalizeDelaySettings(storedSettings);
}

export async function setDelaySettings(
  settings: DelaySettings
): Promise<void> {
  await setStorageValue('delaySettings', normalizeDelaySettings(settings));
}

export async function getSelectedMode(): Promise<TabSelectionMode | null> {
  const storedMode = await readStorageValue('selectedMode');

  if (
    storedMode === 'active' ||
    storedMode === 'highlighted' ||
    storedMode === 'window'
  ) {
    return storedMode;
  }

  return null;
}

export async function setSelectedMode(
  selectedMode: TabSelectionMode
): Promise<void> {
  await setStorageValue('selectedMode', selectedMode);
}

export async function getDelayedTabs(): Promise<DelayedTab[]> {
  const delayedTabs = await readStorageValue('delayedTabs');

  return Array.isArray(delayedTabs) ? delayedTabs : [];
}

function normalizeThemePreference(
  theme: unknown
): ThemePreference | null {
  return theme === 'light' || theme === 'dark' ? theme : null;
}

export async function getThemePreference(): Promise<ThemePreference | null> {
  return normalizeThemePreference(await readStorageValue('theme'));
}

export async function setThemePreference(
  theme: ThemePreference
): Promise<void> {
  await setStorageValue('theme', theme);
}

export async function getOnboardingCompleted(): Promise<boolean> {
  const storedValue = await readStorageValue('onboardingCompleted');

  if (typeof storedValue === 'boolean') {
    return storedValue;
  }

  if (storedValue === 'true') {
    if (hasChromeStorage()) {
      await setStorageValue('onboardingCompleted', true);
    }

    return true;
  }

  return false;
}

export async function setOnboardingCompleted(
  completed: boolean
): Promise<void> {
  await setStorageValue('onboardingCompleted', completed);
}

export function getSystemThemePreference(): ThemePreference {
  if (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return 'dark';
  }

  return 'light';
}

export function subscribeToStorageKey<K extends StorageKey>(
  key: K,
  callback: (value: ExtensionStorageSchema[K] | undefined) => void
): () => void {
  if (
    typeof chrome === 'undefined' ||
    typeof chrome.storage === 'undefined' ||
    typeof chrome.storage.onChanged === 'undefined'
  ) {
    return () => undefined;
  }

  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ): void => {
    if (areaName !== 'local' || !(key in changes)) {
      return;
    }

    callback(changes[key].newValue as ExtensionStorageSchema[K] | undefined);
  };

  chrome.storage.onChanged.addListener(listener);

  return () => {
    chrome.storage.onChanged.removeListener(listener);
  };
}

export { defaultDelaySettings };

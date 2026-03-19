import { DelaySettings } from '@types';
import { defaultDelaySettings } from '@utils/extensionStorage';
import {
  getDelaySettings,
  setDelaySettings,
} from '@utils/extensionStorage';
import { useCallback, useEffect, useState } from 'react';

export default function useDelaySettings(): {
  loading: boolean;
  settings: DelaySettings;
  updateSetting: <K extends keyof DelaySettings>(
    key: K,
    value: DelaySettings[K]
  ) => void;
  resetSettings: () => void;
  reloadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
} {
  const [settings, setSettingsState] = useState<DelaySettings>(defaultDelaySettings);
  const [loading, setLoading] = useState(true);

  const reloadSettings = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      setSettingsState(await getDelaySettings());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadSettings();
  }, [reloadSettings]);

  const updateSetting = useCallback(
    <K extends keyof DelaySettings>(key: K, value: DelaySettings[K]): void => {
      setSettingsState((current) => ({
        ...current,
        [key]: value,
      }));
    },
    []
  );

  const resetSettings = useCallback((): void => {
    setSettingsState(defaultDelaySettings);
  }, []);

  const saveSettingsHandler = useCallback(async (): Promise<void> => {
    await setDelaySettings(settings);
  }, [settings]);

  return {
    loading,
    settings,
    updateSetting,
    resetSettings,
    reloadSettings,
    saveSettings: saveSettingsHandler,
  };
}

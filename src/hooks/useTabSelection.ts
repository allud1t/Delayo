import { TabSelectionMode } from '@types';
import {
  getSelectedMode,
  setSelectedMode as persistSelectedMode,
} from '@utils/extensionStorage';
import {
  CurrentWindowTabsSnapshot,
  createMockCurrentWindowTabs,
  getCurrentWindowTabs,
  resolveInitialSelectedMode,
  resolveSelectedModeTabs,
} from '@utils/tabSelection';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function useTabSelection(): {
  activeTab: chrome.tabs.Tab | null;
  highlightedTabs: chrome.tabs.Tab[];
  allWindowTabs: chrome.tabs.Tab[];
  loading: boolean;
  selectedMode: TabSelectionMode;
  setSelectedMode: (mode: TabSelectionMode) => void;
  persistSelectedMode: () => Promise<void>;
  tabsToDelay: chrome.tabs.Tab[];
} {
  const [snapshot, setSnapshot] = useState<CurrentWindowTabsSnapshot>(
    createMockCurrentWindowTabs()
  );
  const [selectedMode, setSelectedMode] = useState<TabSelectionMode>('active');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTabs = async (): Promise<void> => {
      setLoading(true);

      try {
        const [tabsSnapshot, storedMode] = await Promise.all([
          getCurrentWindowTabs(),
          getSelectedMode(),
        ]);

        setSnapshot(tabsSnapshot);
        setSelectedMode(
          resolveInitialSelectedMode(tabsSnapshot.highlightedTabs, storedMode)
        );
      } finally {
        setLoading(false);
      }
    };

    void loadTabs();
  }, []);

  const persistMode = useCallback(async (): Promise<void> => {
    await persistSelectedMode(selectedMode);
  }, [selectedMode]);

  const tabsToDelay = useMemo(
    () => resolveSelectedModeTabs(snapshot, selectedMode),
    [selectedMode, snapshot]
  );

  return {
    activeTab: snapshot.activeTab,
    highlightedTabs: snapshot.highlightedTabs,
    allWindowTabs: snapshot.allWindowTabs,
    loading,
    selectedMode,
    setSelectedMode,
    persistSelectedMode: persistMode,
    tabsToDelay,
  };
}

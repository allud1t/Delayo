import { DelayedTab } from '@types';
import {
  removeTabs,
  wakeTabs,
} from '@utils/delayedTabsRuntime';
import {
  loadSortedDelayedTabs,
  sortDelayedTabs,
} from '@utils/delayedTabsList';
import { subscribeToStorageKey } from '@utils/extensionStorage';
import { useCallback, useEffect, useState } from 'react';

export default function useDelayedTabs(): {
  delayedTabs: DelayedTab[];
  loading: boolean;
  refresh: () => Promise<void>;
  removeDelayedTabs: (tabIds: string[]) => Promise<void>;
  wakeDelayedTabs: (tabIds: string[]) => Promise<void>;
} {
  const [delayedTabs, setDelayedTabs] = useState<DelayedTab[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      setDelayedTabs(await loadSortedDelayedTabs());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeToStorageKey('delayedTabs', (storedTabs) => {
      setDelayedTabs(sortDelayedTabs(storedTabs ?? []));
      setLoading(false);
    });
  }, []);

  const wakeDelayedTabs = useCallback(async (tabIds: string[]): Promise<void> => {
    const response = await wakeTabs(tabIds);
    setDelayedTabs(sortDelayedTabs(response.delayedTabs ?? []));
  }, []);

  const removeDelayedTabs = useCallback(
    async (tabIds: string[]): Promise<void> => {
      const response = await removeTabs(tabIds);
      setDelayedTabs(sortDelayedTabs(response.delayedTabs ?? []));
    },
    []
  );

  return {
    delayedTabs,
    loading,
    refresh,
    removeDelayedTabs,
    wakeDelayedTabs,
  };
}

import { DelayedTab } from '@types';
import normalizeDelayedTabs from '@utils/normalizeDelayedTabs';

import { getDelayedTabs } from './extensionStorage';

export function sortDelayedTabs(tabs: DelayedTab[]): DelayedTab[] {
  return [...normalizeDelayedTabs(tabs)].sort((a, b) => a.wakeTime - b.wakeTime);
}

export async function loadSortedDelayedTabs(): Promise<DelayedTab[]> {
  return sortDelayedTabs(await getDelayedTabs());
}

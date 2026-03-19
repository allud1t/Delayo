import { TabSelectionMode } from '@types';

export interface CurrentWindowTabsSnapshot {
  activeTab: chrome.tabs.Tab | null;
  highlightedTabs: chrome.tabs.Tab[];
  allWindowTabs: chrome.tabs.Tab[];
}

function createMockTab(): chrome.tabs.Tab {
  return {
    id: 123,
    url: 'https://example.com',
    title: 'Example Page (DEV MODE)',
    favIconUrl: 'https://www.google.com/favicon.ico',
  } as chrome.tabs.Tab;
}

export function createMockCurrentWindowTabs(): CurrentWindowTabsSnapshot {
  const mockTab = createMockTab();

  return {
    activeTab: mockTab,
    highlightedTabs: [mockTab],
    allWindowTabs: [mockTab],
  };
}

export async function getCurrentWindowTabs(
  chromeApi?: typeof chrome
): Promise<CurrentWindowTabsSnapshot> {
  const resolvedChromeApi =
    chromeApi ?? (typeof chrome !== 'undefined' ? chrome : undefined);

  if (
    typeof resolvedChromeApi === 'undefined' ||
    typeof resolvedChromeApi.tabs === 'undefined' ||
    typeof resolvedChromeApi.tabs.query === 'undefined'
  ) {
    return createMockCurrentWindowTabs();
  }

  const [activeTab] = await resolvedChromeApi.tabs.query({
    active: true,
    currentWindow: true,
  });
  const highlightedTabs = await resolvedChromeApi.tabs.query({
    highlighted: true,
    currentWindow: true,
  });
  const allWindowTabs = await resolvedChromeApi.tabs.query({
    currentWindow: true,
  });

  return {
    activeTab: activeTab ?? null,
    highlightedTabs,
    allWindowTabs,
  };
}

export function resolveInitialSelectedMode(
  highlightedTabs: chrome.tabs.Tab[],
  storedMode: TabSelectionMode | null
): TabSelectionMode {
  if (storedMode) {
    return storedMode;
  }

  return highlightedTabs.length > 1 ? 'highlighted' : 'active';
}

export function resolveSelectedModeTabs(
  snapshot: CurrentWindowTabsSnapshot,
  selectedMode: TabSelectionMode
): chrome.tabs.Tab[] {
  switch (selectedMode) {
    case 'active':
      return snapshot.activeTab ? [snapshot.activeTab] : [];
    case 'highlighted':
      return snapshot.highlightedTabs;
    case 'window':
      return snapshot.allWindowTabs;
    default:
      return snapshot.activeTab ? [snapshot.activeTab] : [];
  }
}

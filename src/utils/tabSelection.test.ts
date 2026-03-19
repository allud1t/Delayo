import { describe, expect, it } from 'vitest';

import {
  createMockCurrentWindowTabs,
  resolveInitialSelectedMode,
  resolveSelectedModeTabs,
} from './tabSelection';

describe('tabSelection', () => {
  it('creates a mock snapshot for non-extension environments', () => {
    const snapshot = createMockCurrentWindowTabs();

    expect(snapshot.activeTab).not.toBeNull();
    expect(snapshot.highlightedTabs).toHaveLength(1);
    expect(snapshot.allWindowTabs).toHaveLength(1);
  });

  it('prefers the stored mode when it exists', () => {
    const mode = resolveInitialSelectedMode(
      [{ id: 1 } as chrome.tabs.Tab, { id: 2 } as chrome.tabs.Tab],
      'window'
    );

    expect(mode).toBe('window');
  });

  it('falls back to highlighted mode when more than one tab is selected', () => {
    const mode = resolveInitialSelectedMode(
      [{ id: 1 } as chrome.tabs.Tab, { id: 2 } as chrome.tabs.Tab],
      null
    );

    expect(mode).toBe('highlighted');
  });

  it('resolves tabs according to the selected mode', () => {
    const activeTab = { id: 1 } as chrome.tabs.Tab;
    const highlightedTabs = [{ id: 2 } as chrome.tabs.Tab, { id: 3 } as chrome.tabs.Tab];
    const allWindowTabs = [{ id: 4 } as chrome.tabs.Tab];
    const snapshot = {
      activeTab,
      highlightedTabs,
      allWindowTabs,
    };

    expect(resolveSelectedModeTabs(snapshot, 'active')).toEqual([activeTab]);
    expect(resolveSelectedModeTabs(snapshot, 'highlighted')).toEqual(highlightedTabs);
    expect(resolveSelectedModeTabs(snapshot, 'window')).toEqual(allWindowTabs);
  });
});

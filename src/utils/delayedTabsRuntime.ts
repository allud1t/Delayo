import {
  DelayedTabsRuntimeMessage,
  DelayedTabsRuntimeResponse,
  RecurrencePattern,
} from '@types';

async function sendDelayedTabsMessage(
  message: DelayedTabsRuntimeMessage
): Promise<DelayedTabsRuntimeResponse> {
  const response =
    await chrome.runtime.sendMessage<DelayedTabsRuntimeMessage, DelayedTabsRuntimeResponse>(
      message
    );

  if (!response?.success) {
    throw new Error(response?.error || 'Delayed tabs operation failed');
  }

  return response;
}

export function scheduleTabs(
  tabs: chrome.tabs.Tab[],
  wakeTime: number,
  recurrencePattern?: RecurrencePattern
): Promise<DelayedTabsRuntimeResponse> {
  return sendDelayedTabsMessage({
    action: 'schedule-tabs',
    tabs,
    wakeTime,
    recurrencePattern,
  });
}

export function wakeTabs(
  tabIds: string[]
): Promise<DelayedTabsRuntimeResponse> {
  return sendDelayedTabsMessage({
    action: 'wake-tabs',
    tabIds,
  });
}

export function removeTabs(
  tabIds: string[]
): Promise<DelayedTabsRuntimeResponse> {
  return sendDelayedTabsMessage({
    action: 'remove-tabs',
    tabIds,
  });
}

export function reconcileDelayedTabs(): Promise<DelayedTabsRuntimeResponse> {
  return sendDelayedTabsMessage({
    action: 'reconcile-delayed-tabs',
  });
}

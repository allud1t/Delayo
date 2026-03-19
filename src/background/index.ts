import {
  DelayedTabsRuntimeMessage,
  DelayedTabsRuntimeResponse,
} from '@types';

import { createDelayedTabsController } from './delayedTabsController';

const delayedTabsController = createDelayedTabsController();

async function bootstrapDelayedTabs(): Promise<void> {
  await delayedTabsController.initializeStorage();
  await delayedTabsController.reconcileDelayedTabs();
}

function runBootstrapDelayedTabs(): void {
  void bootstrapDelayedTabs().catch((error: unknown) => {
    console.error('Failed to bootstrap delayed tabs:', error);
  });
}

runBootstrapDelayedTabs();

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  await bootstrapDelayedTabs();

  if (reason === 'install' || reason === 'update') {
    await delayedTabsController.setupContextMenu();
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'delay-tab' && tab?.id) {
    await chrome.action.openPopup();
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  void delayedTabsController.handleAlarm(alarm);
});

chrome.runtime.onStartup.addListener(() => {
  runBootstrapDelayedTabs();
});

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  const delayedTabsRequest = request as DelayedTabsRuntimeMessage;

  if (delayedTabsRequest.action === 'schedule-tabs') {
    void delayedTabsController
      .scheduleTabs(
        delayedTabsRequest.tabs,
        delayedTabsRequest.wakeTime,
        delayedTabsRequest.recurrencePattern
      )
      .then(sendResponse)
      .catch((error: unknown) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to schedule tabs',
        } satisfies DelayedTabsRuntimeResponse);
      });

    return true;
  }

  if (delayedTabsRequest.action === 'wake-tabs') {
    void delayedTabsController
      .wakeTabs(delayedTabsRequest.tabIds)
      .then(sendResponse)
      .catch((error: unknown) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to wake tabs',
        } satisfies DelayedTabsRuntimeResponse);
      });

    return true;
  }

  if (delayedTabsRequest.action === 'remove-tabs') {
    void delayedTabsController
      .removeTabs(delayedTabsRequest.tabIds)
      .then(sendResponse)
      .catch((error: unknown) => {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to remove tabs',
        } satisfies DelayedTabsRuntimeResponse);
      });

    return true;
  }

  if (delayedTabsRequest.action === 'reconcile-delayed-tabs') {
    void delayedTabsController
      .reconcileDelayedTabs()
      .then(sendResponse)
      .catch((error: unknown) => {
        sendResponse({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : 'Failed to reconcile delayed tabs',
        } satisfies DelayedTabsRuntimeResponse);
      });

    return true;
  }

  return undefined;
});

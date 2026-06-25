import {
  DelayedTab,
  DelayedTabsRuntimeResponse,
  RecurrencePattern,
} from '@types';
import generateUniqueTabId from '@utils/generateUniqueTabId';
import normalizeDelayedTabs from '@utils/normalizeDelayedTabs';
import { calculateNextWakeTime } from '@utils/recurrence';

const DELAYED_TABS_STORAGE_KEY = 'delayedTabs';
const CONTEXT_MENU_ID = 'delay-tab';
const ALARM_PREFIX = 'delayed-tab-';
const NOTIFICATION_ICON_PATH = 'icons/icon128.png';
const WAKE_NOTIFICATION_LEAD_TIME_MS = 3_000;

type QueueJob<T> = () => Promise<T>;
type DelayedTabStatus = NonNullable<DelayedTab['status']>;

interface WakeOptions {
  notify: boolean;
  rescheduleRecurring: boolean;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getAlarmName(tabId: string): string {
  return `${ALARM_PREFIX}${tabId}`;
}

function parseAlarmTabId(alarmName: string): string | null {
  if (!alarmName.startsWith(ALARM_PREFIX)) {
    return null;
  }

  return alarmName.slice(ALARM_PREFIX.length);
}

function getNotificationIconUrl(chromeApi: typeof chrome): string {
  return (
    chromeApi.runtime?.getURL?.(NOTIFICATION_ICON_PATH) ?? NOTIFICATION_ICON_PATH
  );
}

function getDelayedTabStatus(status?: DelayedTab['status']): DelayedTabStatus {
  return status === 'waking' ? 'waking' : 'scheduled';
}

function isValidDelayedTab(tab: Partial<DelayedTab>): tab is DelayedTab {
  return (
    typeof tab.id === 'string' &&
    tab.id.length > 0 &&
    typeof tab.url === 'string' &&
    tab.url.length > 0 &&
    typeof tab.createdAt === 'number' &&
    Number.isFinite(tab.createdAt) &&
    typeof tab.wakeTime === 'number' &&
    Number.isFinite(tab.wakeTime)
  );
}

function toScheduledTab(tab: DelayedTab): DelayedTab {
  return {
    ...tab,
    status: 'scheduled',
  };
}

function toWakingTab(tab: DelayedTab): DelayedTab {
  return {
    ...tab,
    status: 'waking',
  };
}

function replaceTab(
  tabs: DelayedTab[],
  tabId: string,
  replacements: DelayedTab[]
): DelayedTab[] {
  return tabs
    .filter((tab) => tab.id !== tabId)
    .concat(replacements)
    .sort((a, b) => a.wakeTime - b.wakeTime);
}

function sanitizeDelayedTabs(tabs: DelayedTab[]): DelayedTab[] {
  const uniqueTabs = new Map<string, DelayedTab>();

  for (const tab of normalizeDelayedTabs(tabs)) {
    if (!isValidDelayedTab(tab)) {
      continue;
    }

    if (!uniqueTabs.has(tab.id)) {
      uniqueTabs.set(tab.id, {
        ...tab,
        id: String(tab.id),
        status: getDelayedTabStatus(tab.status),
      });
    }
  }

  return [...uniqueTabs.values()].sort((a, b) => a.wakeTime - b.wakeTime);
}

export interface DelayedTabsController {
  setupContextMenu: () => Promise<void>;
  initializeStorage: () => Promise<void>;
  scheduleTabs: (
    tabs: chrome.tabs.Tab[],
    wakeTime: number,
    recurrencePattern?: RecurrencePattern
  ) => Promise<DelayedTabsRuntimeResponse>;
  wakeTabs: (tabIds: string[]) => Promise<DelayedTabsRuntimeResponse>;
  removeTabs: (tabIds: string[]) => Promise<DelayedTabsRuntimeResponse>;
  handleAlarm: (alarm: chrome.alarms.Alarm) => Promise<void>;
  reconcileDelayedTabs: () => Promise<DelayedTabsRuntimeResponse>;
}

export function createDelayedTabsController(
  chromeApi: typeof chrome = chrome
): DelayedTabsController {
  const queue: Array<() => Promise<void>> = [];
  let isProcessingQueue = false;

  async function processQueue(): Promise<void> {
    if (isProcessingQueue) {
      return;
    }

    isProcessingQueue = true;

    while (queue.length > 0) {
      const job = queue.shift();

      if (!job) {
        continue;
      }

      await job();
    }

    isProcessingQueue = false;
  }

  function enqueue<T>(job: QueueJob<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      queue.push(async () => {
        try {
          resolve(await job());
        } catch (error) {
          reject(error);
        }
      });

      void processQueue();
    });
  }

  async function loadDelayedTabs(): Promise<DelayedTab[]> {
    const { delayedTabs = [] } = await chromeApi.storage.local.get(
      DELAYED_TABS_STORAGE_KEY
    );

    return sanitizeDelayedTabs(delayedTabs as DelayedTab[]);
  }

  async function saveDelayedTabs(tabs: DelayedTab[]): Promise<DelayedTab[]> {
    const sanitizedTabs = sanitizeDelayedTabs(tabs);

    await chromeApi.storage.local.set({
      [DELAYED_TABS_STORAGE_KEY]: sanitizedTabs,
    });

    return sanitizedTabs;
  }

  async function clearAlarms(tabIds: Iterable<string>): Promise<void> {
    for (const tabId of tabIds) {
      await chromeApi.alarms.clear(getAlarmName(tabId));
    }
  }

  async function createAlarm(tab: DelayedTab): Promise<void> {
    await chromeApi.alarms.create(getAlarmName(tab.id), {
      when: tab.wakeTime,
    });
  }

  async function createAlarms(tabs: DelayedTab[]): Promise<void> {
    for (const tab of tabs) {
      await createAlarm(tab);
    }
  }

  async function openTab(
    tab: DelayedTab,
    { notify }: Pick<WakeOptions, 'notify'>
  ): Promise<void> {
    if (!tab.url) {
      return;
    }

    if (notify) {
      try {
        await chromeApi.notifications.create({
          type: 'basic',
          iconUrl: getNotificationIconUrl(chromeApi),
          title: 'Tab Waking Up',
          message: `Your ${tab.isRecurring ? 'recurring' : 'delayed'} tab "${tab.title}" will open in a few seconds.`,
          priority: 2,
          requireInteraction: true,
        });
      } catch {
        // Notification failures should not roll back the wake flow.
      }

      await delay(WAKE_NOTIFICATION_LEAD_TIME_MS);
    }

    await chromeApi.tabs.create({ url: tab.url });
  }

  async function reopenBrowserTabs(tabs: chrome.tabs.Tab[]): Promise<void> {
    for (const tab of tabs) {
      if (!tab.url) {
        continue;
      }

      try {
        await chromeApi.tabs.create({ url: tab.url });
      } catch {
        // Best-effort rollback for tabs already closed during scheduling.
      }
    }
  }

  function buildScheduledTab(
    tab: chrome.tabs.Tab,
    wakeTime: number,
    recurrencePattern?: RecurrencePattern
  ): DelayedTab | null {
    if (!tab.id || !tab.url) {
      return null;
    }

    return {
      id: generateUniqueTabId(),
      url: tab.url,
      title: tab.title,
      favicon: tab.favIconUrl,
      createdAt: Date.now(),
      wakeTime,
      status: 'scheduled',
      isRecurring: Boolean(recurrencePattern),
      recurrencePattern,
    };
  }

  function buildRecurringReschedule(tab: DelayedTab): DelayedTab | null {
    if (!tab.isRecurring || !tab.recurrencePattern) {
      return null;
    }

    const nextWakeTime = calculateNextWakeTime(tab.recurrencePattern);

    if (!nextWakeTime) {
      return null;
    }

    return {
      ...tab,
      id: generateUniqueTabId(),
      wakeTime: nextWakeTime,
      status: 'scheduled',
      isRecurring: true,
    };
  }

  async function processWakeTarget(
    currentTabs: DelayedTab[],
    tab: DelayedTab,
    options: WakeOptions
  ): Promise<DelayedTab[]> {
    const originalTab = toScheduledTab(tab);
    const wakingTab = toWakingTab(originalTab);
    let workingTabs = await saveDelayedTabs(
      replaceTab(currentTabs, originalTab.id, [wakingTab])
    );

    try {
      await openTab(originalTab, { notify: options.notify });
    } catch {
      return saveDelayedTabs(replaceTab(workingTabs, originalTab.id, [originalTab]));
    }

    let replacementTabs: DelayedTab[] = [];
    let clearOriginalAlarm = true;
    let createdRecurringAlarmId: string | null = null;

    if (options.rescheduleRecurring) {
      const rescheduledTab = buildRecurringReschedule(originalTab);

      if (rescheduledTab) {
        try {
          await createAlarm(rescheduledTab);
          createdRecurringAlarmId = rescheduledTab.id;
          replacementTabs = [rescheduledTab];
        } catch {
          replacementTabs = [originalTab];
          clearOriginalAlarm = false;
        }
      }
    }

    const finalizedTabs = replaceTab(workingTabs, originalTab.id, replacementTabs);

    try {
      workingTabs = await saveDelayedTabs(finalizedTabs);

      if (clearOriginalAlarm) {
        await clearAlarms([originalTab.id]);
      }

      return workingTabs;
    } catch {
      if (createdRecurringAlarmId) {
        await clearAlarms([createdRecurringAlarmId]);
      }

      return saveDelayedTabs(replaceTab(workingTabs, originalTab.id, [originalTab]));
    }
  }

  async function wakeStoredTabs(
    tabIds: string[],
    options: WakeOptions
  ): Promise<DelayedTabsRuntimeResponse> {
    return enqueue(async () => {
      const requestedIds = new Set(tabIds.map(String));
      const delayedTabs = await loadDelayedTabs();
      const tabsToWake = delayedTabs.filter((tab) => requestedIds.has(tab.id));

      let currentTabs = delayedTabs;

      for (const tab of tabsToWake) {
        const latestTab = currentTabs.find((currentTab) => currentTab.id === tab.id);

        if (!latestTab) {
          continue;
        }

        currentTabs = await processWakeTarget(currentTabs, latestTab, options);
      }

      return {
        success: true,
        delayedTabs: currentTabs,
      };
    });
  }

  async function synchronizeAlarms(persistedTabs: DelayedTab[]): Promise<void> {
    const alarms = await chromeApi.alarms.getAll();
    const now = Date.now();
    const futureTabs = persistedTabs.filter(
      (tab) => tab.status !== 'waking' && tab.wakeTime > now
    );
    const futureTabIds = new Set(futureTabs.map((tab) => tab.id));
    const alarmTabIds = new Set<string>();

    for (const alarm of alarms) {
      const tabId = parseAlarmTabId(alarm.name);

      if (!tabId) {
        continue;
      }

      alarmTabIds.add(tabId);

      if (!futureTabIds.has(tabId)) {
        await chromeApi.alarms.clear(alarm.name);
      }
    }

    const missingAlarms = futureTabs.filter((tab) => !alarmTabIds.has(tab.id));
    await createAlarms(missingAlarms);
  }

  async function setupContextMenu(): Promise<void> {
    await chromeApi.contextMenus.removeAll();
    await chromeApi.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Delay this tab',
      contexts: ['page'],
    });
  }

  async function initializeStorage(): Promise<void> {
    const { delayedTabs } = await chromeApi.storage.local.get(
      DELAYED_TABS_STORAGE_KEY
    );

    if (!Array.isArray(delayedTabs)) {
      await chromeApi.storage.local.set({ [DELAYED_TABS_STORAGE_KEY]: [] });
    }
  }

  async function scheduleTabs(
    tabs: chrome.tabs.Tab[],
    wakeTime: number,
    recurrencePattern?: RecurrencePattern
  ): Promise<DelayedTabsRuntimeResponse> {
    return enqueue(async () => {
      const delayedTabs = await loadDelayedTabs();
      const newDelayedTabs = tabs
        .map((tab) => buildScheduledTab(tab, wakeTime, recurrencePattern))
        .filter((tab): tab is DelayedTab => tab !== null);

      if (newDelayedTabs.length === 0) {
        return {
          success: true,
          delayedTabs,
        };
      }

      const createdAlarmIds: string[] = [];
      const removedTabs: chrome.tabs.Tab[] = [];

      try {
        for (const delayedTab of newDelayedTabs) {
          await createAlarm(delayedTab);
          createdAlarmIds.push(delayedTab.id);
        }

        for (const tab of tabs) {
          if (!tab.id || !tab.url) {
            continue;
          }

          await chromeApi.tabs.remove(tab.id);
          removedTabs.push(tab);
        }

        const persistedTabs = await saveDelayedTabs(delayedTabs.concat(newDelayedTabs));

        return {
          success: true,
          delayedTabs: persistedTabs,
        };
      } catch (error) {
        if (createdAlarmIds.length > 0) {
          await clearAlarms(createdAlarmIds);
        }

        if (removedTabs.length > 0) {
          await reopenBrowserTabs(removedTabs);
        }

        throw error;
      }
    });
  }

  async function removeTabs(
    tabIds: string[]
  ): Promise<DelayedTabsRuntimeResponse> {
    return enqueue(async () => {
      const removedIds = new Set(tabIds.map(String));
      const delayedTabs = await loadDelayedTabs();
      const updatedTabs = delayedTabs.filter((tab) => !removedIds.has(tab.id));
      const persistedTabs = await saveDelayedTabs(updatedTabs);

      await clearAlarms(removedIds);

      return {
        success: true,
        delayedTabs: persistedTabs,
      };
    });
  }

  async function handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
    const tabId = parseAlarmTabId(alarm.name);

    if (!tabId) {
      return;
    }

    await wakeStoredTabs([tabId], {
      notify: true,
      rescheduleRecurring: true,
    });
  }

  async function reconcileDelayedTabs(): Promise<DelayedTabsRuntimeResponse> {
    return enqueue(async () => {
      const delayedTabs = await loadDelayedTabs();
      const recoveredTabs = delayedTabs.map((tab) =>
        tab.status === 'waking' ? toScheduledTab(tab) : tab
      );
      const needsRecovery = recoveredTabs.some(
        (tab, index) => tab.status !== delayedTabs[index]?.status
      );

      let currentTabs = needsRecovery
        ? await saveDelayedTabs(recoveredTabs)
        : recoveredTabs;
      const now = Date.now();
      const dueTabIds = currentTabs
        .filter((tab) => tab.wakeTime <= now && tab.status !== 'waking')
        .map((tab) => tab.id);

      for (const tabId of dueTabIds) {
        const currentTab = currentTabs.find((tab) => tab.id === tabId);

        if (!currentTab || currentTab.wakeTime > now) {
          continue;
        }

        currentTabs = await processWakeTarget(currentTabs, currentTab, {
          notify: false,
          rescheduleRecurring: true,
        });
      }

      const persistedTabs = await saveDelayedTabs(currentTabs);
      await synchronizeAlarms(persistedTabs);

      return {
        success: true,
        delayedTabs: persistedTabs,
      };
    });
  }

  return {
    setupContextMenu,
    initializeStorage,
    scheduleTabs,
    wakeTabs: (tabIds) =>
      wakeStoredTabs(tabIds, {
        notify: false,
        rescheduleRecurring: false,
      }),
    removeTabs,
    handleAlarm,
    reconcileDelayedTabs,
  };
}

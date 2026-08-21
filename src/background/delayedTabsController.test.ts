import { DelayedTab, RecurrencePattern } from '@types';
import { calculateNextWakeTime } from '@utils/recurrence';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { createDelayedTabsController } from './delayedTabsController';

const analyticsMocks = vi.hoisted(() => ({
  trackTabDeleted: vi.fn(),
  trackTabWoken: vi.fn(),
}));

vi.mock('../services/analytics', () => analyticsMocks);

interface ChromeMock {
  chromeApi: typeof chrome;
  getStoredTabs: () => DelayedTab[];
  getAlarmNames: () => string[];
  tabsCreate: ReturnType<typeof vi.fn>;
  tabsRemove: ReturnType<typeof vi.fn>;
  alarmsCreate: ReturnType<typeof vi.fn>;
  alarmsClear: ReturnType<typeof vi.fn>;
  notificationsCreate: ReturnType<typeof vi.fn>;
}

function createChromeMock(
  initialTabs: DelayedTab[] = [],
  initialAlarmNames: string[] = []
): ChromeMock {
  let storedTabs = [...initialTabs];
  const alarms = new Map<string, chrome.alarms.Alarm>();

  for (const name of initialAlarmNames) {
    alarms.set(name, {
      name,
      scheduledTime: Date.now(),
    } as chrome.alarms.Alarm);
  }

  const tabsCreate = vi.fn(async () => ({ id: 999 } as chrome.tabs.Tab));
  const tabsRemove = vi.fn(async () => undefined);
  const notificationsCreate = vi.fn(async () => 'notification-id');
  const alarmsCreate = vi.fn(
    async (name: string, info: chrome.alarms.AlarmCreateInfo) => {
      alarms.set(name, {
        name,
        scheduledTime: info.when ?? Date.now(),
      } as chrome.alarms.Alarm);
    }
  );
  const alarmsClear = vi.fn(async (name?: string) => {
    if (!name) {
      return false;
    }

    return alarms.delete(name);
  });

  const chromeApi = {
    storage: {
      local: {
        get: vi.fn(async () => ({ delayedTabs: storedTabs })),
        set: vi.fn(async (value: { delayedTabs?: DelayedTab[] }) => {
          if (Array.isArray(value.delayedTabs)) {
            storedTabs = value.delayedTabs;
          }
        }),
      },
    },
    alarms: {
      create: alarmsCreate,
      clear: alarmsClear,
      getAll: vi.fn(async () => [...alarms.values()]),
    },
    tabs: {
      create: tabsCreate,
      remove: tabsRemove,
    },
    notifications: {
      create: notificationsCreate,
    },
    contextMenus: {
      removeAll: vi.fn(async () => undefined),
      create: vi.fn(async () => undefined),
    },
    runtime: {
      getURL: vi.fn((path: string) => `chrome-extension://delayo/${path}`),
      lastError: undefined,
    },
    action: {
      openPopup: vi.fn(async () => undefined),
    },
  } as unknown as typeof chrome;

  return {
    chromeApi,
    getStoredTabs: () => storedTabs,
    getAlarmNames: () => [...alarms.keys()],
    tabsCreate,
    tabsRemove,
    alarmsCreate,
    alarmsClear,
    notificationsCreate,
  };
}

function createDelayedTab(
  overrides: Partial<DelayedTab> = {}
): DelayedTab {
  return {
    id: 'tab-1',
    url: 'https://example.com',
    title: 'Example',
    favicon: 'https://example.com/favicon.ico',
    createdAt: Date.now() - 5_000,
    wakeTime: Date.now() - 1_000,
    status: 'scheduled',
    ...overrides,
  };
}

describe('delayedTabsController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-18T10:00:00.000Z'));
    analyticsMocks.trackTabDeleted.mockClear();
    analyticsMocks.trackTabWoken.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('opens an overdue tab only once when reconcile and alarm overlap', async () => {
    const overdueTab = createDelayedTab();
    const mock = createChromeMock([overdueTab], [`delayed-tab-${overdueTab.id}`]);
    const controller = createDelayedTabsController(mock.chromeApi);

    await Promise.all([
      controller.reconcileDelayedTabs(),
      controller.handleAlarm({
        name: `delayed-tab-${overdueTab.id}`,
        scheduledTime: overdueTab.wakeTime,
      } as chrome.alarms.Alarm),
    ]);

    expect(mock.tabsCreate).toHaveBeenCalledTimes(1);
    expect(mock.getStoredTabs()).toEqual([]);
  });

  it('opens an overdue tab only once when manual wake and alarm overlap', async () => {
    const overdueTab = createDelayedTab();
    const mock = createChromeMock([overdueTab], [`delayed-tab-${overdueTab.id}`]);
    const controller = createDelayedTabsController(mock.chromeApi);

    await Promise.all([
      controller.wakeTabs([overdueTab.id]),
      controller.handleAlarm({
        name: `delayed-tab-${overdueTab.id}`,
        scheduledTime: overdueTab.wakeTime,
      } as chrome.alarms.Alarm),
    ]);

    expect(mock.tabsCreate).toHaveBeenCalledTimes(1);
    expect(mock.getStoredTabs()).toEqual([]);
  });

  it('wakes two overdue tabs without duplicating or losing state', async () => {
    const firstTab = createDelayedTab({ id: 'tab-1', url: 'https://one.example' });
    const secondTab = createDelayedTab({
      id: 'tab-2',
      url: 'https://two.example',
      title: 'Second',
    });
    const mock = createChromeMock(
      [firstTab, secondTab],
      [`delayed-tab-${firstTab.id}`, `delayed-tab-${secondTab.id}`]
    );
    const controller = createDelayedTabsController(mock.chromeApi);

    await Promise.all([
      controller.handleAlarm({
        name: `delayed-tab-${firstTab.id}`,
        scheduledTime: firstTab.wakeTime,
      } as chrome.alarms.Alarm),
      controller.handleAlarm({
        name: `delayed-tab-${secondTab.id}`,
        scheduledTime: secondTab.wakeTime,
      } as chrome.alarms.Alarm),
    ]);

    expect(mock.tabsCreate).toHaveBeenCalledTimes(2);
    expect(mock.getStoredTabs()).toEqual([]);
  });

  it('shows a native notification when a scheduled alarm wakes a tab', async () => {
    const overdueTab = createDelayedTab({
      favicon: 'https://example.com/favicon.ico',
    });
    const mock = createChromeMock([overdueTab], [`delayed-tab-${overdueTab.id}`]);
    const controller = createDelayedTabsController(mock.chromeApi);

    await controller.handleAlarm({
      name: `delayed-tab-${overdueTab.id}`,
      scheduledTime: overdueTab.wakeTime,
    } as chrome.alarms.Alarm);

    expect(mock.notificationsCreate).toHaveBeenCalledWith({
      type: 'basic',
      iconUrl: 'chrome-extension://delayo/icons/icon128.png',
      title: 'Tab Awakened!',
      message: 'Your delayed tab "Example" is now open.',
    });
  });

  it('does not show a notification when a tab is manually woken', async () => {
    const overdueTab = createDelayedTab();
    const mock = createChromeMock([overdueTab], [`delayed-tab-${overdueTab.id}`]);
    const controller = createDelayedTabsController(mock.chromeApi);

    await controller.wakeTabs([overdueTab.id]);

    expect(mock.tabsCreate).toHaveBeenCalledTimes(1);
    expect(mock.notificationsCreate).not.toHaveBeenCalled();
  });

  it('records a successful manual wake once in the background', async () => {
    const tab = createDelayedTab();
    const mock = createChromeMock([tab], [`delayed-tab-${tab.id}`]);
    const controller = createDelayedTabsController(mock.chromeApi);

    await controller.wakeTabs([tab.id]);

    expect(analyticsMocks.trackTabWoken).toHaveBeenCalledTimes(1);
    expect(analyticsMocks.trackTabWoken).toHaveBeenCalledWith(1);
  });

  it('does not record a wake when reopening the tab fails', async () => {
    const tab = createDelayedTab();
    const mock = createChromeMock([tab], [`delayed-tab-${tab.id}`]);
    mock.tabsCreate.mockRejectedValueOnce(new Error('Failed to reopen tab'));
    const controller = createDelayedTabsController(mock.chromeApi);

    await controller.wakeTabs([tab.id]);

    expect(analyticsMocks.trackTabWoken).not.toHaveBeenCalled();
  });

  it('counts only existing tabs when removing tabs', async () => {
    const tab = createDelayedTab();
    const mock = createChromeMock([tab], [`delayed-tab-${tab.id}`]);
    const controller = createDelayedTabsController(mock.chromeApi);

    await controller.removeTabs([tab.id, 'missing-tab']);

    expect(analyticsMocks.trackTabDeleted).toHaveBeenCalledTimes(1);
    expect(analyticsMocks.trackTabDeleted).toHaveBeenCalledWith(1);
  });

  it('keeps the tab scheduled when manual wake fails to reopen it', async () => {
    const futureTab = createDelayedTab({
      id: 'future-1',
      wakeTime: Date.now() + 60_000,
    });
    const mock = createChromeMock([futureTab], [`delayed-tab-${futureTab.id}`]);
    mock.tabsCreate.mockRejectedValueOnce(new Error('Failed to reopen tab'));
    const controller = createDelayedTabsController(mock.chromeApi);

    const response = await controller.wakeTabs([futureTab.id]);

    expect(response.success).toBe(true);
    expect(mock.getStoredTabs()).toEqual([
      expect.objectContaining({
        id: futureTab.id,
        status: 'scheduled',
      }),
    ]);
    expect(mock.getAlarmNames()).toContain(`delayed-tab-${futureTab.id}`);
  });

  it('keeps an overdue tab stored when reconcile fails to reopen it', async () => {
    const overdueTab = createDelayedTab({ id: 'overdue-1' });
    const mock = createChromeMock([overdueTab], [`delayed-tab-${overdueTab.id}`]);
    mock.tabsCreate.mockRejectedValueOnce(new Error('Failed to reopen tab'));
    const controller = createDelayedTabsController(mock.chromeApi);

    await controller.reconcileDelayedTabs();

    expect(mock.getStoredTabs()).toEqual([
      expect.objectContaining({
        id: overdueTab.id,
        status: 'scheduled',
      }),
    ]);
    expect(mock.getAlarmNames()).not.toContain(`delayed-tab-${overdueTab.id}`);
  });

  it('does not show a notification when startup reconcile wakes overdue tabs', async () => {
    const overdueTab = createDelayedTab();
    const mock = createChromeMock([overdueTab], [`delayed-tab-${overdueTab.id}`]);
    const controller = createDelayedTabsController(mock.chromeApi);

    await controller.reconcileDelayedTabs();

    expect(mock.tabsCreate).toHaveBeenCalledTimes(1);
    expect(mock.notificationsCreate).not.toHaveBeenCalled();
  });

  it('reverts stale waking tabs and recreates missing alarms during reconcile', async () => {
    const futureTab = createDelayedTab({
      id: 'future-1',
      wakeTime: Date.now() + 60_000,
      status: 'waking',
    });
    const mock = createChromeMock([futureTab]);
    const controller = createDelayedTabsController(mock.chromeApi);

    await controller.reconcileDelayedTabs();

    expect(mock.getStoredTabs()).toEqual([
      expect.objectContaining({
        id: futureTab.id,
        status: 'scheduled',
      }),
    ]);
    expect(mock.getAlarmNames()).toContain(`delayed-tab-${futureTab.id}`);
  });

  it('removes the old record before allowing the same tab to be delayed again', async () => {
    const browserTab = {
      id: 123,
      url: 'https://repeat.example',
      title: 'Repeat',
      favIconUrl: 'https://repeat.example/favicon.ico',
    } as chrome.tabs.Tab;
    const mock = createChromeMock();
    const controller = createDelayedTabsController(mock.chromeApi);

    await controller.scheduleTabs([browserTab], Date.now() + 60_000);

    const [firstScheduledTab] = mock.getStoredTabs();
    expect(firstScheduledTab).toBeDefined();

    await controller.wakeTabs([firstScheduledTab.id]);
    expect(mock.getStoredTabs()).toEqual([]);

    await controller.scheduleTabs([browserTab], Date.now() + 120_000);

    const storedTabs = mock.getStoredTabs();
    expect(storedTabs).toHaveLength(1);
    expect(storedTabs[0].id).not.toBe(firstScheduledTab.id);
    expect(storedTabs[0].url).toBe(browserTab.url);
  });

  it('reschedules recurring tabs with a new id after wake', async () => {
    const recurrencePattern: RecurrencePattern = {
      type: 'daily',
      time: '09:00',
    };
    const recurringTab = createDelayedTab({
      id: 'recurring-1',
      wakeTime: Date.now() - 1_000,
      isRecurring: true,
      recurrencePattern,
    });
    const mock = createChromeMock(
      [recurringTab],
      [`delayed-tab-${recurringTab.id}`]
    );
    const controller = createDelayedTabsController(mock.chromeApi);

    await controller.handleAlarm({
      name: `delayed-tab-${recurringTab.id}`,
      scheduledTime: recurringTab.wakeTime,
    } as chrome.alarms.Alarm);

    const storedTabs = mock.getStoredTabs();
    expect(mock.tabsCreate).toHaveBeenCalledTimes(1);
    expect(storedTabs).toHaveLength(1);
    expect(storedTabs[0].id).not.toBe(recurringTab.id);
    expect(storedTabs[0].wakeTime).toBeGreaterThan(Date.now());
    expect(mock.getAlarmNames()).toContain(`delayed-tab-${storedTabs[0].id}`);
  });

  it('keeps the original recurring schedule if creating the next alarm fails', async () => {
    const recurrencePattern: RecurrencePattern = {
      type: 'daily',
      time: '09:00',
    };
    const recurringTab = createDelayedTab({
      id: 'recurring-1',
      wakeTime: Date.now() + 60_000,
      isRecurring: true,
      recurrencePattern,
    });
    const mock = createChromeMock(
      [recurringTab],
      [`delayed-tab-${recurringTab.id}`]
    );
    mock.alarmsCreate.mockRejectedValueOnce(new Error('Failed to create next alarm'));
    const controller = createDelayedTabsController(mock.chromeApi);

    await controller.handleAlarm({
      name: `delayed-tab-${recurringTab.id}`,
      scheduledTime: recurringTab.wakeTime,
    } as chrome.alarms.Alarm);

    expect(mock.tabsCreate).toHaveBeenCalledTimes(1);
    expect(mock.getStoredTabs()).toEqual([
      expect.objectContaining({
        id: recurringTab.id,
        status: 'scheduled',
      }),
    ]);
    expect(mock.getAlarmNames()).toContain(`delayed-tab-${recurringTab.id}`);
  });

  it('does not persist delayed tabs when creating alarms fails during schedule', async () => {
    const browserTab = {
      id: 123,
      url: 'https://repeat.example',
      title: 'Repeat',
      favIconUrl: 'https://repeat.example/favicon.ico',
    } as chrome.tabs.Tab;
    const mock = createChromeMock();
    mock.alarmsCreate.mockRejectedValueOnce(new Error('Failed to create alarm'));
    const controller = createDelayedTabsController(mock.chromeApi);

    await expect(
      controller.scheduleTabs([browserTab], Date.now() + 60_000)
    ).rejects.toThrow('Failed to create alarm');

    expect(mock.getStoredTabs()).toEqual([]);
    expect(mock.tabsRemove).not.toHaveBeenCalled();
    expect(mock.getAlarmNames()).toEqual([]);
  });

  it('clears created alarms and avoids persistence when closing tabs fails during schedule', async () => {
    const browserTab = {
      id: 123,
      url: 'https://repeat.example',
      title: 'Repeat',
      favIconUrl: 'https://repeat.example/favicon.ico',
    } as chrome.tabs.Tab;
    const mock = createChromeMock();
    mock.tabsRemove.mockRejectedValueOnce(new Error('Failed to close tab'));
    const controller = createDelayedTabsController(mock.chromeApi);

    await expect(
      controller.scheduleTabs([browserTab], Date.now() + 60_000)
    ).rejects.toThrow('Failed to close tab');

    expect(mock.getStoredTabs()).toEqual([]);
    expect(mock.getAlarmNames()).toEqual([]);
  });

  it('reopens tabs already closed if scheduling fails midway through removal', async () => {
    const firstBrowserTab = {
      id: 123,
      url: 'https://one.example',
      title: 'One',
      favIconUrl: 'https://one.example/favicon.ico',
    } as chrome.tabs.Tab;
    const secondBrowserTab = {
      id: 456,
      url: 'https://two.example',
      title: 'Two',
      favIconUrl: 'https://two.example/favicon.ico',
    } as chrome.tabs.Tab;
    const mock = createChromeMock();
    mock.tabsRemove
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('Failed to close second tab'));
    const controller = createDelayedTabsController(mock.chromeApi);

    await expect(
      controller.scheduleTabs(
        [firstBrowserTab, secondBrowserTab],
        Date.now() + 60_000
      )
    ).rejects.toThrow('Failed to close second tab');

    expect(mock.getStoredTabs()).toEqual([]);
    expect(mock.getAlarmNames()).toEqual([]);
    expect(mock.tabsCreate).toHaveBeenCalledWith({ url: firstBrowserTab.url });
  });

  it('clamps monthly recurrence to the last valid day of the month', () => {
    vi.setSystemTime(new Date('2026-02-01T10:00:00.000Z'));

    const nextWakeTime = calculateNextWakeTime({
      type: 'monthly',
      time: '09:00',
      dayOfMonth: 31,
    });

    expect(nextWakeTime).not.toBeNull();
    const nextWakeDate = new Date(nextWakeTime as number);
    expect(nextWakeDate.getFullYear()).toBe(2026);
    expect(nextWakeDate.getMonth()).toBe(1);
    expect(nextWakeDate.getDate()).toBe(28);
    expect(nextWakeDate.getHours()).toBe(9);
    expect(nextWakeDate.getMinutes()).toBe(0);
  });

  it('recreates missing alarms and clears orphan alarms during reconcile', async () => {
    const futureTab = createDelayedTab({
      id: 'future-1',
      wakeTime: Date.now() + 60_000,
    });
    const mock = createChromeMock([futureTab], ['delayed-tab-orphan']);
    const controller = createDelayedTabsController(mock.chromeApi);

    await controller.reconcileDelayedTabs();

    expect(mock.tabsCreate).not.toHaveBeenCalled();
    expect(mock.alarmsCreate).toHaveBeenCalledWith(
      `delayed-tab-${futureTab.id}`,
      expect.objectContaining({ when: futureTab.wakeTime })
    );
    expect(mock.alarmsClear).toHaveBeenCalledWith('delayed-tab-orphan');
    expect(mock.getAlarmNames()).toContain(`delayed-tab-${futureTab.id}`);
    expect(mock.getAlarmNames()).not.toContain('delayed-tab-orphan');
  });
});

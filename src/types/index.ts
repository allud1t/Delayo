export const SUPPORTED_LANGUAGES = ['en', 'pt', 'es'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export type TabSelectionMode = 'active' | 'highlighted' | 'window';
export type ThemePreference = 'light' | 'dark';

export interface DelaySettings {
  laterToday: number;
  laterTodayMinutes: number;
  tonightTime: string;
  tomorrowTime: string;
  weekendDay: 'saturday' | 'sunday';
  weekendTime: string;
  nextWeekSameDay: boolean;
  nextWeekDay: number;
  nextWeekTime: string;
  nextMonthSameDay: boolean;
  somedayMinMonths: number;
  somedayMaxMonths: number;
}

export interface DelayOption {
  id: string;
  label: string;
  hours?: number;
  minutes?: number;
  days?: number;
  custom?: boolean;
  calculateTime?: () => number;
}

export interface RecurrencePattern {
  type: 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';
  daysOfWeek?: number[];
  dayOfMonth?: number;
  time: string;
  endDate?: number;
}

export interface DelayedTab {
  id: string;
  url?: string;
  title?: string;
  favicon?: string;
  createdAt: number;
  wakeTime: number;
  status?: 'scheduled' | 'waking';
  isRecurring?: boolean;
  recurrencePattern?: RecurrencePattern;
}

export interface ScheduleTabsMessage {
  action: 'schedule-tabs';
  tabs: chrome.tabs.Tab[];
  wakeTime: number;
  recurrencePattern?: RecurrencePattern;
}

export interface WakeTabsMessage {
  action: 'wake-tabs';
  tabIds: string[];
}

export interface RemoveTabsMessage {
  action: 'remove-tabs';
  tabIds: string[];
}

export interface ReconcileDelayedTabsMessage {
  action: 'reconcile-delayed-tabs';
}

export type DelayedTabsRuntimeMessage =
  | ScheduleTabsMessage
  | WakeTabsMessage
  | RemoveTabsMessage
  | ReconcileDelayedTabsMessage;

export interface DelayedTabsRuntimeResponse {
  success: boolean;
  delayedTabs?: DelayedTab[];
  error?: string;
}

export interface ExtensionStorageSchema {
  delayedTabs: DelayedTab[];
  delaySettings: DelaySettings;
  selectedMode: TabSelectionMode;
  savedLanguage: SupportedLanguage;
  theme: ThemePreference;
  onboardingCompleted: boolean;
}

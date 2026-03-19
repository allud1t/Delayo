import { DelaySettings } from '@types';

export const defaultDelaySettings: DelaySettings = {
  laterToday: 3,
  tonightTime: '18:00',
  tomorrowTime: '09:00',
  weekendDay: 'saturday',
  weekendTime: '09:00',
  nextWeekSameDay: false,
  nextWeekDay: 1,
  nextWeekTime: '09:00',
  nextMonthSameDay: true,
  somedayMinMonths: 3,
  somedayMaxMonths: 12,
};

export function normalizeDelaySettings(
  settings?: Partial<DelaySettings> | null
): DelaySettings {
  return {
    ...defaultDelaySettings,
    ...settings,
  };
}

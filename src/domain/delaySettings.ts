import { DelaySettings } from '@types';

export const defaultDelaySettings: DelaySettings = {
  laterToday: 3,
  laterTodayMinutes: 0,
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

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(value), min), max);
}

export function normalizeDelaySettings(
  settings?: Partial<DelaySettings> | null
): DelaySettings {
  const laterToday = clampNumber(
    settings?.laterToday,
    defaultDelaySettings.laterToday,
    0,
    12
  );
  const laterTodayMinutes = clampNumber(
    settings?.laterTodayMinutes,
    defaultDelaySettings.laterTodayMinutes,
    0,
    59
  );

  return {
    ...defaultDelaySettings,
    ...settings,
    laterToday: laterToday === 0 && laterTodayMinutes === 0 ? 0 : laterToday,
    laterTodayMinutes:
      laterToday === 0 && laterTodayMinutes === 0 ? 1 : laterTodayMinutes,
  };
}

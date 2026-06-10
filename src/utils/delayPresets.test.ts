import { describe, expect, it } from 'vitest';

import {
  calculateLaterTodayWakeTime,
  calculateNextMonthWakeTime,
  calculateNextWeekWakeTime,
  createPresetDelayOptions,
} from './delayPresets';

describe('delayPresets', () => {
  it('uses hours and minutes when calculating later today wake time', () => {
    const now = new Date('2026-03-18T10:15:00.000Z');

    expect(calculateLaterTodayWakeTime(now, 0, 15)).toBe(
      new Date('2026-03-18T10:30:00.000Z').getTime()
    );
    expect(calculateLaterTodayWakeTime(now, 1, 20)).toBe(
      new Date('2026-03-18T11:35:00.000Z').getTime()
    );
  });

  it('uses the configured next week time when calculating the wake time', () => {
    const now = new Date('2026-03-18T10:15:00.000Z');

    const wakeTime = calculateNextWeekWakeTime(now, false, 1, '09:45');
    const wakeDate = new Date(wakeTime);

    expect(wakeDate.getDay()).toBe(1);
    expect(wakeDate.getHours()).toBe(9);
    expect(wakeDate.getMinutes()).toBe(45);
  });

  it('clamps next month to the last valid day when needed', () => {
    const now = new Date(2026, 0, 31, 8, 30);

    const wakeTime = calculateNextMonthWakeTime(now, true);

    expect(wakeTime).toBe(new Date(2026, 1, 28, 8, 30).getTime());
  });

  it('builds the preset list with all default delay options', () => {
    const options = createPresetDelayOptions({
      locale: 'en',
      settings: {
        laterToday: 3,
        laterTodayMinutes: 15,
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
      },
      translate: (key, values) => {
        if (key === 'popup.delayOptions.laterToday') {
          return `In ${String(values?.duration)}`;
        }

        if (key === 'popup.delayDuration.hours') {
          return `${String(values?.count)} hours`;
        }

        if (key === 'popup.delayDuration.minutes') {
          return `${String(values?.count)} minutes`;
        }

        return `${key}${values ? JSON.stringify(values) : ''}`;
      },
    });

    expect(options).toHaveLength(7);
    expect(options[0]).toEqual(
      expect.objectContaining({
        id: 'later_today',
        hours: 3,
        minutes: 15,
        label: 'In 3 hours 15 minutes',
      })
    );
    expect(options.map((option) => option.id)).toEqual([
      'later_today',
      'tonight',
      'tomorrow',
      'weekend',
      'next_week',
      'next_month',
      'someday',
    ]);
  });
});

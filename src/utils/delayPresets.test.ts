import { describe, expect, it } from 'vitest';

import {
  calculateLaterTodayWakeTime,
  calculateNextMonthWakeTime,
  calculateNextWeekWakeTime,
  calculateTonightWakeTime,
  calculateTomorrowWakeTime,
  createPresetDelayOptions,
} from './delayPresets';

describe('delayPresets', () => {
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

  it('calculates tonight wake time for today when time has not passed', () => {
    const now = new Date(2026, 5, 15, 14, 0); // 14:00
    const wakeTime = calculateTonightWakeTime(now, '18:00');
    const wakeDate = new Date(wakeTime);

    expect(wakeDate.getDate()).toBe(15);
    expect(wakeDate.getHours()).toBe(18);
    expect(wakeDate.getMinutes()).toBe(0);
  });

  it('rolls over tonight to tomorrow when tonight time has already passed today', () => {
    const now = new Date(2026, 5, 15, 20, 30); // 20:30 (after 18:00)
    const wakeTime = calculateTonightWakeTime(now, '18:00');
    const wakeDate = new Date(wakeTime);

    expect(wakeDate.getDate()).toBe(16); // Tomorrow
    expect(wakeDate.getHours()).toBe(18);
    expect(wakeDate.getMinutes()).toBe(0);
  });

  it('schedules for today morning when user is in early morning (madrugada)', () => {
    const earlyMorning = new Date(2026, 5, 15, 2, 0); // 02:00 AM
    const wakeTime = calculateTomorrowWakeTime(earlyMorning, '09:00');
    const wakeDate = new Date(wakeTime);

    expect(wakeDate.getDate()).toBe(15); // Same day morning
    expect(wakeDate.getHours()).toBe(9);
    expect(wakeDate.getMinutes()).toBe(0);
  });

  it('schedules for next day morning when called during the day', () => {
    const daytime = new Date(2026, 5, 15, 14, 0); // 14:00
    const wakeTime = calculateTomorrowWakeTime(daytime, '09:00');
    const wakeDate = new Date(wakeTime);

    expect(wakeDate.getDate()).toBe(16); // Next day
    expect(wakeDate.getHours()).toBe(9);
    expect(wakeDate.getMinutes()).toBe(0);
  });

  it('calculates later today correctly', () => {
    const now = new Date(2026, 5, 15, 10, 0);
    const wakeTime = calculateLaterTodayWakeTime(now, 3);
    const wakeDate = new Date(wakeTime);

    expect(wakeDate.getHours()).toBe(13);
  });

  it('builds the preset list with all default delay options', () => {
    const options = createPresetDelayOptions({
      locale: 'en',
      settings: {
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
      },
      translate: (key, values) =>
        `${key}${values ? JSON.stringify(values) : ''}`,
    });

    expect(options).toHaveLength(7);
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

import { describe, expect, it, vi } from 'vitest';

import {
  formatDateTimeLocalInput,
  formatTimeLeft,
  getDateFromRelativeDelay,
  getMinimumCustomDelayDate,
  getRelativeDelayValues,
} from './dateTime';

const labels = {
  day: 'd',
  hour: 'h',
  minute: 'm',
  now: 'Now',
};

describe('dateTime', () => {
  it('formats dates for datetime-local inputs in local time', () => {
    const date = new Date(2026, 2, 18, 13, 5, 27);

    expect(formatDateTimeLocalInput(date)).toBe('2026-03-18T13:05');
  });

  it('rounds the minimum custom delay date to the next minute', () => {
    const now = new Date('2026-03-18T10:00:45.000Z');

    expect(getMinimumCustomDelayDate(now).toISOString()).toBe(
      '2026-03-18T10:01:00.000Z'
    );
  });

  it('derives relative delay values from a target date', () => {
    const now = new Date('2026-03-18T10:00:00.000Z');
    const targetDate = new Date('2026-03-20T13:15:00.000Z');

    expect(getRelativeDelayValues(targetDate, now)).toEqual({
      days: 2,
      hours: 3,
      minutes: 15,
    });
  });

  it('derives relative delay values from the current minute instead of raw seconds', () => {
    const now = new Date('2026-03-18T10:00:45.000Z');
    const targetDate = new Date('2026-03-18T10:02:00.000Z');

    expect(getRelativeDelayValues(targetDate, now)).toEqual({
      days: 0,
      hours: 0,
      minutes: 2,
    });
  });

  it('builds a target date from relative delay values', () => {
    const now = new Date('2026-03-18T10:00:45.000Z');

    expect(
      getDateFromRelativeDelay(
        {
          days: 1,
          hours: 2,
          minutes: 30,
        },
        now
      ).toISOString()
    ).toBe('2026-03-19T12:30:00.000Z');
  });

  it('builds target dates from the current minute boundary', () => {
    const now = new Date('2026-03-18T10:00:45.000Z');

    expect(
      getDateFromRelativeDelay(
        {
          days: 0,
          hours: 0,
          minutes: 2,
        },
        now
      ).toISOString()
    ).toBe('2026-03-18T10:02:00.000Z');
  });

  it('clamps relative delays below one minute to the minimum custom date', () => {
    const now = new Date('2026-03-18T10:00:45.000Z');

    expect(
      getDateFromRelativeDelay(
        {
          days: 0,
          hours: 0,
          minutes: 0,
        },
        now
      ).toISOString()
    ).toBe('2026-03-18T10:01:00.000Z');
  });

  it('formats overdue timestamps as now', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-18T10:00:00.000Z'));

    expect(formatTimeLeft(Date.now() - 1_000, labels)).toBe('Now');

    vi.useRealTimers();
  });

  it('formats day and hour deltas', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-18T10:00:00.000Z'));

    expect(
      formatTimeLeft(
        Date.now() + (2 * 24 * 60 * 60 + 5 * 60 * 60) * 1000,
        labels
      )
    ).toBe('2d 5h');

    vi.useRealTimers();
  });

  it('formats hour and minute deltas', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-18T10:00:00.000Z'));

    expect(formatTimeLeft(Date.now() + (3 * 60 + 15) * 60 * 1000, labels)).toBe(
      '3h 15m'
    );

    vi.useRealTimers();
  });
});

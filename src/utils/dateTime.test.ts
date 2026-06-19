import { describe, expect, it, vi } from 'vitest';

import { formatDateTimeLocalInput, formatTimeLeft } from './dateTime';

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

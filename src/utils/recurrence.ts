import { RecurrencePattern } from '@types';

export function getClampedDayOfMonth(
  year: number,
  monthIndex: number,
  dayOfMonth: number
): number {
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();

  return Math.min(Math.max(dayOfMonth, 1), lastDayOfMonth);
}

function buildMonthlyCandidate(
  year: number,
  monthIndex: number,
  dayOfMonth: number,
  hours: number,
  minutes: number
): Date {
  const candidate = new Date(year, monthIndex, 1);
  candidate.setHours(hours, minutes, 0, 0);
  candidate.setDate(getClampedDayOfMonth(year, monthIndex, dayOfMonth));

  return candidate;
}

function getNextMatchingDayTime(
  now: Date,
  daysOfWeek: number[],
  hours: number,
  minutes: number
): number | null {
  const normalizedDays = [...new Set(daysOfWeek)].sort((a, b) => a - b);

  if (normalizedDays.length === 0) {
    return null;
  }

  for (let offset = 0; offset <= 7; offset += 1) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(hours, minutes, 0, 0);

    if (
      normalizedDays.includes(candidate.getDay()) &&
      candidate.getTime() > now.getTime()
    ) {
      return candidate.getTime();
    }
  }

  return null;
}

export function calculateNextWakeTime(
  recurrencePattern: RecurrencePattern,
  now = new Date()
): number | null {
  const [hours, minutes] = recurrencePattern.time.split(':').map(Number);

  if (recurrencePattern.endDate && now.getTime() >= recurrencePattern.endDate) {
    return null;
  }

  switch (recurrencePattern.type) {
    case 'daily': {
      const candidate = new Date(now);
      candidate.setHours(hours, minutes, 0, 0);

      if (candidate.getTime() <= now.getTime()) {
        candidate.setDate(candidate.getDate() + 1);
      }

      return candidate.getTime();
    }

    case 'weekdays':
      return getNextMatchingDayTime(now, [1, 2, 3, 4, 5], hours, minutes);

    case 'weekly':
    case 'custom':
      return getNextMatchingDayTime(
        now,
        recurrencePattern.daysOfWeek ?? [],
        hours,
        minutes
      );

    case 'monthly': {
      const dayOfMonth = recurrencePattern.dayOfMonth ?? 1;
      const currentMonthCandidate = buildMonthlyCandidate(
        now.getFullYear(),
        now.getMonth(),
        dayOfMonth,
        hours,
        minutes
      );

      if (currentMonthCandidate.getTime() > now.getTime()) {
        return currentMonthCandidate.getTime();
      }

      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      return buildMonthlyCandidate(
        nextMonthDate.getFullYear(),
        nextMonthDate.getMonth(),
        dayOfMonth,
        hours,
        minutes
      ).getTime();
    }

    default:
      return null;
  }
}

import { DelayOption, DelaySettings } from '@types';

import { formatCalendarDate, formatClockTime } from './dateTime';

type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

const weekdayKeys = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

export function parseTimeString(
  timeString: string
): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);

  return { hours, minutes };
}

export function calculateLaterTodayWakeTime(
  now: Date,
  hours: number
): number {
  return now.getTime() + hours * 60 * 60 * 1000;
}

export function calculateTonightWakeTime(
  now: Date,
  timeString: string
): number {
  const { hours, minutes } = parseTimeString(timeString);
  const today = new Date(now);
  today.setHours(hours, minutes, 0, 0);

  if (today.getTime() < now.getTime()) {
    return now.getTime() + 60 * 60 * 1000;
  }

  return today.getTime();
}

export function calculateTomorrowWakeTime(
  now: Date,
  timeString: string
): number {
  const { hours, minutes } = parseTimeString(timeString);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(hours, minutes, 0, 0);

  return tomorrow.getTime();
}

export function calculateWeekendWakeTime(
  now: Date,
  weekendDay: DelaySettings['weekendDay'],
  timeString: string
): number {
  const { hours, minutes } = parseTimeString(timeString);
  const currentDay = now.getDay();
  const targetDay = weekendDay === 'saturday' ? 6 : 0;
  let daysUntilTarget = 7;

  if (currentDay < targetDay) {
    daysUntilTarget = targetDay - currentDay;
  } else if (currentDay > targetDay) {
    daysUntilTarget = 7 - (currentDay - targetDay);
  }

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntilTarget);
  targetDate.setHours(hours, minutes, 0, 0);

  return targetDate.getTime();
}

export function calculateNextWeekWakeTime(
  now: Date,
  nextWeekSameDay: boolean,
  nextWeekDay: number,
  timeString: string
): number {
  const { hours, minutes } = parseTimeString(timeString);
  const targetDay = nextWeekSameDay ? now.getDay() : nextWeekDay;
  const currentDay = now.getDay();
  let daysUntilTarget = 7;

  if (currentDay < targetDay) {
    daysUntilTarget = targetDay - currentDay + 7;
  } else if (currentDay > targetDay) {
    daysUntilTarget = 7 - (currentDay - targetDay) + 7;
  }

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + daysUntilTarget);
  targetDate.setHours(hours, minutes, 0, 0);

  return targetDate.getTime();
}

function getNextMonthSameWeekdayDate(now: Date): Date {
  const currentDay = now.getDay();
  const currentWeekOfMonth = Math.ceil(now.getDate() / 7);
  const targetDate = new Date(now);

  targetDate.setMonth(now.getMonth() + 1);
  targetDate.setDate(1);

  while (targetDate.getDay() !== currentDay) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  targetDate.setDate(targetDate.getDate() + (currentWeekOfMonth - 1) * 7);

  if (targetDate.getMonth() !== (now.getMonth() + 1) % 12) {
    targetDate.setDate(1);
    targetDate.setMonth((now.getMonth() + 1) % 12);

    let lastOccurrence = 0;
    const daysInMonth = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      0
    ).getDate();

    for (let index = 1; index <= daysInMonth; index += 1) {
      targetDate.setDate(index);
      if (targetDate.getDay() === currentDay) {
        lastOccurrence = index;
      }
    }

    targetDate.setDate(lastOccurrence);
  }

  return targetDate;
}

export function calculateNextMonthWakeTime(
  now: Date,
  nextMonthSameDay: boolean
): number {
  let targetDate: Date;

  if (nextMonthSameDay) {
    targetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastDayOfNextMonth = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth() + 1,
      0
    ).getDate();
    targetDate.setDate(Math.min(now.getDate(), lastDayOfNextMonth));
  } else {
    const sameWeekdayDate = getNextMonthSameWeekdayDate(now);
    targetDate = new Date(now);
    targetDate.setFullYear(
      sameWeekdayDate.getFullYear(),
      sameWeekdayDate.getMonth(),
      sameWeekdayDate.getDate()
    );
  }

  targetDate.setHours(now.getHours(), now.getMinutes(), 0, 0);

  return targetDate.getTime();
}

export function calculateSomedayWakeTime(
  now: Date,
  minMonths: number,
  maxMonths: number,
  random: () => number = Math.random
): number {
  const randomMonths =
    Math.floor(random() * (maxMonths - minMonths + 1)) + minMonths;
  const randomDays = Math.floor(random() * 30);
  const targetDate = new Date(now);

  targetDate.setMonth(now.getMonth() + randomMonths);
  targetDate.setDate(now.getDate() + randomDays);

  return targetDate.getTime();
}

function getNextMonthLabel(
  settings: DelaySettings,
  locale: string,
  translate: TranslateFn,
  now: Date
): string {
  const targetDate = settings.nextMonthSameDay
    ? new Date(calculateNextMonthWakeTime(now, true))
    : getNextMonthSameWeekdayDate(now);
  const formattedDate = settings.nextMonthSameDay
    ? formatCalendarDate(targetDate.getTime(), locale, {
        day: 'numeric',
        month: 'long',
      })
    : formatCalendarDate(targetDate.getTime(), locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

  return `${translate('popup.delayOptions.nextMonth')} (${formattedDate}, ${formatClockTime(now.getTime(), locale)})`;
}

export function createPresetDelayOptions(params: {
  locale: string;
  settings: DelaySettings;
  translate: TranslateFn;
}): DelayOption[] {
  const { locale, settings, translate } = params;
  const renderTime = new Date();

  return [
    {
      id: 'later_today',
      label: translate('popup.delayOptions.laterToday', {
        hours: settings.laterToday,
      }),
      hours: settings.laterToday,
      calculateTime: () =>
        calculateLaterTodayWakeTime(new Date(), settings.laterToday),
    },
    {
      id: 'tonight',
      label: translate('popup.delayOptions.tonight', {
        time: settings.tonightTime,
      }),
      custom: true,
      calculateTime: () =>
        calculateTonightWakeTime(new Date(), settings.tonightTime),
    },
    {
      id: 'tomorrow',
      label: translate('popup.delayOptions.tomorrow', {
        time: settings.tomorrowTime,
      }),
      custom: true,
      calculateTime: () =>
        calculateTomorrowWakeTime(new Date(), settings.tomorrowTime),
    },
    {
      id: 'weekend',
      label: translate('popup.delayOptions.weekend', {
        day: translate(`popup.weekdays.${settings.weekendDay}`),
        time: settings.weekendTime,
      }),
      custom: true,
      calculateTime: () =>
        calculateWeekendWakeTime(
          new Date(),
          settings.weekendDay,
          settings.weekendTime
        ),
    },
    {
      id: 'next_week',
      label: translate('popup.delayOptions.nextWeek', {
        day: translate(
          `popup.weekdays.${
            weekdayKeys[
              settings.nextWeekSameDay
                ? renderTime.getDay()
                : settings.nextWeekDay
            ]
          }`
        ),
        time: settings.nextWeekTime,
      }),
      custom: true,
      calculateTime: () =>
        calculateNextWeekWakeTime(
          new Date(),
          settings.nextWeekSameDay,
          settings.nextWeekDay,
          settings.nextWeekTime
        ),
    },
    {
      id: 'next_month',
      label: getNextMonthLabel(settings, locale, translate, renderTime),
      custom: true,
      calculateTime: () =>
        calculateNextMonthWakeTime(new Date(), settings.nextMonthSameDay),
    },
    {
      id: 'someday',
      label: translate('popup.delayOptions.someday'),
      custom: true,
      calculateTime: () =>
        calculateSomedayWakeTime(
          new Date(),
          settings.somedayMinMonths,
          settings.somedayMaxMonths
        ),
    },
  ];
}

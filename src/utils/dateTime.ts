interface TimeLeftLabels {
  day: string;
  hour: string;
  minute: string;
  now: string;
}

export interface RelativeDelayValues {
  days: number;
  hours: number;
  minutes: number;
}

function padDateTimeSegment(value: number): string {
  return String(value).padStart(2, '0');
}

function getCurrentMinuteDate(now: Date): Date {
  const currentMinuteDate = new Date(now);

  currentMinuteDate.setSeconds(0, 0);

  return currentMinuteDate;
}

function shouldUseHour12(locale: string): boolean {
  return locale.startsWith('en');
}

export function formatDateTime(timestamp: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: shouldUseHour12(locale),
  }).format(new Date(timestamp));
}

export function formatCalendarDate(
  timestamp: number,
  locale: string,
  options: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, options).format(new Date(timestamp));
}

export function formatClockTime(timestamp: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: shouldUseHour12(locale),
  }).format(new Date(timestamp));
}

export function formatDateTimeLocalInput(date: Date): string {
  const year = date.getFullYear();
  const month = padDateTimeSegment(date.getMonth() + 1);
  const day = padDateTimeSegment(date.getDate());
  const hours = padDateTimeSegment(date.getHours());
  const minutes = padDateTimeSegment(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function getMinimumCustomDelayDate(now: Date): Date {
  const minDate = new Date(now);

  minDate.setSeconds(0, 0);
  minDate.setMinutes(minDate.getMinutes() + 1);

  return minDate;
}

export function getRelativeDelayValues(
  targetDate: Date,
  now: Date
): RelativeDelayValues {
  const baseDate = getCurrentMinuteDate(now);
  const totalMinutes = Math.max(
    0,
    Math.round((targetDate.getTime() - baseDate.getTime()) / (1000 * 60))
  );
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  return { days, hours, minutes };
}

export function getDateFromRelativeDelay(
  values: RelativeDelayValues,
  now: Date
): Date {
  const totalMinutes = values.days * 24 * 60 + values.hours * 60 + values.minutes;
  const baseDate = getCurrentMinuteDate(now);
  const targetDate = new Date(baseDate.getTime() + totalMinutes * 60 * 1000);
  const minimumDate = getMinimumCustomDelayDate(now);

  if (targetDate.getTime() < minimumDate.getTime()) {
    return minimumDate;
  }

  return targetDate;
}

export function formatTimeLeft(
  wakeTime: number,
  labels: TimeLeftLabels
): string {
  const diff = wakeTime - Date.now();

  if (diff <= 0) {
    return labels.now;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}${labels.day} ${hours}${labels.hour}`;
  }

  if (hours > 0) {
    return `${hours}${labels.hour} ${minutes}${labels.minute}`;
  }

  return `${minutes}${labels.minute}`;
}

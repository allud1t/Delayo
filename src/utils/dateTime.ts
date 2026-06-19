interface TimeLeftLabels {
  day: string;
  hour: string;
  minute: string;
  now: string;
}

function padDateTimeSegment(value: number): string {
  return String(value).padStart(2, '0');
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

export type AnalyticsTranslate = (key: string) => string;

const presetTranslationKeys: Record<string, string> = {
  quick_turbo: 'popup.quickTurbo',
  later_today: 'settings.laterToday',
  tonight: 'settings.tonight',
  tomorrow: 'settings.tomorrow',
  weekend: 'settings.weekend',
  next_week: 'settings.nextWeek',
  next_month: 'settings.nextMonth',
  someday: 'settings.someday',
  custom: 'popup.delayOptions.custom',
  recurring: 'popup.delayOptions.recurring',
};

export function getAnalyticsPresetLabel(
  presetId: string,
  translate: AnalyticsTranslate
): string {
  const translationKey = presetTranslationKeys[presetId];

  return translationKey ? translate(translationKey) : presetId || '-';
}

export function formatAnalyticsNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(value);
}

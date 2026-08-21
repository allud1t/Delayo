import { describe, expect, it } from 'vitest';

import {
  formatAnalyticsNumber,
  getAnalyticsPresetLabel,
} from './analyticsPresentation';

describe('analytics presentation', () => {
  const translate = (key: string): string => `translated:${key}`;

  it('translates built-in and custom preset identifiers', () => {
    expect(getAnalyticsPresetLabel('quick_turbo', translate)).toBe(
      'translated:popup.quickTurbo'
    );
    expect(getAnalyticsPresetLabel('custom', translate)).toBe(
      'translated:popup.delayOptions.custom'
    );
    expect(getAnalyticsPresetLabel('recurring', translate)).toBe(
      'translated:popup.delayOptions.recurring'
    );
  });

  it('preserves unknown legacy preset identifiers', () => {
    expect(getAnalyticsPresetLabel('legacy_preset', translate)).toBe(
      'legacy_preset'
    );
    expect(getAnalyticsPresetLabel('', translate)).toBe('-');
  });

  it('formats counts using the active locale', () => {
    expect(formatAnalyticsNumber(1234, 'en-US')).toBe('1,234');
    expect(formatAnalyticsNumber(1234, 'pt-BR')).toBe('1.234');
  });
});

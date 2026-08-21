import { AnalyticsStats } from '@types';
import React, { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  getAnalyticsStats,
  isAnalyticsEnabled,
  setAnalyticsEnabled,
} from '../services/analytics';

function ProductivityStats(): React.ReactElement {
  const { t } = useTranslation();
  const toggleId = useId();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    async function loadStats() {
      const isEnabled = await isAnalyticsEnabled();
      setEnabled(isEnabled);
      const data = await getAnalyticsStats();
      setStats(data);
    }
    void loadStats();
  }, []);

  const handleToggleAnalytics = async (newVal: boolean) => {
    setEnabled(newVal);
    await setAnalyticsEnabled(newVal);
  };

  const totalDelayed = stats?.totalDelayedTabs || 0;
  const totalWoken = stats?.totalWokenTabs || 0;
  const estimatedFocusMinutes = totalDelayed * 15; // Estimativa média de 15 min de foco preservado por aba adiada
  const focusHours = Math.floor(estimatedFocusMinutes / 60);
  const focusRemainingMinutes = estimatedFocusMinutes % 60;

  let topPresetName = '-';
  if (stats && stats.presetUsageCount) {
    const entries = Object.entries(stats.presetUsageCount);
    if (entries.length > 0) {
      entries.sort((a, b) => b[1] - a[1]);
      const topPresetKey = entries[0][0];
      topPresetName =
        topPresetKey === 'quick_turbo'
          ? t('popup.quickTurbo')
          : topPresetKey === 'later_today'
            ? t('settings.laterToday')
            : topPresetKey === 'tonight'
              ? t('settings.tonight')
              : topPresetKey === 'tomorrow'
                ? t('settings.tomorrow')
                : topPresetKey === 'weekend'
                  ? t('settings.weekend')
                  : topPresetKey === 'next_week'
                    ? t('settings.nextWeek')
                    : topPresetKey === 'next_month'
                      ? t('settings.nextMonth')
                      : topPresetKey === 'someday'
                        ? t('settings.someday')
                        : topPresetKey;
    }
  }

  return (
    <div className='card w-full border border-base-300 bg-base-300 shadow-sm transition-shadow duration-300 hover:shadow-md'>
      <div className='card-body p-6'>
        <h2 className='card-title mb-4 flex items-center justify-between'>
          <span>{t('stats.title')}</span>
          <span className='badge badge-primary badge-outline text-xs'>
            {totalDelayed} {t('common.tabs')}
          </span>
        </h2>

        {totalDelayed === 0 ? (
          <div className='py-6 text-center text-sm text-base-content/60'>
            {t('stats.noData')}
          </div>
        ) : (
          <div className='grid grid-cols-2 gap-4 sm:grid-cols-4'>
            <div className='rounded-lg bg-base-100/70 p-4 shadow-sm'>
              <div className='text-xs text-base-content/70'>
                {t('stats.totalDelayed')}
              </div>
              <div className='mt-1 text-2xl font-extrabold text-delayo-orange'>
                {totalDelayed}
              </div>
            </div>

            <div className='rounded-lg bg-base-100/70 p-4 shadow-sm'>
              <div className='text-xs text-base-content/70'>
                {t('stats.totalWoken')}
              </div>
              <div className='mt-1 text-2xl font-extrabold text-success'>
                {totalWoken}
              </div>
            </div>

            <div className='rounded-lg bg-base-100/70 p-4 shadow-sm'>
              <div className='text-xs text-base-content/70'>
                {t('stats.focusPreserved')}
              </div>
              <div className='mt-1 text-2xl font-extrabold text-info'>
                {focusHours > 0
                  ? `~${focusHours}${t('stats.hours')} ${focusRemainingMinutes}${t('stats.minutes')}`
                  : `~${focusRemainingMinutes}${t('stats.minutes')}`}
              </div>
            </div>

            <div className='rounded-lg bg-base-100/70 p-4 shadow-sm'>
              <div className='text-xs text-base-content/70'>
                {t('stats.favoritePreset')}
              </div>
              <div className='mt-1 truncate text-lg font-bold text-delayo-purple'>
                {topPresetName}
              </div>
            </div>
          </div>
        )}

        <div className='mt-6 border-t border-base-200 pt-4'>
          <div className='form-control'>
            <label htmlFor={toggleId} className='label cursor-pointer justify-between'>
              <div className='flex flex-col pr-4'>
                <span className='label-text font-medium'>
                  {t('settings.analytics.enable')}
                </span>
                <span className='text-xs text-base-content/60'>
                  {t('settings.analytics.description')}
                </span>
              </div>
              <input
                id={toggleId}
                type='checkbox'
                className='toggle toggle-primary'
                checked={enabled}
                onChange={(e) => void handleToggleAnalytics(e.target.checked)}
                aria-label={t('settings.analytics.enable')}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductivityStats;

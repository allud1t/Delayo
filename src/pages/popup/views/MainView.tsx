import { faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@tanstack/react-router';
import useDelaySettings from '@hooks/useDelaySettings';
import useTabSelection from '@hooks/useTabSelection';
import { DelayOption, TabSelectionMode } from '@types';
import { scheduleTabs } from '@utils/delayedTabsRuntime';
import { createPresetDelayOptions } from '@utils/delayPresets';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import DonationButton from '../../../components/DonationButton';
import { trackTabDelayed } from '../../../services/analytics';
import useTheme from '../../../utils/useTheme';

function MainView(): React.ReactElement {
  const { i18n, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { loading: settingsLoading, settings } = useDelaySettings();
  const {
    activeTab,
    allWindowTabs,
    highlightedTabs,
    loading: tabsLoading,
    persistSelectedMode,
    selectedMode,
    setSelectedMode,
    tabsToDelay,
  } = useTabSelection();

  const loading = settingsLoading || tabsLoading;
  const locale =
    i18n.language || document.documentElement.lang || navigator.language || 'en';
  const translate = useCallback(
    (key: string, options?: Record<string, unknown>): string =>
      t(key, options) as string,
    [t]
  );

  const delayOptions = useMemo<DelayOption[]>(
    () =>
      createPresetDelayOptions({
        locale,
        settings,
        translate,
      }),
    [locale, settings, translate]
  );

  const handleDelay = async (option: DelayOption): Promise<void> => {
    if (tabsToDelay.length === 0) {
      return;
    }

    await persistSelectedMode();

    const wakeTime =
      option.calculateTime?.() ??
      Date.now() +
        (option.hours ? option.hours * 60 * 60 * 1000 : 0) +
        (option.days ? option.days * 24 * 60 * 60 * 1000 : 0);

    void trackTabDelayed({
      presetId: option.id,
      count: tabsToDelay.length,
      mode: selectedMode,
    });

    await scheduleTabs(tabsToDelay, wakeTime);
    window.close();
  };

  const handleQuickTurbo = async (): Promise<void> => {
    if (tabsToDelay.length === 0) {
      return;
    }

    await persistSelectedMode();

    const wakeTime = Date.now() + 60 * 60 * 1000;

    void trackTabDelayed({
      presetId: 'quick_turbo',
      count: tabsToDelay.length,
      mode: selectedMode,
    });

    await scheduleTabs(tabsToDelay, wakeTime);
    window.close();
  };

  const handleModeChange = (mode: TabSelectionMode): void => {
    setSelectedMode(mode);
  };

  if (loading) {
    return (
      <div className='flex min-h-[300px] items-center justify-center'>
        <span className='loading loading-spinner loading-lg' />
      </div>
    );
  }

  return (
    <div className='card w-[40rem] rounded-none bg-base-300 shadow-md'>
      <div className='card-body p-4 sm:p-5'>
        {/* Header */}
        <div className='mb-3 flex items-center justify-between'>
          <h2 className='card-title flex items-center font-bold text-delayo-orange'>
            <FontAwesomeIcon
              icon={faHourglassHalf}
              className='mr-2 h-5 w-5 text-delayo-orange'
            />
            Delayo
          </h2>
          <div className='flex items-center space-x-2'>
            <Link
              to='/settings'
              className='btn btn-circle btn-ghost btn-sm transition-all duration-200 hover:bg-base-100'
              aria-label={t('popup.actions.openSettings')}
            >
              <FontAwesomeIcon
                icon='gear'
                className='text-neutral-400 hover:text-delayo-orange'
              />
            </Link>
            <button
              type='button'
              className='btn btn-circle btn-ghost btn-sm transition-all duration-200 hover:bg-base-100'
              onClick={toggleTheme}
              aria-label={t('common.theme.toggle', {
                theme:
                  theme === 'light'
                    ? t('common.theme.dark')
                    : t('common.theme.light'),
              })}
            >
              <FontAwesomeIcon
                icon={theme === 'light' ? 'moon' : 'sun'}
                className={
                  theme === 'light'
                    ? 'text-delayo-purple'
                    : 'text-delayo-yellow'
                }
              />
            </button>
          </div>
        </div>

        {/* Tab Selection & Tab Info */}
        <div className='mb-3 flex flex-col space-y-2'>
          <div className='flex items-center justify-between'>
            <div className='text-sm font-medium text-base-content/80'>
              {t('popup.delay')}:
            </div>
            <div className='flex space-x-2'>
              <button
                type='button'
                className={`btn btn-sm ${selectedMode === 'active' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleModeChange('active')}
              >
                {t('popup.tabs.active')}
              </button>
              <button
                type='button'
                className={`btn btn-sm ${selectedMode === 'highlighted' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleModeChange('highlighted')}
                disabled={highlightedTabs.length <= 1}
              >
                {t('popup.tabs.highlighted')}{' '}
                {highlightedTabs.length > 1 ? `(${highlightedTabs.length})` : ''}
              </button>
              <button
                type='button'
                className={`btn btn-sm ${selectedMode === 'window' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleModeChange('window')}
              >
                {t('popup.tabs.window')}{' '}
                {allWindowTabs.length > 0 ? `(${allWindowTabs.length})` : ''}
              </button>
            </div>
          </div>

          <div className='rounded-lg bg-base-100/70 px-3 py-2 shadow-sm transition-all duration-200 hover:bg-base-100'>
            {selectedMode === 'active' && activeTab && (
              <div className='flex items-center'>
                {activeTab.favIconUrl && (
                  <img
                    src={activeTab.favIconUrl}
                    alt={t('common.faviconAlt')}
                    className='mr-2.5 h-4 w-4 rounded-sm'
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className='truncate text-xs font-medium text-base-content/80 sm:text-sm'>
                  {activeTab.title}
                </div>
              </div>
            )}

            {selectedMode === 'highlighted' && (
              <div className='text-xs font-medium text-base-content/80 sm:text-sm'>
                {highlightedTabs.length}{' '}
                {highlightedTabs.length === 1
                  ? t('common.tabs.singular')
                  : t('common.tabs')}{' '}
                {t('popup.selected')}
              </div>
            )}

            {selectedMode === 'window' && (
              <div className='text-xs font-medium text-base-content/80 sm:text-sm'>
                {allWindowTabs.length}{' '}
                {allWindowTabs.length === 1
                  ? t('common.tabs.singular')
                  : t('common.tabs')}{' '}
                {t('popup.inWindow')}
              </div>
            )}
          </div>

          {/* Turbo Quick Action Button - Alinhado à esquerda com espaçamento vertical equilibrado */}
          <div className='flex items-center justify-start py-1'>
            <button
              type='button'
              className='btn btn-sm border-none bg-delayo-orange text-white hover:bg-[#e67300] font-medium'
              onClick={() => void handleQuickTurbo()}
              title={t('popup.quickTurboDesc')}
            >
              <FontAwesomeIcon icon='bolt' className='mr-1.5 h-3.5 w-3.5 text-white' />
              <span>{t('popup.quickTurbo')}</span>
            </button>
          </div>
        </div>

        {/* 3x3 Delay Presets Grid */}
        <div className='grid grid-cols-3 gap-2'>
          {delayOptions.map((option) => (
            <div key={option.id} className='card'>
              <button
                type='button'
                className='group btn h-20 flex-col items-center justify-center rounded-xl border-none bg-base-100/70 p-2 shadow-sm transition-all duration-200 hover:bg-base-100'
                onClick={() => void handleDelay(option)}
              >
                <FontAwesomeIcon
                  icon={
                    option.id === 'later_today'
                      ? 'mug-hot'
                      : option.id === 'tonight'
                        ? 'moon'
                        : option.id === 'tomorrow'
                          ? 'cloud-sun'
                          : option.id === 'weekend'
                            ? 'couch'
                            : option.id === 'next_week'
                              ? 'briefcase'
                              : option.id === 'next_month'
                                ? 'envelope'
                                : option.id === 'someday'
                                  ? 'umbrella-beach'
                                  : 'clock'
                  }
                  className='mb-1.5 h-4 w-4 transform text-neutral-400 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:text-delayo-orange'
                />
                <span className='text-center text-xs font-medium text-base-content/80 group-hover:text-base-content'>
                  {option.label}
                </span>
              </button>
            </div>
          ))}

          <div className='card'>
            <Link
              to='/custom-delay'
              className='group btn h-20 flex-col items-center justify-center rounded-xl border-none bg-base-100/70 p-2 shadow-sm transition-all duration-200 hover:bg-base-100'
              onClick={() => {
                void persistSelectedMode();
              }}
            >
              <FontAwesomeIcon
                icon='calendar-days'
                className='mb-1.5 h-4 w-4 transform text-neutral-400 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:text-delayo-orange'
              />
              <span className='text-center text-xs font-medium text-base-content/80 group-hover:text-base-content'>
                {t('popup.delayOptions.custom')}
              </span>
            </Link>
          </div>

          <div className='card'>
            <Link
              to='/recurring-delay'
              className='group btn h-20 flex-col items-center justify-center rounded-xl border-none bg-base-100/70 p-2 shadow-sm transition-all duration-200 hover:bg-base-100'
              onClick={() => {
                void persistSelectedMode();
              }}
            >
              <FontAwesomeIcon
                icon='repeat'
                className='mb-1.5 h-4 w-4 transform text-neutral-400 transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:text-delayo-orange'
              />
              <span className='text-center text-xs font-medium text-base-content/80 group-hover:text-base-content'>
                {t('popup.delayOptions.recurring')}
              </span>
            </Link>
          </div>
        </div>

        {/* Centered Manage Tabs & Centered Donation Button */}
        <div className='mt-3 flex flex-col items-center justify-center gap-1 border-t border-base-200 pt-2'>
          <Link
            to='/manage-tabs'
            className='btn btn-ghost btn-xs text-xs font-medium text-base-content/70 transition-all duration-200 hover:text-delayo-orange sm:btn-sm'
          >
            <FontAwesomeIcon icon='list-ul' className='mr-1.5 h-3.5 w-3.5' />
            {t('popup.actions.manageTabs')}
          </Link>
          <DonationButton isCompact={true} />
        </div>
      </div>
    </div>
  );
}

export default MainView;

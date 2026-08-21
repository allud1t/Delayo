import React, { useCallback, useMemo } from 'react';
import { faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useDelaySettings from '@hooks/useDelaySettings';
import useTabSelection from '@hooks/useTabSelection';
import { Link } from '@tanstack/react-router';
import { DelayOption, TabSelectionMode } from '@types';
import { scheduleTabs } from '@utils/delayedTabsRuntime';
import { createPresetDelayOptions } from '@utils/delayPresets';
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
    i18n.language ||
    document.documentElement.lang ||
    navigator.language ||
    'en';
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
    <div className='card w-[40rem] max-w-full rounded-none bg-base-300 shadow-md'>
      <div className='card-body gap-0 px-6 pb-3 pt-5'>
        {/* Header */}
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='card-title flex items-center font-bold text-delayo-orange'>
            <FontAwesomeIcon
              icon={faHourglassHalf}
              className='mr-2 h-5 w-5 text-delayo-orange'
              aria-hidden='true'
            />
            Delayo
          </h2>
          <div className='flex items-center space-x-2'>
            <Link
              to='/settings'
              className='btn btn-circle btn-ghost btn-sm touch-manipulation transition-colors duration-200 hover:bg-base-100 focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
              aria-label={t('popup.actions.openSettings')}
            >
              <FontAwesomeIcon
                icon='gear'
                className='text-neutral-400 hover:text-delayo-orange'
                aria-hidden='true'
              />
            </Link>
            <button
              type='button'
              className='btn btn-circle btn-ghost btn-sm touch-manipulation transition-colors duration-200 hover:bg-base-100 focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
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
                aria-hidden='true'
              />
            </button>
          </div>
        </div>

        {/* Tab Selection & Tab Info */}
        <div className='mb-3 flex flex-col gap-2'>
          <div className='flex items-center justify-between gap-3'>
            <div className='text-sm font-medium text-base-content/80'>
              {t('popup.delay')}:
            </div>
            <div className='flex gap-2'>
              <button
                type='button'
                className={`btn btn-sm touch-manipulation focus-visible:ring-2 focus-visible:ring-delayo-orange/60 ${selectedMode === 'active' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleModeChange('active')}
              >
                {t('popup.tabs.active')}
              </button>
              <button
                type='button'
                className={`btn btn-sm touch-manipulation focus-visible:ring-2 focus-visible:ring-delayo-orange/60 ${selectedMode === 'highlighted' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleModeChange('highlighted')}
                disabled={highlightedTabs.length <= 1}
              >
                {t('popup.tabs.highlighted')}{' '}
                {highlightedTabs.length > 1
                  ? `(${highlightedTabs.length})`
                  : ''}
              </button>
              <button
                type='button'
                className={`btn btn-sm touch-manipulation focus-visible:ring-2 focus-visible:ring-delayo-orange/60 ${selectedMode === 'window' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => handleModeChange('window')}
              >
                {t('popup.tabs.window')}{' '}
                {allWindowTabs.length > 0 ? `(${allWindowTabs.length})` : ''}
              </button>
            </div>
          </div>

          <div className='rounded-lg bg-base-100/70 px-4 py-3 shadow-sm'>
            {selectedMode === 'active' && activeTab && (
              <div className='flex min-w-0 items-center'>
                {activeTab.favIconUrl && (
                  <img
                    src={activeTab.favIconUrl}
                    alt={t('common.faviconAlt')}
                    width={20}
                    height={20}
                    className='mr-3 h-5 w-5 rounded-sm'
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className='min-w-0 truncate text-sm font-medium text-base-content/80'>
                  {activeTab.title}
                </div>
              </div>
            )}

            {selectedMode === 'highlighted' && (
              <div className='text-sm font-medium text-base-content/80'>
                {highlightedTabs.length}{' '}
                {highlightedTabs.length === 1
                  ? t('common.tabs.singular')
                  : t('common.tabs')}{' '}
                {t('popup.selected')}
              </div>
            )}

            {selectedMode === 'window' && (
              <div className='text-sm font-medium text-base-content/80'>
                {allWindowTabs.length}{' '}
                {allWindowTabs.length === 1
                  ? t('common.tabs.singular')
                  : t('common.tabs')}{' '}
                {t('popup.inWindow')}
              </div>
            )}
          </div>

          <div className='flex items-center'>
            <button
              type='button'
              className='btn btn-sm touch-manipulation border-none bg-delayo-orange font-semibold text-white hover:bg-[#e67300] focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
              onClick={() => void handleQuickTurbo()}
              title={t('popup.quickTurboDesc')}
            >
              <FontAwesomeIcon
                icon='bolt'
                className='mr-1.5 h-3.5 w-3.5 text-white'
                aria-hidden='true'
              />
              <span>{t('popup.quickTurbo')}</span>
            </button>
          </div>
        </div>

        {/* Delay preset grid */}
        <div className='grid grid-cols-3 gap-2.5'>
          {delayOptions.map((option) => (
            <button
              key={option.id}
              type='button'
              className='group btn h-24 touch-manipulation flex-col flex-nowrap items-center justify-center rounded-xl border-none bg-base-100/70 p-3 shadow-sm transition-colors duration-150 hover:bg-base-100 focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
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
                className='mb-2 h-5 w-5 shrink-0 text-neutral-400 transition-colors duration-150 group-hover:text-delayo-orange'
                aria-hidden='true'
              />
              <span className='min-w-0 max-w-full text-balance text-center text-xs font-medium leading-snug text-base-content/80 group-hover:text-base-content'>
                {option.label}
              </span>
            </button>
          ))}

          <Link
            to='/custom-delay'
            className='group btn h-24 touch-manipulation flex-col flex-nowrap items-center justify-center rounded-xl border-none bg-base-100/70 p-3 shadow-sm transition-colors duration-150 hover:bg-base-100 focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
            onClick={() => {
              void persistSelectedMode();
            }}
          >
            <FontAwesomeIcon
              icon='calendar-days'
              className='mb-2 h-5 w-5 shrink-0 text-neutral-400 transition-colors duration-150 group-hover:text-delayo-orange'
              aria-hidden='true'
            />
            <span className='min-w-0 max-w-full text-balance text-center text-xs font-medium leading-snug text-base-content/80 group-hover:text-base-content'>
              {t('popup.delayOptions.custom')}
            </span>
          </Link>

          <Link
            to='/recurring-delay'
            className='group btn h-24 touch-manipulation flex-col flex-nowrap items-center justify-center rounded-xl border-none bg-base-100/70 p-3 shadow-sm transition-colors duration-150 hover:bg-base-100 focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
            onClick={() => {
              void persistSelectedMode();
            }}
          >
            <FontAwesomeIcon
              icon='repeat'
              className='mb-2 h-5 w-5 shrink-0 text-neutral-400 transition-colors duration-150 group-hover:text-delayo-orange'
              aria-hidden='true'
            />
            <span className='min-w-0 max-w-full text-balance text-center text-xs font-medium leading-snug text-base-content/80 group-hover:text-base-content'>
              {t('popup.delayOptions.recurring')}
            </span>
          </Link>
        </div>

        <div className='mt-3 flex items-center justify-between border-t border-base-200 pt-2'>
          <Link
            to='/manage-tabs'
            className='btn btn-ghost btn-sm touch-manipulation text-sm font-medium text-base-content/70 transition-colors duration-200 hover:text-delayo-orange focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
          >
            <FontAwesomeIcon
              icon='list-ul'
              className='mr-2 h-4 w-4'
              aria-hidden='true'
            />
            {t('popup.actions.manageTabs')}
          </Link>
          <DonationButton isCompact={true} />
        </div>
      </div>
    </div>
  );
}

export default MainView;

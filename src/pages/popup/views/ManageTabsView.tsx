import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@tanstack/react-router';
import useDelayedTabs from '@hooks/useDelayedTabs';
import { DelayedTab } from '@types';
import { formatDateTime, formatTimeLeft } from '@utils/dateTime';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { trackTabDeleted, trackTabWoken } from '../../../services/analytics';
import useTheme from '../../../utils/useTheme';

function ManageTabsView(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const { delayedTabs, loading, removeDelayedTabs, wakeDelayedTabs } =
    useDelayedTabs();
  const { theme, toggleTheme } = useTheme();
  const [selectedTabs, setSelectedTabs] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);

  const locale =
    i18n.language || document.documentElement.lang || navigator.language || 'en';
  const timeLeftLabels = useMemo(
    () => ({
      day: t('manageTabs.timeUnits.day'),
      hour: t('manageTabs.timeUnits.hour'),
      minute: t('manageTabs.timeUnits.minute'),
      now: t('manageTabs.now'),
    }),
    [t]
  );

  const wakeTabNow = async (tab: DelayedTab): Promise<void> => {
    void trackTabWoken(1);
    await wakeDelayedTabs([tab.id]);
    setSelectedTabs((current) => current.filter((id) => id !== tab.id));
  };

  const removeTab = async (tab: DelayedTab): Promise<void> => {
    void trackTabDeleted(1);
    await removeDelayedTabs([tab.id]);
    setSelectedTabs((current) => current.filter((id) => id !== tab.id));
  };

  const toggleSelectMode = (): void => {
    setSelectMode((current) => {
      if (current) {
        setSelectedTabs([]);
      }

      return !current;
    });
  };

  const toggleSelectAll = (): void => {
    setSelectedTabs((current) =>
      current.length === delayedTabs.length ? [] : delayedTabs.map((tab) => tab.id)
    );
  };

  const toggleSelectTab = (tabId: string): void => {
    setSelectedTabs((current) =>
      current.includes(tabId)
        ? current.filter((id) => id !== tabId)
        : [...current, tabId]
    );
  };

  const wakeSelectedTabs = async (): Promise<void> => {
    void trackTabWoken(selectedTabs.length);
    await wakeDelayedTabs(selectedTabs);
    setSelectedTabs([]);
  };

  const removeSelectedTabs = async (): Promise<void> => {
    void trackTabDeleted(selectedTabs.length);
    await removeDelayedTabs(selectedTabs);
    setSelectedTabs([]);
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
      <div className='card-body p-6'>
        <div className='mb-5 flex items-center justify-between'>
          <div className='flex items-center'>
            <Link
              to='/'
              className='btn btn-circle btn-ghost btn-sm mr-3 transition-all duration-200 hover:bg-base-100'
              aria-label={t('common.back')}
            >
              <FontAwesomeIcon icon='arrow-left' />
            </Link>
            <h2 className='card-title font-bold text-delayo-orange'>
              {t('manageTabs.title')}
            </h2>
          </div>
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
                theme === 'light' ? 'text-delayo-purple' : 'text-delayo-yellow'
              }
            />
          </button>
        </div>

        {delayedTabs.length === 0 ? (
          <div className='flex flex-col items-center justify-center p-8 text-center'>
            <FontAwesomeIcon
              icon='hourglass-empty'
              className='mb-4 h-12 w-12 text-neutral-400'
            />
            <h3 className='mb-2 text-lg font-medium'>{t('manageTabs.noTabs')}</h3>
            <p className='text-sm text-base-content/70'>
              {t('manageTabs.noDelayedTabs')}
            </p>
          </div>
        ) : (
          <div className='max-h-[400px] overflow-y-auto'>
            <div className='mb-3 flex items-center justify-between'>
              <div className='flex items-center'>
                <button
                  type='button'
                  className={`btn btn-sm ${selectMode ? 'btn-outline' : ''}`}
                  style={
                    !selectMode
                      ? { backgroundColor: '#ffb26f', color: '#3B1B00' }
                      : {}
                  }
                  onClick={toggleSelectMode}
                  title={
                    selectMode
                      ? t('manageTabs.cancelSelection')
                      : t('manageTabs.selectMode')
                  }
                >
                  <FontAwesomeIcon
                    icon={selectMode ? 'times' : 'check-square'}
                    className='mr-2'
                  />
                  {selectMode ? t('manageTabs.cancel') : t('manageTabs.select')}
                </button>
                {selectMode && (
                  <button
                    type='button'
                    className='btn btn-ghost btn-sm ml-2'
                    onClick={toggleSelectAll}
                  >
                    {selectedTabs.length === delayedTabs.length
                      ? t('manageTabs.deselectAll')
                      : t('manageTabs.selectAll')}
                  </button>
                )}
              </div>
              {selectMode && selectedTabs.length > 0 && (
                <div className='flex space-x-2'>
                  <button
                    type='button'
                    className='btn btn-sm'
                    style={{ backgroundColor: '#ffb26f', color: '#3B1B00' }}
                    onClick={() => void wakeSelectedTabs()}
                  >
                    {t('manageTabs.wakeUp')} ({selectedTabs.length})
                  </button>
                  <button
                    type='button'
                    className='btn btn-outline btn-error btn-sm'
                    onClick={() => void removeSelectedTabs()}
                  >
                    {t('manageTabs.remove')} ({selectedTabs.length})
                  </button>
                </div>
              )}
            </div>

            <div className='space-y-3'>
              {delayedTabs.map((tab) => (
                <div
                  key={tab.id}
                  className='flex items-center justify-between rounded-lg bg-base-100/70 p-4 shadow-sm transition-all duration-200 hover:bg-base-100'
                >
                  <div className='flex items-center'>
                    {selectMode && (
                      <button
                        type='button'
                        className='mr-3 cursor-pointer'
                        onClick={() => toggleSelectTab(tab.id)}
                        aria-label={t('manageTabs.toggleSelection')}
                      >
                        <FontAwesomeIcon
                          icon={selectedTabs.includes(tab.id) ? 'check-square' : 'square'}
                          className={
                            selectedTabs.includes(tab.id)
                              ? 'text-delayo-orange'
                              : 'text-base-content/50'
                          }
                          style={{ fontSize: 'large' }}
                        />
                      </button>
                    )}
                    {tab.favicon && (
                      <img
                        src={tab.favicon}
                        alt={t('common.faviconAlt')}
                        className='mr-3 h-5 w-5 rounded-sm'
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                    <div className='mr-4 max-w-[200px]'>
                      <div className='truncate text-sm font-medium text-base-content/80'>
                        {tab.title || t('manageTabs.untitledTab')}
                      </div>
                      <div className='truncate text-xs text-base-content/60'>
                        {formatDateTime(tab.wakeTime, locale)} (
                        {formatTimeLeft(tab.wakeTime, timeLeftLabels)})
                      </div>
                    </div>
                  </div>
                  {!selectMode && (
                    <div className='flex space-x-2'>
                      <button
                        type='button'
                        className='btn btn-sm'
                        style={{ backgroundColor: '#ffb26f', color: '#3B1B00' }}
                        onClick={() => void wakeTabNow(tab)}
                      >
                        {t('manageTabs.wakeUp')}
                      </button>
                      <button
                        type='button'
                        className='btn btn-outline btn-error btn-sm'
                        onClick={() => void removeTab(tab)}
                      >
                        {t('manageTabs.remove')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageTabsView;

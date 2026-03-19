import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@tanstack/react-router';
import useTabSelection from '@hooks/useTabSelection';
import { scheduleTabs } from '@utils/delayedTabsRuntime';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

function CustomDelayView(): React.ReactElement {
  const { t } = useTranslation();
  const {
    activeTab,
    allWindowTabs,
    highlightedTabs,
    loading,
    persistSelectedMode,
    selectedMode,
    tabsToDelay,
  } = useTabSelection();
  const [customDate, setCustomDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  );

  const handleDelay = async (): Promise<void> => {
    if (tabsToDelay.length === 0) {
      return;
    }

    await persistSelectedMode();
    await scheduleTabs(tabsToDelay, new Date(customDate).getTime());
    window.close();
  };

  if (loading) {
    return (
      <div className='flex min-h-[300px] items-center justify-center'>
        <span className='loading loading-spinner loading-lg' />
      </div>
    );
  }

  return (
    <div className='card w-80 rounded-none bg-base-300 shadow-md'>
      <div className='card-body p-6'>
        <div className='mb-5 flex items-center'>
          <Link
            to='/'
            className='btn btn-circle btn-ghost btn-sm mr-3 transition-all duration-200 hover:bg-base-100'
            aria-label={t('common.back')}
          >
            <FontAwesomeIcon icon='arrow-left' />
          </Link>
          <h2 className='card-title font-bold text-delayo-orange'>
            {t('customDelay.title')}
          </h2>
        </div>

        <div className='mb-5'>
          <div className='mb-2 text-sm font-medium text-base-content/80'>
            {t('popup.delay')}:
          </div>
          <div className='rounded-lg bg-base-100/70 p-4 shadow-sm transition-all duration-200 hover:bg-base-100'>
            {selectedMode === 'active' && activeTab && (
              <div className='flex items-center'>
                {activeTab.favIconUrl && (
                  <img
                    src={activeTab.favIconUrl}
                    alt={t('common.faviconAlt')}
                    className='mr-3 h-5 w-5 rounded-sm'
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                )}
                <div className='overflow-hidden'>
                  <div className='truncate text-sm font-medium text-base-content/80'>
                    {activeTab.title}
                  </div>
                  <div className='truncate text-xs text-base-content/60'>
                    {activeTab.url}
                  </div>
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
        </div>

        <div className='form-control'>
          <label className='label'>
            <span className='label-text font-medium'>
              {t('customDelay.selectDateTime')}
            </span>
          </label>
          <input
            type='datetime-local'
            className='input input-bordered w-full border-none bg-base-100/50 shadow-sm transition-all duration-200 focus:bg-base-100/80'
            value={customDate}
            onChange={(event) => setCustomDate(event.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>

        <div className='card-actions mt-6 justify-end'>
          <button
            type='button'
            className='btn btn-primary border-none shadow-sm transition-all duration-200 hover:shadow'
            onClick={() => void handleDelay()}
            disabled={tabsToDelay.length === 0 || !customDate}
          >
            {t('customDelay.delayTab')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomDelayView;

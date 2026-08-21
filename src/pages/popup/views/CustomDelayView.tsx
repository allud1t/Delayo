import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@tanstack/react-router';
import useTabSelection from '@hooks/useTabSelection';
import { scheduleTabs } from '@utils/delayedTabsRuntime';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CustomCalendar from '../../../components/CustomCalendar';
import TimePicker from '../../../components/TimePicker';
import { trackTabDelayed } from '../../../services/analytics';

function CustomDelayView(): React.ReactElement {
  const { i18n, t } = useTranslation();
  const locale =
    i18n.language || document.documentElement.lang || navigator.language || 'pt-BR';

  const {
    activeTab,
    allWindowTabs,
    highlightedTabs,
    loading,
    persistSelectedMode,
    selectedMode,
    tabsToDelay,
  } = useTabSelection();

  // State: selected Date object
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // default tomorrow
    d.setHours(9, 0, 0, 0); // default 09:00
    return d;
  });

  const timeString = useMemo(() => {
    const hours = String(selectedDate.getHours()).padStart(2, '0');
    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }, [selectedDate]);

  const handleTimeChange = (newTime: string) => {
    const [h, m] = newTime.split(':').map((v) => parseInt(v, 10) || 0);
    const updated = new Date(selectedDate);
    updated.setHours(h, m, 0, 0);
    setSelectedDate(updated);
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
  };

  const setOffsetDays = (days: number) => {
    const updated = new Date();
    updated.setDate(updated.getDate() + days);
    updated.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    setSelectedDate(updated);
  };

  const formattedSummary = useMemo(() => {
    return selectedDate.toLocaleDateString(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [selectedDate, locale]);

  const handleDelay = async (): Promise<void> => {
    if (tabsToDelay.length === 0) {
      return;
    }

    await persistSelectedMode();
    void trackTabDelayed({
      presetId: 'custom',
      count: tabsToDelay.length,
      mode: selectedMode,
    });
    await scheduleTabs(tabsToDelay, selectedDate.getTime());
    window.close();
  };

  if (loading) {
    return (
      <div className='flex min-h-[300px] items-center justify-center'>
        <span className='loading loading-spinner loading-lg' />
      </div>
    );
  }

  const isToday =
    new Date().toDateString() === selectedDate.toDateString();
  const isTomorrow =
    new Date(Date.now() + 86400000).toDateString() ===
    selectedDate.toDateString();

  return (
    <div className='card w-[40rem] rounded-none bg-base-300 shadow-md'>
      <div className='card-body p-4 sm:p-5'>
        {/* Header */}
        <div className='mb-3 flex items-center justify-between'>
          <div className='flex items-center'>
            <Link
              to='/'
              className='btn btn-circle btn-ghost btn-sm mr-2.5 transition-all duration-200 hover:bg-base-100'
              aria-label={t('common.back')}
            >
              <FontAwesomeIcon icon='arrow-left' />
            </Link>
            <h2 className='card-title text-base sm:text-lg font-bold text-delayo-orange'>
              {t('customDelay.title')}
            </h2>
          </div>

          <div className='text-xs font-semibold text-base-content/70'>
            {tabsToDelay.length}{' '}
            {tabsToDelay.length === 1
              ? t('common.tabs.singular')
              : t('common.tabs')}
          </div>
        </div>

        {/* Tab Summary Preview */}
        <div className='mb-3 rounded-lg bg-base-100/70 px-3 py-2 shadow-sm'>
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

        {/* Main 2-Column Content */}
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          {/* Left Column: Quick Chips + Calendar */}
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-bold text-base-content/80'>
                {t('customDelay.selectDateTime')}
              </span>
            </div>

            {/* Quick Date Chips */}
            <div className='grid grid-cols-4 gap-1'>
              <button
                type='button'
                className={`btn btn-xs ${isToday ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setOffsetDays(0)}
              >
                {t('settings.laterToday')}
              </button>
              <button
                type='button'
                className={`btn btn-xs ${isTomorrow ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setOffsetDays(1)}
              >
                {t('settings.tomorrow')}
              </button>
              <button
                type='button'
                className='btn btn-xs btn-outline'
                onClick={() => setOffsetDays(2)}
              >
                +2d
              </button>
              <button
                type='button'
                className='btn btn-xs btn-outline'
                onClick={() => setOffsetDays(7)}
              >
                +7d
              </button>
            </div>

            {/* Integrated Custom Calendar */}
            <CustomCalendar
              selectedDate={selectedDate}
              onSelectDate={handleDateChange}
            />
          </div>

          {/* Right Column: Time Selection & Action */}
          <div className='flex flex-col justify-between rounded-xl bg-base-100/50 p-3 border border-base-200/60'>
            <div>
              <span className='mb-2 block text-xs font-bold text-base-content/80'>
                {t('recurringDelay.selectTime')}
              </span>

              <TimePicker
                value={timeString}
                onChange={handleTimeChange}
                isPopup={true}
              />
            </div>

            {/* Summary & Confirmation */}
            <div className='mt-4 flex flex-col gap-2 border-t border-base-200/60 pt-3'>
              <div className='flex items-center justify-between rounded-lg bg-base-200/70 px-3 py-2 text-xs'>
                <span className='font-medium text-base-content/70'>
                  {t('popup.delay')}:
                </span>
                <span className='font-bold text-delayo-orange capitalize'>
                  {formattedSummary}
                </span>
              </div>

              <button
                type='button'
                className='btn btn-primary btn-sm w-full font-semibold'
                onClick={() => void handleDelay()}
                disabled={tabsToDelay.length === 0}
              >
                {t('customDelay.delayTab')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomDelayView;

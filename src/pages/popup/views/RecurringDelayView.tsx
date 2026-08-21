import React, { useEffect, useId, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import useTabSelection from '@hooks/useTabSelection';
import { Link } from '@tanstack/react-router';
import { RecurrencePattern } from '@types';
import { scheduleTabs } from '@utils/delayedTabsRuntime';
import { calculateNextWakeTime } from '@utils/recurrence';
import { useTranslation } from 'react-i18next';

import TimePicker from '../../../components/TimePicker';
import { trackTabDelayed } from '../../../services/analytics';

function FormControl({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className='form-control'>
      <span className='mb-1.5 block text-xs font-bold text-base-content/80'>
        {label}
      </span>
      {children}
    </div>
  );
}

function RecurringDelayView(): React.ReactElement {
  const { t } = useTranslation();
  const patternId = useId();
  const daysOfWeekId = useId();
  const dayOfMonthId = useId();
  const endDateId = useId();
  const {
    activeTab,
    allWindowTabs,
    highlightedTabs,
    loading,
    persistSelectedMode,
    selectedMode,
    tabsToDelay,
  } = useTabSelection();

  const [recurrenceType, setRecurrenceType] =
    useState<RecurrencePattern['type']>('daily');
  const [time, setTime] = useState('09:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [endDate, setEndDate] = useState('');

  const weekDays = useMemo(
    () => [
      { value: 0, label: t('common.weekdaysShort.sunday') },
      { value: 1, label: t('common.weekdaysShort.monday') },
      { value: 2, label: t('common.weekdaysShort.tuesday') },
      { value: 3, label: t('common.weekdaysShort.wednesday') },
      { value: 4, label: t('common.weekdaysShort.thursday') },
      { value: 5, label: t('common.weekdaysShort.friday') },
      { value: 6, label: t('common.weekdaysShort.saturday') },
    ],
    [t]
  );

  useEffect(() => {
    if (recurrenceType === 'daily') {
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      return;
    }

    if (recurrenceType === 'weekdays') {
      setSelectedDays([1, 2, 3, 4, 5]);
      return;
    }

    if (recurrenceType === 'weekly') {
      setSelectedDays([new Date().getDay()]);
    }
  }, [recurrenceType]);

  const toggleDay = (day: number): void => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort()
    );
  };

  const handleDelay = async (): Promise<void> => {
    if (tabsToDelay.length === 0) {
      return;
    }

    const recurrencePattern: RecurrencePattern = {
      type: recurrenceType,
      time,
      daysOfWeek: selectedDays,
      dayOfMonth: recurrenceType === 'monthly' ? dayOfMonth : undefined,
      endDate: endDate ? new Date(endDate).getTime() : undefined,
    };
    const firstWakeTime = calculateNextWakeTime(recurrencePattern);

    if (!firstWakeTime) {
      return;
    }

    await persistSelectedMode();
    void trackTabDelayed({
      presetId: 'recurring',
      count: tabsToDelay.length,
      mode: selectedMode,
    });
    await scheduleTabs(tabsToDelay, firstWakeTime, recurrencePattern);
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
    <div className='card w-[32rem] max-w-full rounded-none bg-base-300 shadow-md'>
      <div className='card-body p-4'>
        {/* Header */}
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center'>
            <Link
              to='/'
              className='btn btn-circle btn-ghost btn-sm mr-2.5 transition-all duration-200 hover:bg-base-100'
              aria-label={t('common.back')}
            >
              <FontAwesomeIcon icon='arrow-left' />
            </Link>
            <h2 className='card-title text-base font-bold text-delayo-orange sm:text-lg'>
              {t('recurringDelay.title')}
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
        <div className='mb-3 rounded-lg border border-base-200/60 bg-base-100/70 px-3 py-2'>
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
        <div className='grid grid-cols-2 items-start gap-3'>
          {/* Left Column: Frequency & Day Selectors */}
          <div className='flex flex-col gap-3 rounded-lg border border-base-200/60 bg-base-100/50 p-3'>
            <FormControl label={t('recurringDelay.frequency')}>
              <select
                id={patternId}
                className='select select-bordered select-sm w-full bg-base-200 font-semibold focus:outline-none'
                value={recurrenceType}
                onChange={(event) =>
                  setRecurrenceType(
                    event.target.value as RecurrencePattern['type']
                  )
                }
              >
                <option value='daily'>{t('recurringDelay.daily')}</option>
                <option value='weekdays'>{t('recurringDelay.weekdays')}</option>
                <option value='weekly'>{t('recurringDelay.weekly')}</option>
                <option value='monthly'>{t('recurringDelay.monthly')}</option>
                <option value='custom'>{t('customDelay.title')}</option>
              </select>
            </FormControl>

            {(recurrenceType === 'weekly' || recurrenceType === 'custom') && (
              <FormControl label={t('recurringDelay.selectDay')}>
                <div
                  id={daysOfWeekId}
                  className='flex flex-wrap justify-between gap-1'
                >
                  {weekDays.map((day) => (
                    <button
                      key={day.value}
                      type='button'
                      className={`btn btn-circle btn-xs h-7 w-7 ${selectedDays.includes(day.value) ? 'btn-primary font-bold' : 'btn-outline'}`}
                      onClick={() => toggleDay(day.value)}
                      aria-label={t('recurringDelay.toggleDay', {
                        day: day.label,
                      })}
                      aria-pressed={selectedDays.includes(day.value)}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </FormControl>
            )}

            {recurrenceType === 'monthly' && (
              <FormControl label={t('recurringDelay.selectDay')}>
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-base-content/70'>Dia:</span>
                  <input
                    id={dayOfMonthId}
                    type='number'
                    className='input input-sm input-bordered w-20 bg-base-200 font-bold'
                    min='1'
                    max='31'
                    value={dayOfMonth}
                    onChange={(event) =>
                      setDayOfMonth(
                        Math.min(
                          31,
                          Math.max(1, parseInt(event.target.value, 10) || 1)
                        )
                      )
                    }
                  />
                  <span className='text-xs text-base-content/70'>
                    de cada mês
                  </span>
                </div>
              </FormControl>
            )}

            <FormControl label={t('manageTabs.endDate')}>
              <input
                id={endDateId}
                type='date'
                className='input input-sm input-bordered w-full bg-base-200 font-medium'
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </FormControl>
          </div>

          <div className='rounded-lg border border-base-200/60 bg-base-100/50 p-3'>
            <span className='mb-2 block text-xs font-bold text-base-content/80'>
              {t('recurringDelay.selectTime')}
            </span>

            <TimePicker value={time} onChange={setTime} isPopup={true} />
          </div>
        </div>

        <div className='mt-3 border-t border-base-200 pt-3'>
          <button
            type='button'
            className='btn btn-primary btn-sm w-full font-semibold'
            onClick={() => void handleDelay()}
            disabled={
              tabsToDelay.length === 0 ||
              (recurrenceType === 'custom' && selectedDays.length === 0)
            }
          >
            {t('recurringDelay.delayTab')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default RecurringDelayView;

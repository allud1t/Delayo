import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@tanstack/react-router';
import useTabSelection from '@hooks/useTabSelection';
import { RecurrencePattern } from '@types';
import { scheduleTabs } from '@utils/delayedTabsRuntime';
import { calculateNextWakeTime } from '@utils/recurrence';
import React, { useEffect, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
      <span className='mb-2 block text-sm font-medium'>{label}</span>
      {children}
    </div>
  );
}

function RecurringDelayView(): React.ReactElement {
  const { t } = useTranslation();
  const patternId = useId();
  const timeId = useId();
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
    <div className='card w-80 rounded-none bg-base-300 shadow-xl'>
      <div className='card-body p-5'>
        <div className='mb-4 flex items-center'>
          <Link
            to='/'
            className='btn btn-circle btn-ghost btn-sm mr-3 transition-all duration-200 hover:bg-base-100'
            aria-label={t('common.back')}
          >
            <FontAwesomeIcon icon='arrow-left' />
          </Link>
          <h2 className='card-title font-bold text-delayo-orange'>
            {t('recurringDelay.title')}
          </h2>
        </div>

        <div className='mb-4'>
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
                    className='mr-3 h-5 w-5'
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

        <FormControl label={t('recurringDelay.frequency')}>
          <select
            id={patternId}
            className='select select-bordered w-full border-none bg-base-100/50 shadow-sm transition-all duration-200 focus:bg-base-100/80'
            value={recurrenceType}
            onChange={(event) =>
              setRecurrenceType(event.target.value as RecurrencePattern['type'])
            }
          >
            <option value='daily'>{t('recurringDelay.daily')}</option>
            <option value='weekdays'>{t('recurringDelay.weekdays')}</option>
            <option value='weekly'>{t('recurringDelay.weekly')}</option>
            <option value='monthly'>{t('recurringDelay.monthly')}</option>
            <option value='custom'>{t('customDelay.title')}</option>
          </select>
        </FormControl>

        <FormControl label={t('recurringDelay.selectTime')}>
          <input
            id={timeId}
            type='time'
            className='input input-bordered w-full border-none bg-base-100/50 shadow-sm transition-all duration-200 focus:bg-base-100/80'
            value={time}
            onChange={(event) => setTime(event.target.value)}
          />
        </FormControl>

        {(recurrenceType === 'weekly' || recurrenceType === 'custom') && (
          <FormControl label={t('recurringDelay.selectDay')}>
            <div
              id={daysOfWeekId}
              className='mt-1 flex flex-wrap justify-between gap-1'
            >
              {weekDays.map((day) => (
                <button
                  key={day.value}
                  type='button'
                  className={`btn btn-circle btn-sm ${selectedDays.includes(day.value) ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => toggleDay(day.value)}
                  aria-label={t('recurringDelay.toggleDay', { day: day.label })}
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
            <input
              id={dayOfMonthId}
              type='number'
              className='input input-bordered w-full border-none bg-base-100/50 shadow-sm transition-all duration-200 focus:bg-base-100/80'
              min='1'
              max='31'
              value={dayOfMonth}
              onChange={(event) =>
                setDayOfMonth(
                  Math.min(31, Math.max(1, parseInt(event.target.value, 10) || 1))
                )
              }
            />
          </FormControl>
        )}

        <FormControl label={t('manageTabs.endDate')}>
          <input
            id={endDateId}
            type='date'
            className='input input-bordered w-full border-none bg-base-100/50 shadow-sm transition-all duration-200 focus:bg-base-100/80'
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </FormControl>

        <div className='card-actions mt-4 justify-end'>
          <button
            type='button'
            className='btn btn-primary'
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

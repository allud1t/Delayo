import React from 'react';
import { useTranslation } from 'react-i18next';
import TimePicker from './TimePicker';

interface DateTimePickerProps {
  value: string; // ISO string or "YYYY-MM-DDTHH:mm"
  onChange: (isoString: string) => void;
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(d: Date): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function DateTimePicker({
  value,
  onChange,
}: DateTimePickerProps): React.ReactElement {
  const { t } = useTranslation();
  const currentDate = new Date(value || Date.now());
  const dateStr = formatDate(currentDate);
  const timeStr = formatTime(currentDate);

  const handleDateChange = (newDateStr: string) => {
    if (!newDateStr) return;
    onChange(`${newDateStr}T${timeStr}`);
  };

  const handleTimeChange = (newTimeStr: string) => {
    onChange(`${dateStr}T${newTimeStr}`);
  };

  const setOffsetDays = (days: number) => {
    const target = new Date();
    target.setDate(target.getDate() + days);
    const targetDateStr = formatDate(target);
    onChange(`${targetDateStr}T${timeStr}`);
  };

  const todayStr = formatDate(new Date());

  return (
    <div className='flex flex-col gap-4'>
      <div className='form-control'>
        <label className='label'>
          <span className='label-text font-medium'>
            {t('customDelay.selectDateTime')}
          </span>
        </label>

        {/* Quick Date Pills */}
        <div className='mb-2 flex flex-wrap gap-1.5'>
          <button
            type='button'
            className={`btn btn-xs ${dateStr === todayStr ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setOffsetDays(0)}
          >
            {t('settings.laterToday')}
          </button>
          <button
            type='button'
            className={`btn btn-xs ${dateStr === formatDate(new Date(Date.now() + 86400000)) ? 'btn-primary' : 'btn-outline'}`}
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
            +1 {t('settings.nextWeek')}
          </button>
        </div>

        {/* Date Input */}
        <input
          type='date'
          className='input input-bordered w-full border-none bg-base-100/50 shadow-sm transition-all duration-200 focus:bg-base-100/80 font-medium'
          value={dateStr}
          min={todayStr}
          onChange={(e) => handleDateChange(e.target.value)}
        />
      </div>

      <div className='form-control'>
        <label className='label'>
          <span className='label-text font-medium'>
            {t('recurringDelay.selectTime')}
          </span>
        </label>
        <TimePicker
          value={timeStr}
          onChange={handleTimeChange}
          isPopup={true}
        />
      </div>
    </div>
  );
}

export default DateTimePicker;

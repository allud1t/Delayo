import React, { useEffect, useState } from 'react';

interface TimePickerProps {
  value: string; // format "HH:mm"
  onChange: (newTime: string) => void;
  isPopup?: boolean;
  className?: string;
}

const QUICK_TIMES = [
  { label: '09:00', value: '09:00' },
  { label: '14:00', value: '14:00' },
  { label: '18:00', value: '18:00' },
  { label: '21:00', value: '21:00' },
];

const formatPart = (rawValue: string, max: number): string => {
  const parsedValue = Number.parseInt(rawValue, 10);
  const safeValue = Number.isNaN(parsedValue)
    ? 0
    : Math.min(max, Math.max(0, parsedValue));

  return String(safeValue).padStart(2, '0');
};

function TimePicker({
  value = '09:00',
  onChange,
  isPopup = false,
  className = '',
}: TimePickerProps): React.ReactElement {
  const [hours, minutes] = (value || '09:00').split(':').map((v) => v || '00');
  const safeHour = formatPart(hours, 23);
  const safeMinute = formatPart(minutes, 59);
  const [hourDraft, setHourDraft] = useState(safeHour);
  const [minuteDraft, setMinuteDraft] = useState(safeMinute);

  useEffect(() => {
    setHourDraft(safeHour);
  }, [safeHour]);

  useEffect(() => {
    setMinuteDraft(safeMinute);
  }, [safeMinute]);

  const commitHour = (rawHour: string) => {
    const nextHour = formatPart(rawHour, 23);
    setHourDraft(nextHour);
    onChange(`${nextHour}:${safeMinute}`);
  };

  const commitMinute = (rawMinute: string) => {
    const nextMinute = formatPart(rawMinute, 59);
    setMinuteDraft(nextMinute);
    onChange(`${safeHour}:${nextMinute}`);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className='flex flex-wrap gap-1'>
        {QUICK_TIMES.map((qt) => (
          <button
            key={qt.value}
            type='button'
            className={`btn btn-xs h-6 min-h-0 touch-manipulation rounded-full px-2.5 font-medium focus-visible:ring-2 focus-visible:ring-delayo-orange/60 ${value === qt.value ? 'btn-primary' : 'btn-ghost border border-base-300 bg-transparent hover:bg-base-200'}`}
            onClick={() => onChange(qt.value)}
          >
            {qt.label}
          </button>
        ))}
      </div>

      <div className='flex items-center gap-1.5 rounded-lg border border-base-200/60 bg-base-100/70 p-1.5'>
        <label className='flex min-w-0 flex-1 items-center rounded-md bg-base-200 px-2'>
          <input
            type='number'
            min='0'
            max='23'
            step='1'
            inputMode='numeric'
            autoComplete='off'
            className={`input input-sm min-w-0 flex-1 border-none bg-transparent px-0 font-semibold text-base-content focus:outline-none focus-visible:ring-2 focus-visible:ring-delayo-orange/60 ${isPopup ? 'h-9 text-sm' : ''}`}
            value={hourDraft}
            onChange={(event) => setHourDraft(event.target.value)}
            onBlur={(event) => commitHour(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commitHour(event.currentTarget.value);
              }
            }}
            aria-label='Horas'
          />
          <span className='shrink-0 text-xs font-semibold text-base-content/60'>
            h
          </span>
        </label>

        <span className='font-bold text-base-content/60'>:</span>

        <label className='flex min-w-0 flex-1 items-center rounded-md bg-base-200 px-2'>
          <input
            type='number'
            min='0'
            max='59'
            step='1'
            inputMode='numeric'
            autoComplete='off'
            className={`input input-sm min-w-0 flex-1 border-none bg-transparent px-0 font-semibold text-base-content focus:outline-none focus-visible:ring-2 focus-visible:ring-delayo-orange/60 ${isPopup ? 'h-9 text-sm' : ''}`}
            value={minuteDraft}
            onChange={(event) => setMinuteDraft(event.target.value)}
            onBlur={(event) => commitMinute(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                commitMinute(event.currentTarget.value);
              }
            }}
            aria-label='Minutos'
          />
          <span className='shrink-0 text-xs font-semibold text-base-content/60'>
            min
          </span>
        </label>
      </div>
    </div>
  );
}

export default TimePicker;

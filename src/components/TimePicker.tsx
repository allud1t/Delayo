import React from 'react';

interface TimePickerProps {
  value: string; // format "HH:mm"
  onChange: (newTime: string) => void;
  isPopup?: boolean;
  className?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = [
  '00',
  '05',
  '10',
  '15',
  '20',
  '25',
  '30',
  '35',
  '40',
  '45',
  '50',
  '55',
];

const QUICK_TIMES = [
  { label: '09:00', value: '09:00' },
  { label: '14:00', value: '14:00' },
  { label: '18:00', value: '18:00' },
  { label: '21:00', value: '21:00' },
];

function TimePicker({
  value = '09:00',
  onChange,
  isPopup = false,
  className = '',
}: TimePickerProps): React.ReactElement {
  const [hours, minutes] = (value || '09:00').split(':').map((v) => v || '00');
  const safeHour = String(parseInt(hours, 10) || 0).padStart(2, '0');
  const safeMinute = String(parseInt(minutes, 10) || 0).padStart(2, '0');

  // If the current minute is not in the standard list, include it in the options
  const minuteOptions = MINUTES.includes(safeMinute)
    ? MINUTES
    : [...MINUTES, safeMinute].sort(
        (a, b) => parseInt(a, 10) - parseInt(b, 10)
      );

  const handleHourChange = (newHour: string) => {
    onChange(`${newHour}:${safeMinute}`);
  };

  const handleMinuteChange = (newMinute: string) => {
    onChange(`${safeHour}:${newMinute}`);
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className='flex items-center gap-1.5 rounded-lg border border-base-200/60 bg-base-100/70 p-1.5'>
        <select
          className={`select select-bordered select-sm min-w-0 flex-1 border-none bg-base-200 font-semibold focus:outline-none ${isPopup ? 'h-9 text-sm' : ''}`}
          value={safeHour}
          onChange={(e) => handleHourChange(e.target.value)}
          aria-label='Horas'
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h} h
            </option>
          ))}
        </select>

        <span className='font-bold text-base-content/60'>:</span>

        <select
          className={`select select-bordered select-sm min-w-0 flex-1 border-none bg-base-200 font-semibold focus:outline-none ${isPopup ? 'h-9 text-sm' : ''}`}
          value={safeMinute}
          onChange={(e) => handleMinuteChange(e.target.value)}
          aria-label='Minutos'
        >
          {minuteOptions.map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </select>
      </div>

      <div className='grid grid-cols-2 gap-1'>
        {QUICK_TIMES.map((qt) => (
          <button
            key={qt.value}
            type='button'
            className={`btn btn-xs ${value === qt.value ? 'btn-primary' : 'btn-ghost border border-base-200/60 bg-base-100/50'}`}
            onClick={() => onChange(qt.value)}
          >
            {qt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TimePicker;

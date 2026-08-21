import React, { useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useTranslation } from 'react-i18next';

interface CustomCalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  minDate?: Date;
  className?: string;
}

function CustomCalendar({
  selectedDate,
  onSelectDate,
  minDate = new Date(),
  className = '',
}: CustomCalendarProps): React.ReactElement {
  const { i18n, t } = useTranslation();
  const locale =
    i18n.language ||
    document.documentElement.lang ||
    navigator.language ||
    'pt-BR';

  // Navigation state (month and year currently being viewed)
  const [viewDate, setViewDate] = useState<Date>(
    () => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  const startOfMinDate = useMemo(() => {
    const d = new Date(minDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [minDate]);

  const monthYearLabel = useMemo(() => {
    return viewDate.toLocaleDateString(locale, {
      month: 'long',
      year: 'numeric',
    });
  }, [viewDate, locale]);

  const weekdays = useMemo(() => {
    // Generate short weekday labels starting from Sunday (0) to Saturday (6)
    const baseSunday = new Date(2023, 0, 1); // Jan 1 2023 was Sunday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(baseSunday);
      d.setDate(baseSunday.getDate() + i);
      return d.toLocaleDateString(locale, { weekday: 'narrow' }).toUpperCase();
    });
  }, [locale]);

  const daysInGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);

    // Prev month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDate - i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        isCurrentMonth: false,
        isDisabled: d < startOfMinDate,
        isSelected: d.getTime() === sel.getTime(),
        isToday: d.getTime() === today.getTime(),
      });
    }

    // Current month days
    for (let day = 1; day <= lastDate; day++) {
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        isCurrentMonth: true,
        isDisabled: d < startOfMinDate,
        isSelected: d.getTime() === sel.getTime(),
        isToday: d.getTime() === today.getTime(),
      });
    }

    // Next month padding days to complete 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        isCurrentMonth: false,
        isDisabled: d < startOfMinDate,
        isSelected: d.getTime() === sel.getTime(),
        isToday: d.getTime() === today.getTime(),
      });
    }

    return days;
  }, [viewDate, selectedDate, startOfMinDate]);

  const handlePrevMonth = () => {
    setViewDate((curr) => new Date(curr.getFullYear(), curr.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate((curr) => new Date(curr.getFullYear(), curr.getMonth() + 1, 1));
  };

  const handleSelect = (d: Date) => {
    // Preserve hours and minutes from selectedDate
    const newSelected = new Date(d);
    newSelected.setHours(
      selectedDate.getHours(),
      selectedDate.getMinutes(),
      selectedDate.getSeconds(),
      0
    );
    onSelectDate(newSelected);
  };

  return (
    <div
      className={`rounded-lg border border-base-200/60 bg-base-100/70 p-3 ${className}`}
    >
      {/* Calendar Header */}
      <div className='mb-2 flex items-center justify-between px-1'>
        <button
          type='button'
          className='btn btn-circle btn-ghost btn-xs touch-manipulation text-base-content/70 hover:bg-base-200 hover:text-delayo-orange focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
          onClick={handlePrevMonth}
          aria-label={t('common.previous') || 'Anterior'}
        >
          <FontAwesomeIcon
            icon='chevron-left'
            className='h-3 w-3'
            aria-hidden='true'
          />
        </button>

        <span className='text-xs font-bold capitalize text-base-content'>
          {monthYearLabel}
        </span>

        <button
          type='button'
          className='btn btn-circle btn-ghost btn-xs touch-manipulation text-base-content/70 hover:bg-base-200 hover:text-delayo-orange focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
          onClick={handleNextMonth}
          aria-label={t('common.next') || 'Próximo'}
        >
          <FontAwesomeIcon
            icon='chevron-right'
            className='h-3 w-3'
            aria-hidden='true'
          />
        </button>
      </div>

      {/* Weekday headers */}
      <div className='mb-1 grid grid-cols-7 text-center'>
        {weekdays.map((day, idx) => (
          <span
            key={`${day}-${idx}`}
            className='text-[10px] font-semibold text-base-content/50'
          >
            {day}
          </span>
        ))}
      </div>

      {/* Days grid */}
      <div className='grid grid-cols-7 gap-1 text-center'>
        {daysInGrid.map((item, idx) => {
          const dayNumber = item.date.getDate();

          let btnClass =
            'h-7 w-7 rounded-lg text-xs font-medium flex items-center justify-center mx-auto';

          if (item.isSelected) {
            btnClass += ' bg-delayo-orange text-white font-bold shadow-sm';
          } else if (item.isDisabled) {
            btnClass += ' opacity-25 cursor-not-allowed text-base-content/40';
          } else if (item.isToday) {
            btnClass +=
              ' border border-delayo-orange/60 font-bold text-delayo-orange hover:bg-delayo-orange/10';
          } else if (!item.isCurrentMonth) {
            btnClass += ' opacity-40 hover:bg-base-200 text-base-content/60';
          } else {
            btnClass += ' hover:bg-base-200 text-base-content/90';
          }

          return (
            <button
              key={`${item.date.toISOString()}-${idx}`}
              type='button'
              disabled={item.isDisabled}
              className={btnClass}
              onClick={() => handleSelect(item.date)}
            >
              {dayNumber}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CustomCalendar;

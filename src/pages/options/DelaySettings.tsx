import useDelaySettings from '@hooks/useDelaySettings';
import React, { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isAnalyticsEnabled, setAnalyticsEnabled } from '../../services/analytics';

const getInputClasses = (isPopup: boolean): string =>
  `input input-bordered ${isPopup ? 'h-12 rounded-lg bg-base-100/70 p-4 shadow-sm transition-all duration-200 hover:bg-base-100' : ''}`;

const getRadioClasses = (isPopup: boolean): string =>
  `radio radio-primary ${isPopup ? 'transition-all duration-200' : ''}`;

const getSelectClasses = (isPopup: boolean): string =>
  `select select-bordered ${isPopup ? 'rounded-lg bg-base-100/70 shadow-sm transition-all duration-200 hover:bg-base-100' : ''}`;

interface DelaySettingsComponentProps {
  isPopup?: boolean;
}

function DelaySettingsComponent({
  isPopup = false,
}: DelaySettingsComponentProps): React.ReactElement {
  const { t } = useTranslation();
  const analyticsToggleId = useId();
  const { loading, resetSettings, saveSettings, settings, updateSetting } =
    useDelaySettings();
  const [saved, setSaved] = useState(false);
  const [analyticsActive, setAnalyticsActive] = useState(true);

  useEffect(() => {
    void isAnalyticsEnabled().then(setAnalyticsActive);
  }, []);

  useEffect(() => {
    if (!saved) {
      return undefined;
    }

    const timeout = window.setTimeout(() => setSaved(false), 2000);

    return () => window.clearTimeout(timeout);
  }, [saved]);

  const handleSave = async (): Promise<void> => {
    await saveSettings();
    await setAnalyticsEnabled(analyticsActive);
    setSaved(true);
  };

  if (loading) {
    return (
      <div className='p-8 text-center'>
        <span className='loading loading-spinner loading-lg' />
      </div>
    );
  }

  return (
    <div
      className={`card mx-auto w-full max-w-4xl bg-base-300 ${!isPopup ? 'border border-base-300 shadow-sm transition-shadow duration-300 hover:shadow-md' : ''}`}
    >
      <div className='card-body p-6 sm:p-8'>
        <h2 className='card-title mb-4'>{t('settings.defaultDelayOptions')}</h2>

        <div className='space-y-4'>
          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>
                {t('settings.laterToday')}
              </span>
            </label>
            <div className='flex items-center'>
              <input
                type='number'
                className={`${getInputClasses(isPopup)} w-20`}
                min='1'
                max='12'
                value={settings.laterToday}
                onChange={(event) =>
                  updateSetting(
                    'laterToday',
                    parseInt(event.target.value, 10) || 1
                  )
                }
              />
              <span className='ml-2'>{t('settings.hours')}</span>
            </div>
          </div>

          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>{t('settings.tonight')}</span>
            </label>
            <input
              type='time'
              className={`${getInputClasses(isPopup)} w-full max-w-72`}
              value={settings.tonightTime}
              onChange={(event) => updateSetting('tonightTime', event.target.value)}
              style={{ appearance: 'none' }}
            />
          </div>

          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>
                {t('settings.tomorrow')}
              </span>
            </label>
            <input
              type='time'
              className={`${getInputClasses(isPopup)} w-full max-w-72`}
              value={settings.tomorrowTime}
              onChange={(event) =>
                updateSetting('tomorrowTime', event.target.value)
              }
              style={{ appearance: 'none' }}
            />
          </div>

          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>{t('settings.weekend')}</span>
            </label>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <select
                className={`${getSelectClasses(isPopup)} w-full max-w-72`}
                value={settings.weekendDay}
                onChange={(event) =>
                  updateSetting(
                    'weekendDay',
                    event.target.value as 'saturday' | 'sunday'
                  )
                }
              >
                <option value='saturday'>{t('popup.weekdays.saturday')}</option>
                <option value='sunday'>{t('popup.weekdays.sunday')}</option>
              </select>
              <input
                type='time'
                className={`${getInputClasses(isPopup)} w-full max-w-72`}
                value={settings.weekendTime}
                onChange={(event) =>
                  updateSetting('weekendTime', event.target.value)
                }
                style={{ appearance: 'none' }}
              />
            </div>
          </div>

          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>{t('settings.nextWeek')}</span>
            </label>
            <div className='mb-2 flex items-center'>
              <div className='form-control'>
                <label className='label cursor-pointer'>
                  <input
                    type='radio'
                    name='nextWeekOption'
                    className={getRadioClasses(isPopup)}
                    checked={settings.nextWeekSameDay}
                    onChange={() => updateSetting('nextWeekSameDay', true)}
                  />
                  <span className='label-text ml-2'>
                    {t('settings.sameDayOfWeek')}
                  </span>
                </label>
              </div>
              <div className='form-control ml-4'>
                <label className='label cursor-pointer'>
                  <input
                    type='radio'
                    name='nextWeekOption'
                    className={getRadioClasses(isPopup)}
                    checked={!settings.nextWeekSameDay}
                    onChange={() => updateSetting('nextWeekSameDay', false)}
                  />
                  <span className='label-text ml-2'>
                    {t('settings.specificDay')}
                  </span>
                </label>
              </div>
            </div>

            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              {!settings.nextWeekSameDay && (
                <select
                  className={`${getSelectClasses(isPopup)} w-full max-w-72`}
                  value={settings.nextWeekDay}
                  onChange={(event) =>
                    updateSetting('nextWeekDay', parseInt(event.target.value, 10))
                  }
                >
                  <option value='0'>{t('popup.weekdays.sunday')}</option>
                  <option value='1'>{t('popup.weekdays.monday')}</option>
                  <option value='2'>{t('popup.weekdays.tuesday')}</option>
                  <option value='3'>{t('popup.weekdays.wednesday')}</option>
                  <option value='4'>{t('popup.weekdays.thursday')}</option>
                  <option value='5'>{t('popup.weekdays.friday')}</option>
                  <option value='6'>{t('popup.weekdays.saturday')}</option>
                </select>
              )}
              <input
                type='time'
                className={`${getInputClasses(isPopup)} w-full max-w-72`}
                value={settings.nextWeekTime}
                onChange={(event) =>
                  updateSetting('nextWeekTime', event.target.value)
                }
                style={{ appearance: 'none' }}
              />
            </div>
          </div>

          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>
                {t('settings.nextMonth')}
              </span>
            </label>
            <div className='flex items-center'>
              <div className='form-control'>
                <label className='label cursor-pointer'>
                  <input
                    type='radio'
                    name='nextMonthOption'
                    className={getRadioClasses(isPopup)}
                    checked={settings.nextMonthSameDay}
                    onChange={() => updateSetting('nextMonthSameDay', true)}
                  />
                  <span className='label-text ml-2'>
                    {t('settings.sameDayOfMonth')}
                  </span>
                </label>
              </div>
              <div className='form-control ml-4'>
                <label className='label cursor-pointer'>
                  <input
                    type='radio'
                    name='nextMonthOption'
                    className={getRadioClasses(isPopup)}
                    checked={!settings.nextMonthSameDay}
                    onChange={() => updateSetting('nextMonthSameDay', false)}
                  />
                  <span className='label-text ml-2'>
                    {t('settings.sameDayOfWeek')}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className='form-control'>
            <label className='label'>
              <span className='label-text font-medium'>{t('settings.someday')}</span>
            </label>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
              <div>
                <label className='label'>
                  <span className='label-text'>{t('settings.minMonths')}</span>
                </label>
                <input
                  type='number'
                  className={`${getInputClasses(isPopup)} w-20`}
                  min='1'
                  max='12'
                  value={settings.somedayMinMonths}
                  onChange={(event) =>
                    updateSetting(
                      'somedayMinMonths',
                      parseInt(event.target.value, 10) || 1
                    )
                  }
                />
              </div>
              <div>
                <label className='label'>
                  <span className='label-text'>{t('settings.maxMonths')}</span>
                </label>
                <input
                  type='number'
                  className={`${getInputClasses(isPopup)} w-20`}
                  min={settings.somedayMinMonths + 1}
                  max='36'
                  value={settings.somedayMaxMonths}
                  onChange={(event) =>
                    updateSetting(
                      'somedayMaxMonths',
                      parseInt(event.target.value, 10) ||
                        settings.somedayMinMonths + 1
                    )
                  }
                />
              </div>
            </div>
          </div>

          <div className='form-control pt-2 border-t border-base-200'>
            <label htmlFor={analyticsToggleId} className='label cursor-pointer justify-between'>
              <div className='flex flex-col pr-4'>
                <span className='label-text font-medium'>
                  {t('settings.analytics.title')}
                </span>
                <span className='text-xs text-base-content/60'>
                  {t('settings.analytics.description')}
                </span>
              </div>
              <input
                id={analyticsToggleId}
                type='checkbox'
                className='toggle toggle-primary'
                checked={analyticsActive}
                onChange={(e) => setAnalyticsActive(e.target.checked)}
                aria-label={t('settings.analytics.title')}
              />
            </label>
          </div>
        </div>

        <div className='card-actions mt-6 justify-end'>
          <button
            type='button'
            className='btn btn-outline'
            onClick={resetSettings}
          >
            {t('settings.reset')}
          </button>
          <button type='button' className='btn btn-primary' onClick={handleSave}>
            {t('common.save')}
          </button>
        </div>

        {saved && (
          <div className='mt-4 text-center text-success'>
            {t('settings.saved')}
          </div>
        )}
      </div>
    </div>
  );
}

export default DelaySettingsComponent;

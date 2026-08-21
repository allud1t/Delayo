import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import DonationButton from '../../../components/DonationButton';
import useTheme from '../../../utils/useTheme';
import DelaySettingsComponent from '../../options/DelaySettings';

function SettingsView(): React.ReactElement {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className='card w-[40rem] max-w-full rounded-none bg-base-300 shadow-md'>
      <div className='card-body p-6'>
        <div className='mb-5 flex items-center justify-between'>
          <div className='flex items-center'>
            <Link
              to='/'
              className='btn btn-circle btn-ghost btn-sm mr-3 touch-manipulation transition-colors duration-200 hover:bg-base-100 focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
              aria-label={t('common.back')}
            >
              <FontAwesomeIcon icon='arrow-left' aria-hidden='true' />
            </Link>
            <h2 className='card-title font-bold text-delayo-orange'>
              {t('common.settings')}
            </h2>
          </div>
          <button
            type='button'
            className='btn btn-circle btn-ghost btn-sm touch-manipulation transition-colors duration-200 hover:bg-base-100 focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
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
              aria-hidden='true'
            />
          </button>
        </div>

        <div className='flex flex-col'>
          <div className='max-h-[350px] overflow-y-auto pb-2 pr-2'>
            <DelaySettingsComponent isPopup={true} />
          </div>

          <div className='mt-3 flex justify-center border-t border-base-200 pt-3'>
            <DonationButton isCompact={true} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsView;

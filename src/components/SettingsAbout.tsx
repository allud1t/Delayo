import React from 'react';
import { useTranslation } from 'react-i18next';

import { PROJECT_LINKS } from '../utils/projectLinks';

function SettingsAbout(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <section className='card w-full border border-base-300 bg-base-300 shadow-sm'>
      <div className='card-body p-6'>
        <h3 className='card-title text-lg text-delayo-orange'>
          {t('settings.about.title')}
        </h3>
        <p className='mt-2 text-sm leading-relaxed text-base-content/70'>
          {t('settings.about.description')}
        </p>

        <div className='mt-5 grid gap-2'>
          <a
            href={PROJECT_LINKS.repository}
            target='_blank'
            rel='noopener noreferrer'
            className='btn btn-outline btn-sm touch-manipulation justify-start focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
          >
            {t('options.links.repository')}
          </a>
          <a
            href={PROJECT_LINKS.features}
            target='_blank'
            rel='noopener noreferrer'
            className='btn btn-ghost btn-sm touch-manipulation justify-start text-left focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
          >
            {t('options.links.features')}
          </a>
          <a
            href={PROJECT_LINKS.issues}
            target='_blank'
            rel='noopener noreferrer'
            className='btn btn-ghost btn-sm touch-manipulation justify-start text-left focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
          >
            {t('options.links.issues')}
          </a>
        </div>
      </div>
    </section>
  );
}

export default SettingsAbout;

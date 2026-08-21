import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import DonationButton from '../../../components/DonationButton';
import LanguageSelector from '../../../components/LanguageSelector';
import ProductivityStats from '../../../components/ProductivityStats';
import SettingsAbout from '../../../components/SettingsAbout';
import useTheme from '../../../utils/useTheme';
import DelaySettingsComponent from '../../options/DelaySettings';

const SETTINGS_SECTIONS = ['general', 'stats', 'about'] as const;
type SettingsSection = (typeof SETTINGS_SECTIONS)[number];

function SettingsView(): React.ReactElement {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [activeSection, setActiveSection] =
    useState<SettingsSection>('general');
  const tabRefs = useRef<Record<SettingsSection, HTMLButtonElement | null>>({
    general: null,
    stats: null,
    about: null,
  });

  const getSectionLabel = (section: SettingsSection): string =>
    t(`settings.tabs.${section}`);

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>
  ): void => {
    const currentIndex = SETTINGS_SECTIONS.indexOf(activeSection);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % SETTINGS_SECTIONS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex =
        (currentIndex - 1 + SETTINGS_SECTIONS.length) %
        SETTINGS_SECTIONS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = SETTINGS_SECTIONS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextSection = SETTINGS_SECTIONS[nextIndex];
    setActiveSection(nextSection);
    window.requestAnimationFrame(() => tabRefs.current[nextSection]?.focus());
  };

  const isSectionActive = (section: SettingsSection): boolean =>
    activeSection === section;

  return (
    <div className='card w-[40rem] max-w-full overflow-hidden rounded-none bg-base-300 shadow-md'>
      <div className='card-body p-6'>
        <div className='mb-5 flex items-center justify-between'>
          <div className='flex items-center'>
            <Link
              to='/'
              className='btn btn-circle btn-ghost btn-sm mr-3 touch-manipulation transition-colors duration-200 motion-reduce:transition-none hover:bg-base-100 focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
              aria-label={t('common.back')}
            >
              <FontAwesomeIcon icon='arrow-left' aria-hidden='true' />
            </Link>
            <h2 className='card-title text-balance font-bold text-delayo-orange'>
              {t('common.settings')}
            </h2>
          </div>
          <button
            type='button'
            className='btn btn-circle btn-ghost btn-sm touch-manipulation transition-colors duration-200 motion-reduce:transition-none hover:bg-base-100 focus-visible:ring-2 focus-visible:ring-delayo-orange/60'
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

        <div
          className='tabs mb-4 w-full overflow-x-auto border-b border-base-200'
          role='tablist'
          aria-label={t('settings.tabs.label')}
        >
          {SETTINGS_SECTIONS.map((section) => {
            const active = isSectionActive(section);
            const label = getSectionLabel(section);

            return (
              <button
                key={section}
                ref={(element) => {
                  tabRefs.current[section] = element;
                }}
                type='button'
                role='tab'
                id={`settings-tab-${section}`}
                aria-controls={`settings-panel-${section}`}
                aria-selected={active}
                tabIndex={active ? 0 : -1}
                className={`tab min-h-10 shrink-0 touch-manipulation whitespace-nowrap px-3 text-sm font-bold transition-colors duration-200 motion-reduce:transition-none focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-delayo-orange/60 ${active ? 'tab-active !border-b-[3px] !border-delayo-orange text-base-content' : 'border-transparent text-base-content/60 hover:border-base-content/30 hover:text-base-content'}`}
                onClick={() => setActiveSection(section)}
                onKeyDown={handleTabKeyDown}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className='max-h-[min(70vh,32rem)] min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pr-1'>
          <section
            id='settings-panel-general'
            role='tabpanel'
            aria-labelledby='settings-tab-general'
            tabIndex={0}
            hidden={!isSectionActive('general')}
            className='space-y-4'
          >
            <DelaySettingsComponent isPopup={true} />
            <p className='-mt-2 text-xs leading-relaxed text-base-content/60'>
              {t('settings.saveDescription')}
            </p>

            <div className='card w-full border border-base-300 bg-base-300 shadow-sm'>
              <div className='card-body p-6'>
                <h3 className='card-title text-base text-delayo-orange'>
                  {t('settings.language')}
                </h3>
                <p className='mt-1 text-sm leading-relaxed text-base-content/70'>
                  {t('settings.languageDescription')}
                </p>
                <label
                  htmlFor='settings-language-select'
                  className='label mt-3 px-0 pb-1'
                >
                  <span className='label-text font-medium'>
                    {t('settings.language')}
                  </span>
                </label>
                <LanguageSelector
                  id='settings-language-select'
                  className='max-w-none'
                />
              </div>
            </div>
          </section>

          <section
            id='settings-panel-stats'
            role='tabpanel'
            aria-labelledby='settings-tab-stats'
            tabIndex={0}
            hidden={!isSectionActive('stats')}
          >
            <ProductivityStats showAnalyticsToggle={false} />
          </section>

          <section
            id='settings-panel-about'
            role='tabpanel'
            aria-labelledby='settings-tab-about'
            tabIndex={0}
            hidden={!isSectionActive('about')}
          >
            <SettingsAbout />
          </section>
        </div>

        <div className='mt-3 flex justify-center border-t border-base-200 pt-3'>
          <DonationButton isCompact={true} />
        </div>
      </div>
    </div>
  );
}

export default SettingsView;

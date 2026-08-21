import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@types';
import {
  normalizeLanguageCode,
  setSavedLanguage,
} from '@utils/extensionStorage';
import React, { useId } from 'react';
import { useTranslation } from 'react-i18next';

interface LanguageSelectorProps {
  id?: string;
  className?: string;
}

function LanguageSelector({
  id,
  className = '',
}: LanguageSelectorProps): React.ReactElement {
  const { i18n, t } = useTranslation();
  const generatedId = useId();
  const currentLanguage =
    normalizeLanguageCode(i18n.language) ?? SUPPORTED_LANGUAGES[0];
  const selectId = id ?? generatedId;

  const changeLanguage = (
    event: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    const nextLanguage = event.target.value as SupportedLanguage;
    void i18n.changeLanguage(nextLanguage);
    void setSavedLanguage(nextLanguage);
  };

  return (
    <div className={`form-control w-full max-w-xs ${className}`}>
      <select
        id={selectId}
        className='select select-bordered w-full'
        name='language'
        value={currentLanguage}
        onChange={changeLanguage}
        aria-label={t('settings.language')}
        autoComplete='off'
      >
        <option value='en'>{t('common.languages.en')}</option>
        <option value='pt'>{t('common.languages.pt')}</option>
        <option value='es'>{t('common.languages.es')}</option>
      </select>
    </div>
  );
}

export default LanguageSelector;

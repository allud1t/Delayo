import { SUPPORTED_LANGUAGES, SupportedLanguage } from '@types';
import {
  normalizeLanguageCode,
  setSavedLanguage,
} from '@utils/extensionStorage';
import React from 'react';
import { useTranslation } from 'react-i18next';

function LanguageSelector(): React.ReactElement {
  const { i18n, t } = useTranslation();
  const currentLanguage =
    normalizeLanguageCode(i18n.language) ?? SUPPORTED_LANGUAGES[0];

  const changeLanguage = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    const nextLanguage = event.target.value as SupportedLanguage;
    void i18n.changeLanguage(nextLanguage);
    void setSavedLanguage(nextLanguage);
  };

  return (
    <div className='form-control w-full max-w-xs'>
      <select
        className='select select-bordered w-full'
        value={currentLanguage}
        onChange={changeLanguage}
      >
        <option value='en'>{t('common.languages.en')}</option>
        <option value='pt'>{t('common.languages.pt')}</option>
        <option value='es'>{t('common.languages.es')}</option>
      </select>
    </div>
  );
}

export default LanguageSelector;

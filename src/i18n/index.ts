import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { normalizeLanguageCode, getSavedLanguage } from '@utils/extensionStorage';
import translationEN from './locales/en/translation.json';
import translationES from './locales/es/translation.json';
import translationPT from './locales/pt/translation.json';

type TranslationResource = typeof translationEN;

const namespaces = [
  'common',
  'popup',
  'customDelay',
  'recurringDelay',
  'settings',
  'manageTabs',
  'donation',
  'onboarding',
  'options',
] as const;

function buildResources(translation: TranslationResource) {
  return {
    translation,
    common: translation.common,
    popup: translation.popup,
    customDelay: translation.customDelay,
    recurringDelay: translation.recurringDelay,
    settings: translation.settings,
    manageTabs: translation.manageTabs,
    donation: translation.donation,
    onboarding: translation.onboarding,
    options: translation.options,
  };
}

const resources = {
  en: buildResources(translationEN),
  pt: buildResources(translationPT),
  es: buildResources(translationES),
};

function getDefaultLanguage(): 'en' | 'pt' | 'es' {
  return normalizeLanguageCode(navigator.language) ?? 'en';
}

function applyDocumentLanguage(language: string): void {
  const normalizedLanguage = normalizeLanguageCode(language) ?? 'en';
  document.documentElement.lang = normalizedLanguage;
}

async function initI18n(): Promise<void> {
  const savedLanguage = await getSavedLanguage();
  const initialLanguage = savedLanguage ?? getDefaultLanguage();

  await i18n.use(initReactI18next).init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    defaultNS: 'translation',
    ns: ['translation', ...namespaces],
    fallbackNS: ['translation', 'common'],
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
  });

  applyDocumentLanguage(i18n.language);
  i18n.on('languageChanged', applyDocumentLanguage);
}

void initI18n();

export default i18n;

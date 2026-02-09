import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import enNav from './locales/en/nav.json';
import enAuth from './locales/en/auth.json';
import enErrors from './locales/en/errors.json';
import enPages from './locales/en/pages.json';
import idCommon from './locales/id/common.json';
import idNav from './locales/id/nav.json';
import idAuth from './locales/id/auth.json';
import idErrors from './locales/id/errors.json';
import idPages from './locales/id/pages.json';

const resources = {
  en: {
    common: enCommon,
    nav: enNav,
    auth: enAuth,
    errors: enErrors,
    pages: enPages,
  },
  id: {
    common: idCommon,
    nav: idNav,
    auth: idAuth,
    errors: idErrors,
    pages: idPages,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'id'],
    defaultNS: 'common',
    ns: ['common', 'nav', 'auth', 'errors', 'pages'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;

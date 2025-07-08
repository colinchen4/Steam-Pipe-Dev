import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import zhTranslations from './locales/zh.json';

const resources = {
  en: {
    translation: enTranslations
  },
  zh: {
    translation: zhTranslations
  }
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n down to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language if detection fails
    debug: false, // Set to true for development debugging
    
    interpolation: {
      escapeValue: false // React already does escaping
    },

    // Language detection configuration
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'steampipe-language',
    }
  });

export default i18n;
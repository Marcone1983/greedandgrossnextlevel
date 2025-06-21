import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import it from '../locales/it.json';
import en from '../locales/en.json';
import es from '../locales/es.json';
import de from '../locales/de.json';
import fr from '../locales/fr.json';

const LANGUAGE_KEY = '@greedgross:language';

// Define available languages
export const LANGUAGES = {
  it: { name: 'Italiano', flag: '🇮🇹', nativeName: 'Italiano' },
  en: { name: 'English', flag: '🇺🇸', nativeName: 'English' },
  es: { name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  de: { name: 'Deutsch', flag: '🇩🇪', nativeName: 'Deutsch' },
  fr: { name: 'Français', flag: '🇫🇷', nativeName: 'Français' },
} as const;

export type SupportedLanguage = keyof typeof LANGUAGES;

// Get device language
const getDeviceLanguage = (): SupportedLanguage => {
  const locales = RNLocalize.getLocales();
  const supportedLanguages = Object.keys(LANGUAGES) as SupportedLanguage[];

  for (const locale of locales) {
    const language = locale.languageCode as SupportedLanguage;
    if (supportedLanguages.includes(language)) {
      return language;
    }
  }

  // Fallback to English
  return 'en';
};

// Get saved language from storage
const getSavedLanguage = async (): Promise<SupportedLanguage> => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (savedLanguage && Object.keys(LANGUAGES).includes(savedLanguage)) {
      return savedLanguage as SupportedLanguage;
    }
  } catch (error) {
    console.warn('Error reading saved language:', error);
  }

  return getDeviceLanguage();
};

// Save language to storage
export const saveLanguage = async (language: SupportedLanguage): Promise<void> => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, language);
  } catch (error) {
    console.warn('Error saving language:', error);
  }
};

// Change language
export const changeLanguage = async (language: SupportedLanguage): Promise<void> => {
  await saveLanguage(language);
  await i18n.changeLanguage(language);
};

// Initialize i18n
const initI18n = async () => {
  const savedLanguage = await getSavedLanguage();

  i18n.use(initReactI18next).init({
    resources: {
      it: { translation: it },
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
      fr: { translation: fr },
    },
    lng: savedLanguage,
    fallbackLng: 'en',

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },

    debug: __DEV__,
  });

  return savedLanguage;
};

export { initI18n };
export default i18n;

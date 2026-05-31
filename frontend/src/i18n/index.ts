import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import kk from './kk';
import ru from './ru';
import en from './en';

const saved = localStorage.getItem('lang') || 'kk';

i18n.use(initReactI18next).init({
  resources: { kk: { translation: kk }, ru: { translation: ru }, en: { translation: en } },
  lng: saved,
  fallbackLng: 'kk',
  interpolation: { escapeValue: false },
});

export default i18n;

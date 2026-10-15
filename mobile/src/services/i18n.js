import en from '../i18n/en.json';
import hi from '../i18n/hi.json';
import ta from '../i18n/ta.json';

const packs = { en, ta, hi };

export function t(language, key) {
  return packs[language]?.[key] || packs.en[key] || key;
}

export const languages = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'hi', label: 'हिन्दी' }
];

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../i18n/translations';
import { db } from '../database/db';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('vmcare_language') || localStorage.getItem('ashaseva_language') || 'ta';
  });

  useEffect(() => {
    // Sync with IndexedDB settings
    db.settings.get('language').then((res) => {
      if (res && res.value) {
        setLang(res.value);
        localStorage.setItem('vmcare_language', res.value);
      }
    }).catch(() => {});
  }, []);

  const changeLanguage = async (newLang) => {
    setLang(newLang);
    localStorage.setItem('vmcare_language', newLang);
    try {
      await db.settings.put({ key: 'language', value: newLang });
    } catch (err) {
      console.warn('[Language Save Note]', err);
    }
  };

  const t = (key) => {
    if (translations[lang] && translations[lang][key]) {
      return translations[lang][key];
    }
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SUPPORTED_LANGUAGES } from '../config/constants';

interface LanguageContextType {
  language: string;
  setLanguage: (code: string) => void;
  languages: typeof SUPPORTED_LANGUAGES;
  t: (key: string, fallback: string) => string;
}

// Multilingual translations for primary UI labels
const TRANSLATIONS: Record<string, Record<string, string>> = {
  hi: {
    'nav.dashboard': 'डैशबोर्ड',
    'nav.forecast': 'पूर्वानुमान',
    'nav.chat': 'वेदर जीपीटी से पूछें',
    'nav.alerts': 'आपदा चेतावनी',
    'nav.risk': 'जोखिम विश्लेषण',
    'nav.explorer': 'मौसम मानचित्र',
    'nav.history': 'ऐतिहासिक आपदाएं',
    'nav.climate': 'जलवायु रुझान',
    'nav.locations': 'स्थान प्रबंधन',
    'nav.settings': 'सेटिंग्स',
    'nav.about': 'हमारे बारे में',
    'header.search': 'शहर, जिला या राज्य खोजें...',
    'hero.title': 'मौसम का ज्ञान, प्राकृतिक भाषा में।',
    'hero.subtitle': 'वास्तविक समय मौसम, पूर्वानुमान, आपदा अलर्ट और जलवायु रुझान एक ही मंच पर।',
    'status.demo': 'डेमो डेटा मोड',
  },
  bn: {
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.forecast': 'পূর্বাভাস',
    'nav.chat': 'ওয়েদার জিপিটিকে জিজ্ঞাসা করুন',
    'nav.alerts': 'দুর্যোগ সতর্কতা',
    'nav.risk': 'ঝুঁকি বিশ্লেষণ',
    'nav.explorer': 'আবহাওয়া মানচিত্র',
    'nav.history': 'ঐতিহাসিক দুর্যোগ',
    'nav.climate': 'জলবায়ু প্রবণতা',
    'nav.locations': 'অবস্থানসমূহ',
    'nav.settings': 'সেটিংস',
    'nav.about': 'সম্পর্কে',
    'header.search': 'শহর বা জেলা খুঁজুন...',
    'hero.title': 'আবহাওয়ার বুদ্ধিমত্তা, সহজ ভাষায়।',
    'hero.subtitle': 'রিয়েল-টাইম আবহাওয়া, দুর্যোগ সতর্কতা এবং জলবায়ু অন্তর্দৃষ্টি।',
    'status.demo': 'ডেমো ডেটা মোড',
  },
  or: {
    'nav.dashboard': 'ଡ୍ୟାସବୋର୍ଡ',
    'nav.forecast': 'ପୂର୍ବାନୁମାନ',
    'nav.chat': 'ୱେଦର ଜିପିଟିକୁ ପଚାରନ୍ତୁ',
    'nav.alerts': 'ବିପର୍ଯ୍ୟୟ ସତର୍କତା',
    'nav.risk': 'ବିପଦ ଆକଳନ',
    'nav.explorer': 'ପାଣିପାଗ ମାନଚିତ୍ର',
    'nav.history': 'ଐତିହାସିକ ବିପର୍ଯ୍ୟୟ',
    'nav.climate': 'ଜଳବାୟୁ ଧାରା',
    'nav.locations': 'ସ୍ଥାନ ପରିଚାଳନା',
    'nav.settings': 'ସେଟିଙ୍ଗ୍ସ',
    'nav.about': 'ସୂଚନା',
    'header.search': 'ସହର କିମ୍ବା ଜିଲ୍ଲା ଖୋଜନ୍ତୁ...',
    'hero.title': 'ପାଣିପାଗ ସୂଚନା, ସରଳ ଭାଷାରେ।',
    'hero.subtitle': 'ପ୍ରକୃତ ସମୟ ପାଣିପାଗ, ପୂର୍ବାନୁମାନ ଓ ବିପର୍ଯ୍ୟୟ ସତର୍କତା ଗୋଟିଏ ସ୍ଥାନରେ।',
    'status.demo': 'ଡେମୋ ଡାଟା ମୋଡ୍',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>('en');

  const t = (key: string, fallback: string): string => {
    if (language === 'en') return fallback;
    const langDict = TRANSLATIONS[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    return fallback;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        languages: SUPPORTED_LANGUAGES,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

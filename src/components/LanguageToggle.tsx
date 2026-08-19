import React from 'react';
import { useStore } from '../store/useStore';
import { Globe } from 'lucide-react';

interface LanguageToggleProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ 
  className = '',
  variant = 'compact'
}) => {
  const { language, setLanguage } = useStore();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  if (variant === 'full') {
    return (
      <div className={`flex items-center bg-burgundy-light/60 p-1 rounded-full border border-burgundy-soft/30 ${className}`}>
        <button
          onClick={() => setLanguage('ar')}
          className={`flex-1 text-xs font-bold py-1.5 px-3 rounded-full transition-all duration-200 ${
            language === 'ar'
              ? 'bg-burgundy text-white shadow-sm'
              : 'text-text-secondary hover:text-burgundy'
          }`}
        >
          العربية
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`flex-1 text-xs font-bold py-1.5 px-3 rounded-full transition-all duration-200 ${
            language === 'en'
              ? 'bg-burgundy text-white shadow-sm'
              : 'text-text-secondary hover:text-burgundy'
          }`}
        >
          English
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-burgundy-light/80 hover:bg-burgundy-soft border border-burgundy-soft/40 text-burgundy transition-all text-xs font-bold cursor-pointer shadow-sm select-none ${className}`}
      title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
    >
      <Globe size={15} className="shrink-0 text-burgundy" />
      <span>{language === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
};

export default LanguageToggle;

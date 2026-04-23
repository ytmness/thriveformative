"use client";

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useState, useTransition } from 'react';

type LanguageSwitcherProps = {
  /** Solo icono globo, para la barra superior estilo editorial */
  variant?: "default" | "minimal";
  className?: string;
};

export default function LanguageSwitcher({
  variant = "default",
  className = "",
}: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const switchLanguage = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    startTransition(() => {
      // Establecer cookie y recargar
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
      router.refresh();
    });
    setIsOpen(false);
  };

  const languages = [
    { code: 'es', label: 'Español', flag: '🇲🇽' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ko', label: '한국어', flag: '🇰🇷' },
    { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  ];

  const isMinimal = variant === "minimal";

  return (
    <div className={`relative ${className}`.trim()}>
      <motion.button
        whileHover={{ scale: isMinimal ? 1.02 : 1.05 }}
        whileTap={{ scale: isMinimal ? 0.98 : 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label="Idioma"
        className={
          isMinimal
            ? "site-nav-lang-btn"
            : "flex items-center gap-2 px-4 py-2.5 rounded-lg border border-theme hover:bg-[rgb(var(--surface))] transition-colors"
        }
        disabled={isPending}
      >
        <Globe size={isMinimal ? 18 : 20} />
        {!isMinimal && (
          <span className="text-base font-medium uppercase">{locale}</span>
        )}
      </motion.button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 mt-2 w-40 bg-surface border border-theme rounded-lg shadow-soft overflow-hidden z-50"
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLanguage(lang.code)}
                className={`w-full text-left px-4 py-2.5 text-base hover:bg-[rgb(var(--bg))] transition-colors ${
                  locale === lang.code ? 'bg-[rgb(var(--primary)/0.1)] font-semibold' : ''
                }`}
                disabled={isPending}
              >
                {lang.flag} {lang.label}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
}

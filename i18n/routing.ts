import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en', 'ko', 'it'],
  defaultLocale: 'es',
  localePrefix: 'never' // El idioma no aparecerá en la URL
});

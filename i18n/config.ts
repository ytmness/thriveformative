export const locales = ['es', 'en', 'ko', 'it'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

import i18n, { type ParseKeys } from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { en } from './locales/en'
import { ro } from './locales/ro'

export const languages = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'ro', label: 'Română', short: 'RO' },
] as const

export type Language = (typeof languages)[number]['code']

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof en }
  }
}

export type TranslationKey = ParseKeys

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, ro: { translation: ro } },
    supportedLngs: languages.map((language) => language.code),
    fallbackLng: 'en',
    // 'ro-RO' from the browser resolves to 'ro'
    load: 'languageOnly',
    interpolation: { escapeValue: false }, // React already escapes
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'parkspot-language',
      caches: ['localStorage'],
    },
  })

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language
})
document.documentElement.lang = i18n.resolvedLanguage ?? 'en'

/**
 * Form errors are stored as translation keys (zod messages, known server errors) so they
 * re-render in the current language. Anything else — e.g. an unrecognised backend
 * message — is shown as-is.
 */
export function translateMessage(message: string): string {
  return i18n.exists(message) ? i18n.t(message as TranslationKey) : message
}

export default i18n

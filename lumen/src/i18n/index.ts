import { createI18n } from 'vue-i18n'
import type { Locale } from '@/core/canon'
import es from './locales/es'
import en from './locales/en'
import pt from './locales/pt'

export function detectLocale(): Locale {
  for (const l of navigator.languages ?? [navigator.language]) {
    const code = l.slice(0, 2).toLowerCase()
    if (code === 'es' || code === 'en' || code === 'pt') return code
  }
  return 'es'
}

export const i18n = createI18n({
  legacy: false,
  locale: 'es',
  fallbackLocale: 'es',
  messages: { es, en, pt },
})

export function setLocale(l: Locale) {
  i18n.global.locale.value = l
  document.documentElement.lang = l
}

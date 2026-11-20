import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/core/canon'
import { formatPassage, type Passage } from '@/core/reference'
import { bookByNumber } from '@/core/canon'

/** Idioma actual y utilidades para nombrar libros y pasajes. */
export function useLocale() {
  const { locale } = useI18n()
  const lang = computed(() => locale.value as Locale)
  return {
    lang,
    bookName: (n: number) => bookByNumber(n)?.name[lang.value] ?? '',
    bookAbbr: (n: number) => bookByNumber(n)?.abbr[lang.value] ?? '',
    passage: (p: Passage, short = false) => formatPassage(p, lang.value, short),
  }
}

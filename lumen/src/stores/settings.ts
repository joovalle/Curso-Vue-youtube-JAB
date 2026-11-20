import { defineStore } from 'pinia'
import { computed, watchEffect } from 'vue'
import { useLocalStorage, usePreferredDark } from '@vueuse/core'
import type { Locale } from '@/core/canon'
import type { Passage } from '@/core/reference'

export type ThemeChoice = 'auto' | 'light' | 'sepia' | 'dark'
export type StudyTab = 'refs' | 'compare' | 'notes' | 'commentary' | 'dictionary'

export interface Prefs {
  theme: ThemeChoice
  font: 'serif' | 'sans'
  fontSize: number
  leading: number
  layout: 'paragraph' | 'verses'
  verseNumbers: boolean
  strongs: boolean
  locale: Locale | null
  /** Biblias activas; la primera es la principal. */
  bibles: string[]
  parallel: boolean
  studyOpen: boolean
  studyTab: StudyTab
  commentaryId: string | null
  dictionaryId: string | null
  last: Passage
  history: Passage[]
}

const DEFAULTS: Prefs = {
  theme: 'auto',
  font: 'serif',
  fontSize: 19,
  leading: 1.75,
  layout: 'paragraph',
  verseNumbers: true,
  strongs: true,
  locale: null,
  bibles: [],
  parallel: false,
  studyOpen: false,
  studyTab: 'refs',
  commentaryId: null,
  dictionaryId: null,
  last: { book: 43, chapter: 1 },
  history: [],
}

export const useSettings = defineStore('settings', () => {
  const prefs = useLocalStorage<Prefs>('lumen.prefs', { ...DEFAULTS }, { mergeDefaults: true })
  const prefersDark = usePreferredDark()

  const theme = computed(() =>
    prefs.value.theme === 'auto' ? (prefersDark.value ? 'dark' : 'light') : prefs.value.theme,
  )

  watchEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme.value
    root.style.setProperty('--read-size', `${prefs.value.fontSize}px`)
    root.style.setProperty('--read-leading', String(prefs.value.leading))
    root.style.setProperty('--font-read', prefs.value.font === 'serif' ? 'var(--font-serif)' : 'var(--font-ui)')
    const color = getComputedStyle(root).getPropertyValue('--bg').trim()
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color || '#fbfaf7')
  })

  function remember(p: Passage) {
    const last = prefs.value.last
    if (last.book === p.book && last.chapter === p.chapter && prefs.value.history[0]?.book === p.book && prefs.value.history[0]?.chapter === p.chapter) return
    prefs.value.last = { book: p.book, chapter: p.chapter }
    const h = prefs.value.history.filter((x) => !(x.book === p.book && x.chapter === p.chapter))
    prefs.value.history = [{ book: p.book, chapter: p.chapter }, ...h].slice(0, 12)
  }

  function reset() {
    const keep = { bibles: prefs.value.bibles, last: prefs.value.last, locale: prefs.value.locale }
    prefs.value = { ...DEFAULTS, ...keep }
  }

  return { prefs, theme, remember, reset }
})

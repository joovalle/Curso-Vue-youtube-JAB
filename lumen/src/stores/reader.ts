import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { verseKey, type Passage } from '@/core/reference'
import { useSettings, type StudyTab } from './settings'

/** Estado de la lectura en curso: pasaje, versículos seleccionados y foco. */
export const useReader = defineStore('reader', () => {
  const passage = ref<Passage>({ book: 43, chapter: 1 })
  const selection = ref<number[]>([])
  const focus = ref<number | null>(null)
  const pickerOpen = ref(false)
  const paletteOpen = ref(false)
  /** Tema del diccionario a consultar (p. ej. un número Strong). */
  const dictionaryTopic = ref<string | null>(null)

  const focusKey = computed(() =>
    focus.value ? verseKey(passage.value.book, passage.value.chapter, focus.value) : null,
  )
  const selectedKeys = computed(() =>
    selection.value.map((v) => verseKey(passage.value.book, passage.value.chapter, v)),
  )

  function setPassage(p: Passage) {
    if (p.book !== passage.value.book || p.chapter !== passage.value.chapter) clear()
    passage.value = { book: p.book, chapter: p.chapter }
  }

  function toggle(v: number, extend = false) {
    const s = new Set(selection.value)
    if (extend && focus.value) {
      const [a, b] = [Math.min(focus.value, v), Math.max(focus.value, v)]
      for (let i = a; i <= b; i++) s.add(i)
      focus.value = v
    } else if (s.has(v)) {
      s.delete(v)
      focus.value = s.size ? [...s].pop()! : focus.value
    } else {
      s.add(v)
      focus.value = v
    }
    selection.value = [...s].sort((a, b) => a - b)
  }

  function clear() {
    selection.value = []
  }

  function openStudy(tab: StudyTab) {
    const settings = useSettings()
    settings.prefs.studyTab = tab
    settings.prefs.studyOpen = true
  }

  return { passage, selection, focus, focusKey, selectedKeys, pickerOpen, paletteOpen, dictionaryTopic, setPassage, toggle, clear, openStudy }
})

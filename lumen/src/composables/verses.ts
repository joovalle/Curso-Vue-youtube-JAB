import { verseKey } from '@/core/reference'
import { useAnnotations } from '@/stores/annotations'
import { useReader } from '@/stores/reader'

/** Interacción común con versículos (selección, subrayados, Strong). */
export function useVerseInteractions() {
  const reader = useReader()
  const notes = useAnnotations()

  const key = (v: number) => verseKey(reader.passage.book, reader.passage.chapter, v)

  function classes(v: number) {
    const hl = notes.highlights.get(key(v))
    return [hl ? `hl hl-${hl}` : '', { selected: reader.selection.includes(v) }]
  }

  function onClick(v: number, e: MouseEvent) {
    const target = e.target as HTMLElement
    const strong = target.closest<HTMLElement>('[data-strong]')
    if (strong?.dataset.strong) {
      reader.dictionaryTopic = strong.dataset.strong
      reader.openStudy('dictionary')
      return
    }
    // Si el usuario está seleccionando texto con el ratón, no alteramos la selección de versículos
    if (window.getSelection()?.toString().trim()) return
    reader.toggle(v, e.shiftKey)
  }

  function openNote(v: number) {
    reader.focus = v
    if (!reader.selection.includes(v)) reader.selection = [v]
    reader.openStudy('notes')
  }

  return {
    classes,
    onClick,
    openNote,
    hasNote: (v: number) => notes.notes.has(key(v)),
    hasBookmark: (v: number) => notes.bookmarks.has(key(v)),
  }
}

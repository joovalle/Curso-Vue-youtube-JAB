import { ref, shallowRef, watch, type Ref } from 'vue'
import { engine } from '@/core/engine/client'
import type { VerseRow } from '@/core/engine/modules'
import type { Passage } from '@/core/reference'
import { useLibrary } from '@/stores/library'

export interface ChapterColumn {
  id: string
  abbreviation: string
  title: string
  rtl: boolean
  rows: VerseRow[]
  error: string | null
}

/** Carga el capítulo actual en todas las versiones activas. */
export function useChapters(ids: Ref<string[]>, passage: Ref<Passage>) {
  const library = useLibrary()
  const columns = shallowRef<ChapterColumn[]>([])
  const loading = ref(false)
  let token = 0

  watch(
    () => [ids.value.join('|'), passage.value.book, passage.value.chapter] as const,
    async () => {
      const my = ++token
      loading.value = true
      const { book, chapter } = passage.value
      const result = await Promise.all(
        ids.value.map(async (id): Promise<ChapterColumn> => {
          const rec = library.get(id)
          const base = { id, abbreviation: rec?.info.abbreviation ?? id, title: rec?.info.title ?? id, rtl: !!rec?.info.rtl }
          try {
            await library.ensureOpen(id)
            return { ...base, rows: await engine().chapter(id, book, chapter), error: null }
          } catch (e) {
            return { ...base, rows: [], error: e instanceof Error ? e.message : String(e) }
          }
        }),
      )
      if (my !== token) return
      columns.value = result
      loading.value = false
    },
    { immediate: true },
  )

  return { columns, loading }
}

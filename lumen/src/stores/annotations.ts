import { defineStore } from 'pinia'
import { ref } from 'vue'
import { db, type Backup, type Bookmark, type Highlight, type HighlightColor, type Note } from '@/core/storage/db'

/** Subrayados, notas y marcadores. Se guardan solo en este dispositivo. */
export const useAnnotations = defineStore('annotations', () => {
  const highlights = ref(new Map<number, HighlightColor>())
  const notes = ref(new Map<number, Note>())
  const bookmarks = ref(new Set<number>())

  async function load() {
    const d = await db()
    const [h, n, b] = await Promise.all([d.getAll('highlights'), d.getAll('notes'), d.getAll('bookmarks')])
    highlights.value = new Map(h.map((x) => [x.key, x.color]))
    notes.value = new Map(n.map((x) => [x.key, x]))
    bookmarks.value = new Set(b.map((x) => x.key))
  }

  async function setHighlight(keys: number[], color: HighlightColor | null) {
    const tx = (await db()).transaction('highlights', 'readwrite')
    for (const key of keys) {
      if (color) {
        highlights.value.set(key, color)
        void tx.store.put({ key, color, updatedAt: Date.now() })
      } else {
        highlights.value.delete(key)
        void tx.store.delete(key)
      }
    }
    await tx.done
  }

  async function saveNote(key: number, text: string) {
    const d = await db()
    const trimmed = text.trim()
    const prev = notes.value.get(key)
    if (!trimmed) {
      if (prev) {
        notes.value.delete(key)
        await d.delete('notes', prev.id)
      }
      return
    }
    const now = Date.now()
    const note: Note = prev ? { ...prev, text, updatedAt: now } : { id: `v${key}`, key, text, createdAt: now, updatedAt: now }
    notes.value.set(key, note)
    await d.put('notes', note)
  }

  async function toggleBookmark(key: number) {
    const d = await db()
    if (bookmarks.value.has(key)) {
      bookmarks.value.delete(key)
      await d.delete('bookmarks', key)
    } else {
      bookmarks.value.add(key)
      await d.put('bookmarks', { key, createdAt: Date.now() })
    }
  }

  async function exportBackup(): Promise<Backup> {
    const d = await db()
    return {
      app: 'lumen', version: 1, exportedAt: new Date().toISOString(),
      highlights: await d.getAll('highlights'), notes: await d.getAll('notes'), bookmarks: await d.getAll('bookmarks'),
    }
  }

  /** Combina una copia de seguridad con lo existente (la más reciente gana). */
  async function importBackup(data: Backup) {
    if (data?.app !== 'lumen' || data.version !== 1) throw new Error('Archivo de copia no válido')
    const d = await db()
    const tx = d.transaction(['highlights', 'notes', 'bookmarks'], 'readwrite')
    for (const h of data.highlights ?? []) void tx.objectStore('highlights').put(h as Highlight)
    for (const n of data.notes ?? []) {
      const cur = notes.value.get(n.key)
      if (!cur || cur.updatedAt < n.updatedAt) void tx.objectStore('notes').put({ ...n, id: `v${n.key}` })
    }
    for (const b of data.bookmarks ?? []) void tx.objectStore('bookmarks').put(b as Bookmark)
    await tx.done
    await load()
  }

  async function clearAll() {
    const d = await db()
    await Promise.all([d.clear('highlights'), d.clear('notes'), d.clear('bookmarks')])
    await load()
  }

  return { highlights, notes, bookmarks, load, setHighlight, saveNote, toggleBookmark, exportBackup, importBackup, clearAll }
})

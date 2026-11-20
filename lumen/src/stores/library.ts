import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { Comlink, engine } from '@/core/engine/client'
import type { ModuleInfo, ModuleKind } from '@/core/engine/modules'
import { db, requestPersistence, type InstalledModule } from '@/core/storage/db'
import { useSettings } from './settings'

export interface CatalogEntry {
  id: string
  kind: ModuleKind
  format: string
  title: string
  abbreviation: string
  language: string
  license: string
  description: string
  url: string
  size: number
}

/** Extensiones que se intentan abrir como módulos SQLite. */
export const IMPORT_EXTENSIONS = ['.bblx', '.cmtx', '.dctx', '.mybible', '.sqlite', '.sqlite3', '.db']

export const useLibrary = defineStore('library', () => {
  const installed = ref<InstalledModule[]>([])
  const catalog = ref<CatalogEntry[] | null>(null)
  const catalogError = ref(false)
  const progress = reactive<Record<string, number>>({})
  const opening = new Map<string, Promise<ModuleInfo>>()

  const byKind = (k: ModuleKind) => computed(() => installed.value.filter((m) => m.info.kind === k))
  const bibles = byKind('bible')
  const commentaries = byKind('commentary')
  const dictionaries = byKind('dictionary')
  const crossrefs = byKind('crossrefs')
  const get = (id: string) => installed.value.find((m) => m.id === id)

  async function load() {
    installed.value = (await (await db()).getAll('modules')).sort((a, b) => a.installedAt - b.installedAt)
    const settings = useSettings()
    // Mantiene la lista de Biblias activas coherente con lo instalado
    const ids = new Set(bibles.value.map((b) => b.id))
    settings.prefs.bibles = settings.prefs.bibles.filter((id) => ids.has(id))
    if (!settings.prefs.bibles.length && bibles.value.length) settings.prefs.bibles = [bibles.value[0].id]
  }

  async function fetchCatalog() {
    if (catalog.value) return catalog.value
    try {
      const res = await fetch('modules/catalog.json', { cache: 'no-cache' })
      catalog.value = (await res.json()).modules
      catalogError.value = false
    } catch {
      catalogError.value = true
    }
    return catalog.value
  }

  /** Abre el módulo en el motor (una sola vez) y devuelve su información. */
  function ensureOpen(id: string): Promise<ModuleInfo> {
    let p = opening.get(id)
    if (!p) {
      p = (async () => {
        const rec = get(id)
        if (!rec) throw new Error(`Módulo no instalado: ${id}`)
        const bytes = await (await db()).get('blobs', id)
        if (!bytes) throw new Error(`Faltan los datos del módulo: ${id}`)
        return engine().open(id, Comlink.transfer(bytes, [bytes.buffer]), rec.fileName)
      })()
      p.catch(() => opening.delete(id))
      opening.set(id, p)
    }
    return p
  }

  async function download(entry: CatalogEntry): Promise<Uint8Array> {
    const res = await fetch(entry.url)
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)
    const total = Number(res.headers.get('content-length')) || entry.size
    const reader = res.body.getReader()
    const chunks: Uint8Array[] = []
    let received = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      received += value.length
      progress[entry.id] = Math.min(0.99, received / total)
    }
    const bytes = new Uint8Array(received)
    let offset = 0
    for (const c of chunks) { bytes.set(c, offset); offset += c.length }
    return bytes
  }

  async function save(rec: InstalledModule, bytes: Uint8Array) {
    const d = await db()
    const tx = d.transaction(['modules', 'blobs'], 'readwrite')
    await Promise.all([tx.objectStore('blobs').put(bytes, rec.id), tx.objectStore('modules').put(rec), tx.done])
    installed.value = [...installed.value.filter((m) => m.id !== rec.id), rec]
    if (rec.info.kind === 'bible') {
      const settings = useSettings()
      if (!settings.prefs.bibles.length) settings.prefs.bibles = [rec.id]
    }
    void requestPersistence()
  }

  async function install(entry: CatalogEntry) {
    if (get(entry.id) || entry.id in progress) return
    progress[entry.id] = 0
    try {
      const bytes = await download(entry)
      // Se valida abriéndolo en el motor con una copia; el original se guarda.
      const info = await engine().open(entry.id, Comlink.transfer(bytes.slice(), []), entry.title)
      opening.set(entry.id, Promise.resolve(info))
      await save({
        id: entry.id, info: { ...info, title: entry.title, abbreviation: entry.abbreviation },
        source: 'catalog', fileName: entry.url.split('/').pop()!, size: bytes.length,
        installedAt: Date.now(), license: entry.license, language: entry.language,
      }, bytes)
    } finally {
      delete progress[entry.id]
    }
  }

  async function importFile(file: File): Promise<InstalledModule> {
    const id = `user-${file.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${file.size.toString(36)}`
    const existing = get(id)
    if (existing) return existing
    const bytes = new Uint8Array(await file.arrayBuffer())
    const copy = bytes.slice()
    const info = await engine().open(id, Comlink.transfer(copy, [copy.buffer]), file.name.replace(/\.[^.]+$/, ''))
    opening.set(id, Promise.resolve(info))
    const rec: InstalledModule = { id, info, source: 'import', fileName: file.name, size: bytes.length, installedAt: Date.now() }
    await save(rec, bytes)
    return rec
  }

  async function remove(id: string) {
    await engine().close(id)
    opening.delete(id)
    const d = await db()
    const tx = d.transaction(['modules', 'blobs'], 'readwrite')
    await Promise.all([tx.objectStore('blobs').delete(id), tx.objectStore('modules').delete(id), tx.done])
    installed.value = installed.value.filter((m) => m.id !== id)
    const settings = useSettings()
    settings.prefs.bibles = settings.prefs.bibles.filter((b) => b !== id)
    if (!settings.prefs.bibles.length && bibles.value.length) settings.prefs.bibles = [bibles.value[0].id]
    if (settings.prefs.commentaryId === id) settings.prefs.commentaryId = null
    if (settings.prefs.dictionaryId === id) settings.prefs.dictionaryId = null
  }

  return {
    installed, catalog, catalogError, progress, bibles, commentaries, dictionaries, crossrefs,
    get, load, fetchCatalog, ensureOpen, install, importFile, remove,
  }
})

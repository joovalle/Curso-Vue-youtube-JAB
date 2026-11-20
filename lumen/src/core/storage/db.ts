/**
 * Almacenamiento local (IndexedDB). Nada sale del dispositivo:
 * módulos instalados, subrayados, notas y marcadores viven aquí.
 */
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { ModuleInfo } from '../engine/modules'

export type HighlightColor = 'gold' | 'rose' | 'sky' | 'mint' | 'lilac'
export const HIGHLIGHT_COLORS: HighlightColor[] = ['gold', 'mint', 'sky', 'lilac', 'rose']

export interface InstalledModule {
  id: string
  info: ModuleInfo
  source: 'catalog' | 'import'
  fileName: string
  size: number
  installedAt: number
  license?: string
  language?: string
}
export interface Highlight { key: number; color: HighlightColor; updatedAt: number }
export interface Note { id: string; key: number; endKey?: number; text: string; createdAt: number; updatedAt: number }
export interface Bookmark { key: number; createdAt: number }

interface LumenDB extends DBSchema {
  modules: { key: string; value: InstalledModule }
  blobs: { key: string; value: Uint8Array }
  highlights: { key: number; value: Highlight }
  notes: { key: string; value: Note; indexes: { 'by-key': number } }
  bookmarks: { key: number; value: Bookmark }
}

let dbPromise: Promise<IDBPDatabase<LumenDB>> | null = null

export function db() {
  return (dbPromise ??= openDB<LumenDB>('lumen', 1, {
    upgrade(d) {
      d.createObjectStore('modules', { keyPath: 'id' })
      d.createObjectStore('blobs')
      d.createObjectStore('highlights', { keyPath: 'key' })
      d.createObjectStore('notes', { keyPath: 'id' }).createIndex('by-key', 'key')
      d.createObjectStore('bookmarks', { keyPath: 'key' })
    },
  }))
}

/** Pide al navegador que no borre los datos por falta de espacio (importante en iOS). */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist()
  } catch {
    /* no disponible */
  }
}

export interface Backup {
  app: 'lumen'
  version: 1
  exportedAt: string
  highlights: Highlight[]
  notes: Note[]
  bookmarks: Bookmark[]
}

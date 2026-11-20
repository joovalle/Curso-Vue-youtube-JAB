/// <reference lib="webworker" />
/**
 * Motor de datos: SQLite (WebAssembly) en un hilo aparte, para que la
 * interfaz nunca se congele al abrir módulos grandes o buscar.
 */
import * as Comlink from 'comlink'
import initSqlJs, { type SqlJsStatic } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import {
  BibleModule, CommentaryModule, CrossRefModule, DictionaryModule, openModule,
  type Module, type ModuleInfo, type SearchOptions,
} from './modules'

let sqlPromise: Promise<SqlJsStatic> | null = null
const sql = () => (sqlPromise ??= initSqlJs({ locateFile: () => wasmUrl, useOldExtensionFunctions: true }))
const modules = new Map<string, Module>()

function get<T extends Module>(id: string, type: abstract new (...a: never[]) => T): T {
  const m = modules.get(id)
  if (!m) throw new Error(`Módulo no abierto: ${id}`)
  if (!(m instanceof type)) throw new Error(`El módulo ${id} no es del tipo esperado`)
  return m
}

/** Descomprime si los bytes vienen en gzip (los del catálogo). */
async function gunzipIfNeeded(bytes: Uint8Array): Promise<Uint8Array> {
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return bytes
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

const api = {
  async open(id: string, bytes: Uint8Array, name: string): Promise<ModuleInfo> {
    const existing = modules.get(id)
    if (existing) return existing.info
    const SQL = await sql()
    const raw = await gunzipIfNeeded(bytes)
    if (new TextDecoder().decode(raw.subarray(0, 15)) !== 'SQLite format 3') {
      throw new Error('El archivo no es una base de datos SQLite (¿módulo antiguo o protegido?)')
    }
    const db = new SQL.Database(raw)
    try {
      const mod = openModule(db, id, name)
      modules.set(id, mod)
      return mod.info
    } catch (e) {
      db.close()
      throw e
    }
  },
  close(id: string) {
    modules.get(id)?.close()
    modules.delete(id)
  },
  isOpen: (id: string) => modules.has(id),

  chapter: (id: string, book: number, chapter: number) => get(id, BibleModule).chapter(book, chapter),
  plain: (id: string, ranges: { start: number; end?: number | null }[]) =>
    ranges.map((r) => get(id, BibleModule).plain(r.start, r.end)),
  search: (id: string, query: string, opts?: SearchOptions) => get(id, BibleModule).search(query, opts),
  commentary: (id: string, book: number, chapter: number, verse: number) =>
    get(id, CommentaryModule).lookup(book, chapter, verse),
  topics: (id: string, prefix: string, limit?: number) => get(id, DictionaryModule).topics(prefix, limit),
  definition: (id: string, topic: string) => get(id, DictionaryModule).definition(topic),
  crossRefs: (id: string, key: number) => get(id, CrossRefModule).refs(key),
}

export type EngineApi = typeof api
Comlink.expose(api)

/**
 * Lectura de módulos SQLite (e-Sword .bblx/.cmtx/.dctx y los propios de Lumen).
 *
 * Este archivo no depende del navegador: funciona igual dentro del Web Worker
 * y en las pruebas con Node. Los nombres de tablas y columnas se buscan sin
 * distinguir mayúsculas, porque los módulos de terceros no siempre coinciden.
 */
import type { Database, SqlValue } from 'sql.js'
import { toPlainText, toSafeHtml } from '../markup'
import { verseKey } from '../reference'

export type ModuleKind = 'bible' | 'commentary' | 'dictionary' | 'crossrefs'

export interface ModuleInfo {
  id: string
  kind: ModuleKind
  title: string
  abbreviation: string
  description: string
  rtl: boolean
  strong: boolean
  /** Biblias: libros presentes y su último capítulo. */
  books?: Record<number, number>
}

export interface VerseRow { verse: number; html: string }
export interface SearchHit { key: number; html: string }
export interface SearchResult { total: number; hits: SearchHit[]; perBook: Record<number, number> }
export interface SearchOptions { from?: number; to?: number; limit?: number; offset?: number }
export interface CommentaryEntry { scope: 'verse' | 'chapter' | 'book'; range: string; html: string }
export interface CrossRef { start: number; end: number | null; votes: number }

export class UnsupportedModuleError extends Error {}

function rows<T = Record<string, SqlValue>>(db: Database, sql: string, params: SqlValue[] = []): T[] {
  const stmt = db.prepare(sql)
  try {
    stmt.bind(params)
    const out: T[] = []
    while (stmt.step()) out.push(stmt.getAsObject() as T)
    return out
  } finally {
    stmt.free()
  }
}

/** Mapa nombre-en-minúsculas → nombre real, para tablas y columnas. */
function tableMap(db: Database): Map<string, string> {
  const names = rows<{ name: string }>(db, "SELECT name FROM sqlite_master WHERE type IN ('table','view')")
  return new Map(names.map((r) => [r.name.toLowerCase(), r.name]))
}

function columnMap(db: Database, table: string): Map<string, string> {
  const cols = rows<{ name: string }>(db, `PRAGMA table_info("${table.replace(/"/g, '""')}")`)
  return new Map(cols.map((c) => [c.name.toLowerCase(), c.name]))
}

const q = (name: string) => `"${name.replace(/"/g, '""')}"`

function need(map: Map<string, string>, ...names: string[]): string[] {
  return names.map((n) => {
    const real = map.get(n.toLowerCase())
    if (!real) throw new UnsupportedModuleError(`Falta la columna o tabla "${n}"`)
    return real
  })
}

const truthy = (v: SqlValue | undefined) => v === 1 || v === '1' || String(v).toLowerCase() === 'true'

interface Details { title: string; abbreviation: string; description: string; rtl: boolean; strong: boolean }

function readDetails(db: Database, tables: Map<string, string>, fallback: string): Details {
  const table = tables.get('details') ?? tables.get('info')
  const base: Details = { title: fallback, abbreviation: fallback.slice(0, 8).toUpperCase(), description: '', rtl: false, strong: false }
  if (!table) return base
  const row = rows(db, `SELECT * FROM ${q(table)} LIMIT 1`)[0]
  if (!row) return base
  const get = (k: string) => {
    const key = Object.keys(row).find((c) => c.toLowerCase() === k)
    return key ? row[key] : undefined
  }
  const str = (v: SqlValue | undefined) => (typeof v === 'string' ? toPlainText(v) : v != null ? String(v) : '')
  return {
    title: str(get('title') ?? get('description')) || base.title,
    abbreviation: str(get('abbreviation')) || base.abbreviation,
    description: str(get('description') ?? get('comments')),
    rtl: truthy(get('righttoleft')),
    strong: truthy(get('strong')),
  }
}

export abstract class Module {
  readonly db: Database
  readonly info: ModuleInfo
  constructor(db: Database, info: ModuleInfo) {
    this.db = db
    this.info = info
  }
  close() { this.db.close() }
}

export class BibleModule extends Module {
  private table: string
  private c: { book: string; chapter: string; verse: string; text: string }
  private ftsReady = false

  constructor(db: Database, info: ModuleInfo, table: string) {
    super(db, info)
    this.table = table
    const [book, chapter, verse, text] = need(columnMap(db, table), 'Book', 'Chapter', 'Verse', 'Scripture')
    this.c = { book, chapter, verse, text }
    const books: Record<number, number> = {}
    for (const r of rows<{ b: number; m: number }>(db, `SELECT ${q(book)} AS b, MAX(${q(chapter)}) AS m FROM ${q(table)} GROUP BY ${q(book)}`)) {
      if (r.b >= 1 && r.b <= 66) books[r.b] = r.m
    }
    info.books = books
  }

  chapter(book: number, chapter: number): VerseRow[] {
    const { c } = this
    return rows<{ v: number; t: string }>(
      this.db,
      `SELECT ${q(c.verse)} AS v, ${q(c.text)} AS t FROM ${q(this.table)} WHERE ${q(c.book)}=? AND ${q(c.chapter)}=? ORDER BY ${q(c.verse)}`,
      [book, chapter],
    ).map((r) => ({ verse: r.v, html: toSafeHtml(r.t) }))
  }

  /** Texto plano de un rango de versículos (dentro del mismo capítulo). */
  plain(start: number, end?: number | null): string {
    const { c } = this
    const b = Math.floor(start / 1e6), ch = Math.floor((start % 1e6) / 1e3), v = start % 1e3
    const sameChapter = end && Math.floor(end / 1e3) === Math.floor(start / 1e3)
    const last = sameChapter ? end % 1e3 : v
    const texts = rows<{ t: string }>(
      this.db,
      `SELECT ${q(c.text)} AS t FROM ${q(this.table)} WHERE ${q(c.book)}=? AND ${q(c.chapter)}=? AND ${q(c.verse)} BETWEEN ? AND ? ORDER BY ${q(c.verse)}`,
      [b, ch, v, last],
    ).map((r) => toPlainText(r.t))
    return texts.join(' ') + (end && !sameChapter ? ' …' : '')
  }

  private ensureFts() {
    if (this.ftsReady) return
    const { c } = this
    this.db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS lumen_fts USING fts4(t, tokenize=unicode61 "remove_diacritics=2")`)
    const has = rows<{ n: number }>(this.db, 'SELECT COUNT(*) AS n FROM lumen_fts')[0].n > 0
    if (!has) {
      const insert = this.db.prepare('INSERT INTO lumen_fts(docid, t) VALUES (?, ?)')
      this.db.run('BEGIN')
      const all = this.db.prepare(`SELECT ${q(c.book)}, ${q(c.chapter)}, ${q(c.verse)}, ${q(c.text)} FROM ${q(this.table)}`)
      while (all.step()) {
        const [b, ch, v, t] = all.get() as [number, number, number, string]
        insert.run([verseKey(b, ch, v), toPlainText(t)])
      }
      all.free()
      this.db.run('COMMIT')
      insert.free()
    }
    this.ftsReady = true
  }

  search(query: string, opts: SearchOptions = {}): SearchResult {
    const match = buildMatch(query)
    if (!match) return { total: 0, hits: [], perBook: {} }
    this.ensureFts()
    const from = opts.from ?? 0
    const to = opts.to ?? 999_999_999
    const where = 'lumen_fts MATCH ? AND docid BETWEEN ? AND ?'
    const perBook: Record<number, number> = {}
    let total = 0
    for (const r of rows<{ b: number; n: number }>(this.db, `SELECT docid / 1000000 AS b, COUNT(*) AS n FROM lumen_fts WHERE ${where} GROUP BY b`, [match, from, to])) {
      perBook[r.b] = r.n
      total += r.n
    }
    const hits = rows<{ k: number; s: string }>(
      this.db,
      `SELECT docid AS k, snippet(lumen_fts, char(1), char(2), '…', -1, 64) AS s FROM lumen_fts WHERE ${where} ORDER BY docid LIMIT ? OFFSET ?`,
      [match, from, to, opts.limit ?? 100, opts.offset ?? 0],
    ).map((r) => ({ key: r.k, html: highlightSnippet(r.s) }))
    return { total, hits, perBook }
  }
}

/** Convierte la consulta del usuario en una expresión MATCH segura de FTS4. */
export function buildMatch(query: string): string {
  const parts: string[] = []
  const re = /"([^"]+)"|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(query)) !== null) {
    const raw = (m[1] ?? m[2]).replace(/["*^():]/g, ' ').trim()
    const words = raw.split(/[\s\p{P}]+/u).filter(Boolean)
    if (!words.length) continue
    if (m[1]) parts.push(`"${words.join(' ')}"`)
    else {
      const prefix = (m[2] ?? '').endsWith('*')
      for (const w of words) parts.push(`"${w}"${prefix ? '*' : ''}`)
    }
  }
  return parts.join(' ')
}

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const highlightSnippet = (s: string) =>
  escapeHtml(s).replace(/\u0001/g, '<mark>').replace(/\u0002/g, '</mark>')

export class CommentaryModule extends Module {
  private verse?: { t: string; b: string; cb: string; vb: string; ce?: string; ve?: string; text: string }
  private chapterT?: { t: string; b: string; cb: string; ce?: string; text: string }
  private bookT?: { t: string; b: string; text: string }

  constructor(db: Database, info: ModuleInfo, tables: Map<string, string>) {
    super(db, info)
    const vt = tables.get('versecommentary')
    if (vt) {
      const m = columnMap(db, vt)
      const [b, cb, vb, text] = need(m, 'Book', 'ChapterBegin', 'VerseBegin', 'Comments')
      this.verse = { t: vt, b, cb, vb, ce: m.get('chapterend'), ve: m.get('verseend'), text }
    }
    const ct = tables.get('chaptercommentary')
    if (ct) {
      const m = columnMap(db, ct)
      const [b, cb, text] = need(m, 'Book', 'ChapterBegin', 'Comments')
      this.chapterT = { t: ct, b, cb, ce: m.get('chapterend'), text }
    }
    const bt = tables.get('bookcommentary')
    if (bt) {
      const [b, text] = need(columnMap(db, bt), 'Book', 'Comments')
      this.bookT = { t: bt, b, text }
    }
  }

  lookup(book: number, chapter: number, verse: number): CommentaryEntry[] {
    const out: CommentaryEntry[] = []
    const pos = chapter * 1000 + verse
    if (this.verse) {
      const v = this.verse
      const ce = v.ce ? `COALESCE(${q(v.ce)}, ${q(v.cb)})` : q(v.cb)
      const ve = v.ve ? `COALESCE(${q(v.ve)}, ${q(v.vb)})` : q(v.vb)
      for (const r of rows<{ cb: number; vb: number; ce: number; ve: number; t: string }>(
        this.db,
        `SELECT ${q(v.cb)} AS cb, ${q(v.vb)} AS vb, ${ce} AS ce, ${ve} AS ve, ${q(v.text)} AS t FROM ${q(v.t)}
         WHERE ${q(v.b)}=? AND ${q(v.cb)}*1000+${q(v.vb)} <= ? AND ${ce}*1000+${ve} >= ?
         ORDER BY ${q(v.cb)}, ${q(v.vb)}`,
        [book, pos, pos],
      )) {
        const range = r.cb === r.ce ? (r.vb === r.ve ? `${r.cb}:${r.vb}` : `${r.cb}:${r.vb}–${r.ve}`) : `${r.cb}:${r.vb}–${r.ce}:${r.ve}`
        out.push({ scope: 'verse', range, html: toSafeHtml(r.t) })
      }
    }
    if (this.chapterT) {
      const c = this.chapterT
      const ce = c.ce ? `COALESCE(${q(c.ce)}, ${q(c.cb)})` : q(c.cb)
      for (const r of rows<{ cb: number; ce: number; t: string }>(
        this.db,
        `SELECT ${q(c.cb)} AS cb, ${ce} AS ce, ${q(c.text)} AS t FROM ${q(c.t)} WHERE ${q(c.b)}=? AND ${q(c.cb)} <= ? AND ${ce} >= ?`,
        [book, chapter, chapter],
      )) out.push({ scope: 'chapter', range: r.cb === r.ce ? `${r.cb}` : `${r.cb}–${r.ce}`, html: toSafeHtml(r.t) })
    }
    if (this.bookT) {
      const b = this.bookT
      for (const r of rows<{ t: string }>(this.db, `SELECT ${q(b.text)} AS t FROM ${q(b.t)} WHERE ${q(b.b)}=?`, [book])) {
        out.push({ scope: 'book', range: '', html: toSafeHtml(r.t) })
      }
    }
    return out
  }
}

export class DictionaryModule extends Module {
  private t: string
  private topic: string
  private def: string

  constructor(db: Database, info: ModuleInfo, table: string) {
    super(db, info)
    this.t = table
    ;[this.topic, this.def] = need(columnMap(db, table), 'Topic', 'Definition')
  }

  topics(prefix: string, limit = 60): string[] {
    return rows<{ t: string }>(
      this.db,
      `SELECT ${q(this.topic)} AS t FROM ${q(this.t)} WHERE ${q(this.topic)} LIKE ? ESCAPE '\\' ORDER BY ${q(this.topic)} COLLATE NOCASE LIMIT ?`,
      [prefix.replace(/[\\%_]/g, (c) => '\\' + c) + '%', limit],
    ).map((r) => r.t)
  }

  definition(topic: string): string | null {
    const r = rows<{ d: string }>(this.db, `SELECT ${q(this.def)} AS d FROM ${q(this.t)} WHERE ${q(this.topic)} = ? COLLATE NOCASE LIMIT 1`, [topic])[0]
    return r ? toSafeHtml(r.d) : null
  }
}

export class CrossRefModule extends Module {
  refs(key: number): CrossRef[] {
    return rows<{ s: number; e: number | null; v: number }>(
      this.db,
      'SELECT TargetStart AS s, TargetEnd AS e, Votes AS v FROM CrossRef WHERE Source=? ORDER BY Votes DESC',
      [key],
    ).map((r) => ({ start: r.s, end: r.e, votes: r.v }))
  }
}

/** Detecta el tipo de módulo por sus tablas y lo abre. */
export function openModule(db: Database, id: string, name: string): Module {
  const tables = tableMap(db)
  const d = readDetails(db, tables, name)
  const info: ModuleInfo = { id, kind: 'bible', title: d.title, abbreviation: d.abbreviation, description: d.description, rtl: d.rtl, strong: d.strong }
  const bible = tables.get('bible')
  if (bible) return new BibleModule(db, info, bible)
  if (tables.has('versecommentary') || tables.has('chaptercommentary') || tables.has('bookcommentary')) {
    info.kind = 'commentary'
    return new CommentaryModule(db, info, tables)
  }
  const dict = tables.get('dictionary')
  if (dict) {
    info.kind = 'dictionary'
    return new DictionaryModule(db, info, dict)
  }
  if (tables.has('crossref')) {
    info.kind = 'crossrefs'
    return new CrossRefModule(db, info)
  }
  throw new UnsupportedModuleError(
    `Tipo de módulo no reconocido (tablas: ${[...tables.values()].join(', ') || 'ninguna'})`,
  )
}

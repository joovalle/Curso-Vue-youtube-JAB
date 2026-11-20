import { BOOKS, EXTRA_ALIASES, LOCALES, bookByNumber, type Book, type Locale } from './canon'

export interface Passage {
  book: number
  chapter: number
  verse?: number
  verseEnd?: number
}

/** Clave numérica compacta de un versículo: libro·1e6 + capítulo·1e3 + versículo. */
export const verseKey = (book: number, chapter: number, verse: number) =>
  book * 1_000_000 + chapter * 1_000 + verse

export const fromVerseKey = (key: number) => ({
  book: Math.floor(key / 1_000_000),
  chapter: Math.floor((key % 1_000_000) / 1_000),
  verse: key % 1_000,
})

/** Minúsculas, sin acentos, sin puntos y con espacios normalizados. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[.]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const compact = (s: string) => normalize(s).replace(/\s/g, '')

interface Alias { key: string; raw: string; book: Book; locale: Locale | 'any'; exact: boolean }

/** Igual que compact pero conservando acentos ("Jó" ≠ "Jo"). */
const rawKey = (s: string) => s.toLowerCase().replace(/[.\s]/g, '')
const alias = (text: string, book: Book, locale: Locale | 'any', exact: boolean): Alias =>
  ({ key: compact(text), raw: rawKey(text), book, locale, exact })

const ALIASES: Alias[] = (() => {
  const list: Alias[] = []
  for (const book of BOOKS) {
    for (const locale of LOCALES) {
      list.push(alias(book.name[locale], book, locale, false))
      list.push(alias(book.abbr[locale], book, locale, true))
    }
    list.push(alias(book.osis, book, 'any', true))
    for (const extra of EXTRA_ALIASES[book.osis] ?? []) {
      list.push(alias(extra, book, 'any', true))
    }
  }
  return list
})()

/**
 * Busca un libro a partir de un texto libre ("1 co", "Génesis", "apoc", "Jn").
 * Las coincidencias exactas ganan; luego los prefijos de nombres completos.
 * El idioma de la interfaz decide los casos ambiguos ("Jn" = Juan en español,
 * Jonas en portugués).
 */
export function resolveBook(text: string, locale: Locale = 'es'): Book | undefined {
  const q = compact(text)
  if (!q) return undefined
  const raw = rawKey(text)
  const rank = (a: Alias) => (a.locale === locale ? 0 : a.locale === 'any' ? 1 : 2) * 2 + (a.raw === raw ? 0 : 1)
  const exact = ALIASES.filter((a) => a.key === q).sort((a, b) => rank(a) - rank(b))
  if (exact.length) return exact[0].book
  const prefix = ALIASES.filter((a) => !a.exact && a.key.startsWith(q)).sort(
    (a, b) => rank(a) - rank(b) || a.book.n - b.book.n,
  )
  return prefix[0]?.book
}

/** Libros cuyo nombre empieza por el texto (para autocompletar). */
export function suggestBooks(text: string, locale: Locale = 'es', limit = 6): Book[] {
  const q = compact(text)
  if (!q) return []
  const seen = new Set<number>()
  const out: Book[] = []
  const ordered = [...ALIASES].sort((a, b) =>
    (a.locale === locale ? 0 : 1) - (b.locale === locale ? 0 : 1) || a.book.n - b.book.n,
  )
  for (const a of ordered) {
    if (a.key.startsWith(q) && !seen.has(a.book.n)) {
      seen.add(a.book.n)
      out.push(a.book)
      if (out.length >= limit) break
    }
  }
  return out
}

const REF_RE = /^\s*([123]?\s*[\p{L}][\p{L}\s.]*?)\s*(\d+)?(?:\s*[:.,]\s*(\d+)(?:\s*[-–]\s*(\d+))?)?\s*$/u

/** "Juan 3:16", "jn 3.16-18", "1co13", "Sal 23" → Passage */
export function parseReference(input: string, locale: Locale = 'es'): Passage | undefined {
  const m = REF_RE.exec(input)
  if (!m) return undefined
  const book = resolveBook(m[1], locale)
  if (!book) return undefined
  const chapter = m[2] ? Number(m[2]) : 1
  if (chapter < 1 || chapter > book.chapters) return undefined
  const verse = m[3] ? Number(m[3]) : undefined
  const verseEnd = m[4] ? Number(m[4]) : undefined
  if (verse !== undefined && verse < 1) return undefined
  if (verseEnd !== undefined && verse !== undefined && verseEnd < verse) return undefined
  return { book: book.n, chapter, verse, verseEnd }
}

export function formatPassage(p: Passage, locale: Locale = 'es', short = false): string {
  const book = bookByNumber(p.book)
  if (!book) return ''
  const name = short ? book.abbr[locale] : book.name[locale]
  let s = `${name} ${p.chapter}`
  if (p.verse) s += `:${p.verse}`
  if (p.verseEnd && p.verseEnd !== p.verse) s += `–${p.verseEnd}`
  return s
}

/** Agrupa versículos sueltos en rangos: [1,2,3,5] → "1–3, 5" */
export function formatVerseList(verses: number[]): string {
  const sorted = [...new Set(verses)].sort((a, b) => a - b)
  const parts: string[] = []
  for (let i = 0; i < sorted.length; i++) {
    const start = sorted[i]
    while (sorted[i + 1] === sorted[i] + 1) i++
    parts.push(start === sorted[i] ? `${start}` : `${start}–${sorted[i]}`)
  }
  return parts.join(', ')
}

export function nextChapter(p: Passage): Passage | undefined {
  const book = bookByNumber(p.book)!
  if (p.chapter < book.chapters) return { book: p.book, chapter: p.chapter + 1 }
  if (p.book < 66) return { book: p.book + 1, chapter: 1 }
  return undefined
}

export function prevChapter(p: Passage): Passage | undefined {
  if (p.chapter > 1) return { book: p.book, chapter: p.chapter - 1 }
  if (p.book > 1) return { book: p.book - 1, chapter: bookByNumber(p.book - 1)!.chapters }
  return undefined
}

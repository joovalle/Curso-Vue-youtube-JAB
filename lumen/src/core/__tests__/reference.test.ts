import { describe, expect, it } from 'vitest'
import { BOOKS } from '../canon'
import { formatPassage, formatVerseList, nextChapter, parseReference, prevChapter, resolveBook, suggestBooks } from '../reference'

describe('canon', () => {
  it('tiene 66 libros, 1189 capítulos y OSIS únicos', () => {
    expect(BOOKS).toHaveLength(66)
    expect(BOOKS.reduce((s, b) => s + b.chapters, 0)).toBe(1189)
    expect(new Set(BOOKS.map((b) => b.osis)).size).toBe(66)
    expect(BOOKS.filter((b) => b.testament === 'OT')).toHaveLength(39)
  })
})

describe('resolveBook', () => {
  it.each([
    ['Juan', 'John'], ['jn', 'John'], ['Génesis', 'Gen'], ['genesis', 'Gen'], ['gn', 'Gen'],
    ['1 co', '1Cor'], ['1co', '1Cor'], ['1 Corintios', '1Cor'], ['Sal', 'Ps'], ['salmo', 'Ps'],
    ['apoc', 'Rev'], ['Ap', 'Rev'], ['Hch', 'Acts'], ['Stg', 'Jas'], ['Cantar de los cantares', 'Song'],
    ['flm', 'Phlm'], ['fil', 'Phil'], ['1 Jn', '1John'], ['exodo', 'Exod'], ['Éx', 'Exod'],
  ])('%s → %s (es)', (input, osis) => {
    expect(resolveBook(input, 'es')?.osis).toBe(osis)
  })

  it('respeta el idioma en casos ambiguos', () => {
    expect(resolveBook('Jn', 'es')?.osis).toBe('John')
    expect(resolveBook('Jn', 'pt')?.osis).toBe('Jonah')
    expect(resolveBook('Jo', 'pt')?.osis).toBe('John')
    expect(resolveBook('João', 'pt')?.osis).toBe('John')
    expect(resolveBook('Jó', 'pt')?.osis).toBe('Job')
    expect(resolveBook('Psalms', 'en')?.osis).toBe('Ps')
  })

  it('autocompleta por prefijo', () => {
    expect(suggestBooks('jua', 'es').map((b) => b.osis)).toEqual(['John'])
    expect(suggestBooks('cor', 'es').length).toBe(0)
    expect(suggestBooks('1 c', 'es').map((b) => b.osis)).toContain('1Cor')
  })
})

describe('parseReference', () => {
  it.each([
    ['Juan 3:16', { book: 43, chapter: 3, verse: 16, verseEnd: undefined }],
    ['jn 3.16-18', { book: 43, chapter: 3, verse: 16, verseEnd: 18 }],
    ['1co13', { book: 46, chapter: 13, verse: undefined, verseEnd: undefined }],
    ['Sal 23', { book: 19, chapter: 23, verse: undefined, verseEnd: undefined }],
    ['Romanos', { book: 45, chapter: 1, verse: undefined, verseEnd: undefined }],
    ['  apocalipsis 22 : 21 ', { book: 66, chapter: 22, verse: 21, verseEnd: undefined }],
  ])('%s', (input, expected) => {
    expect(parseReference(input, 'es')).toEqual(expected)
  })

  it('rechaza capítulos inexistentes o texto que no es referencia', () => {
    expect(parseReference('Judas 2')).toBeUndefined()
    expect(parseReference('amor de Dios')).toBeUndefined()
    expect(parseReference('')).toBeUndefined()
  })
})

describe('formato y navegación', () => {
  it('formatea pasajes por idioma', () => {
    expect(formatPassage({ book: 43, chapter: 3, verse: 16 }, 'es')).toBe('Juan 3:16')
    expect(formatPassage({ book: 43, chapter: 3, verse: 16, verseEnd: 18 }, 'pt')).toBe('João 3:16–18')
    expect(formatPassage({ book: 1, chapter: 1 }, 'en', true)).toBe('Gen 1')
  })
  it('agrupa versículos', () => {
    expect(formatVerseList([5, 1, 2, 3, 9, 10])).toBe('1–3, 5, 9–10')
  })
  it('cruza libros al avanzar o retroceder', () => {
    expect(nextChapter({ book: 1, chapter: 50 })).toEqual({ book: 2, chapter: 1 })
    expect(prevChapter({ book: 2, chapter: 1 })).toEqual({ book: 1, chapter: 50 })
    expect(nextChapter({ book: 66, chapter: 22 })).toBeUndefined()
    expect(prevChapter({ book: 1, chapter: 1 })).toBeUndefined()
  })
})

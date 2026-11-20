import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { join } from 'node:path'
import initSqlJs, { type SqlJsStatic } from 'sql.js'
import { beforeAll, describe, expect, it } from 'vitest'
import { BOOKS } from '../canon'
import { BibleModule, CommentaryModule, CrossRefModule, DictionaryModule, UnsupportedModuleError, buildMatch, openModule } from '../engine/modules'
import { verseKey } from '../reference'

let SQL: SqlJsStatic
beforeAll(async () => { SQL = await initSqlJs() })

const load = (file: string) =>
  new SQL.Database(gunzipSync(readFileSync(join(__dirname, '../../../public/modules', file))))

describe('Biblias del catálogo (formato e-Sword .bblx)', () => {
  it('RV1909: lee capítulos y coincide con el canon', () => {
    const m = openModule(load('rv1909.bblx.gz'), 'rv1909', 'rv1909') as BibleModule
    expect(m).toBeInstanceOf(BibleModule)
    expect(m.info.title).toBe('Reina-Valera 1909')
    for (const b of BOOKS) expect(m.info.books?.[b.n], b.osis).toBe(b.chapters)
    const john3 = m.chapter(43, 3)
    expect(john3[15].verse).toBe(16)
    expect(john3[15].html).toMatch(/^Porque de tal manera amó Dios al mundo/)
    expect(m.plain(verseKey(43, 3, 16), verseKey(43, 3, 17))).toMatch(/amó Dios.*Porque no envió Dios/)
  })

  it('búsqueda sin acentos, con frases y filtros', () => {
    const m = openModule(load('rv1909.bblx.gz'), 'rv1909', 'rv1909') as BibleModule
    const r = m.search('amo Dios mundo')
    expect(r.hits.some((h) => h.key === verseKey(43, 3, 16))).toBe(true)
    expect(r.hits[0].html).toContain('<mark>')
    const nt = m.search('"en el principio"', { from: verseKey(40, 1, 1), to: verseKey(66, 999, 999) })
    expect(nt.hits[0].key).toBe(verseKey(43, 1, 1))
    expect(Object.keys(nt.perBook).every((b) => Number(b) >= 40)).toBe(true)
    expect(m.search('   ').total).toBe(0)
  })
})

describe('buildMatch', () => {
  it('neutraliza la sintaxis de FTS', () => {
    expect(buildMatch('amor OR "fe esperanza" luz*')).toBe('"amor" "OR" "fe esperanza" "luz"*')
    expect(buildMatch('a:b (c)')).toBe('"a" "b" "c"')
  })
})

describe('referencias cruzadas', () => {
  it('Juan 3:16 tiene referencias ordenadas por votos', () => {
    const m = openModule(load('xref-openbible.sqlite.gz'), 'x', 'x') as CrossRefModule
    const refs = m.refs(verseKey(43, 3, 16))
    expect(refs.length).toBeGreaterThan(5)
    expect(refs[0].votes).toBeGreaterThanOrEqual(refs[1].votes)
  })
})

describe('comentarios y diccionarios de e-Sword', () => {
  it('lee un comentario .cmtx por versículo, capítulo y libro', () => {
    const db = new SQL.Database()
    db.run(`CREATE TABLE Details (Title TEXT, Abbreviation TEXT, Description TEXT)`)
    db.run(`INSERT INTO Details VALUES ('Comentario de prueba','CP','')`)
    db.run(`CREATE TABLE VerseCommentary (Book INT, ChapterBegin INT, VerseBegin INT, ChapterEnd INT, VerseEnd INT, Comments TEXT)`)
    db.run(`INSERT INTO VerseCommentary VALUES (43,3,14,3,17,'{\\b El amor} de Dios')`)
    db.run(`CREATE TABLE ChapterCommentary (Book INT, ChapterBegin INT, ChapterEnd INT, Comments TEXT)`)
    db.run(`INSERT INTO ChapterCommentary VALUES (43,3,3,'Nicodemo')`)
    db.run(`CREATE TABLE BookCommentary (Book INT, Comments TEXT)`)
    db.run(`INSERT INTO BookCommentary VALUES (43,'<p>Evangelio</p>')`)
    const m = openModule(db, 'c', 'c') as CommentaryModule
    expect(m).toBeInstanceOf(CommentaryModule)
    const entries = m.lookup(43, 3, 16)
    expect(entries.map((e) => e.scope)).toEqual(['verse', 'chapter', 'book'])
    expect(entries[0]).toEqual({ scope: 'verse', range: '3:14–17', html: '<b>El amor</b> de Dios' })
    expect(m.lookup(43, 3, 18).map((e) => e.scope)).toEqual(['chapter', 'book'])
  })

  it('lee un diccionario .dctx (p. ej. léxico Strong)', () => {
    const db = new SQL.Database()
    db.run(`CREATE TABLE Dictionary (Topic TEXT, Definition TEXT)`)
    db.run(`INSERT INTO Dictionary VALUES ('H430','<b>elohim</b> dioses'),('H7225','reshit'),('G25','agapao')`)
    const m = openModule(db, 'd', 'd') as DictionaryModule
    expect(m.topics('h')).toEqual(['H430', 'H7225'])
    expect(m.definition('h430')).toBe('<b>elohim</b> dioses')
    expect(m.definition('X1')).toBeNull()
  })

  it('rechaza módulos desconocidos con un mensaje claro', () => {
    const db = new SQL.Database()
    db.run('CREATE TABLE Foo (a INT)')
    expect(() => openModule(db, 'u', 'u')).toThrow(UnsupportedModuleError)
  })
})

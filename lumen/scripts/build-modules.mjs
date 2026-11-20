/**
 * Genera los módulos libres que Lumen ofrece en su catálogo.
 *
 * - Biblias → archivos SQLite con el MISMO esquema que e-Sword (.bblx),
 *   para que la app lea lo incluido y lo importado con un único lector.
 * - Referencias cruzadas de OpenBible.info (CC BY) → SQLite compacto.
 *
 * Todo se comprime con gzip; la app lo descarga bajo demanda y lo guarda
 * en el dispositivo (IndexedDB). Uso:  npm run build:modules
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import initSqlJs from 'sql.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'public', 'modules')
const cacheDir = join(root, 'node_modules', '.cache', 'lumen-sources')
const SOURCE = 'https://raw.githubusercontent.com/scrollmapper/bible_databases/master'

/** Biblias de dominio público o con licencia libre. */
const BIBLES = [
  {
    id: 'rv1909',
    file: 'formats/json/SpaRV.json',
    title: 'Reina-Valera 1909',
    abbreviation: 'RV1909',
    language: 'es',
    license: 'Dominio público',
    description: 'La Santa Biblia, revisión de 1909 de la traducción de Casiodoro de Reina y Cipriano de Valera.',
  },
  {
    id: 'bsb',
    file: 'formats/json/BSB.json',
    title: 'Berean Standard Bible',
    abbreviation: 'BSB',
    language: 'en',
    license: 'CC0 (dominio público)',
    description: 'A modern, readable English translation released to the public domain in 2023.',
  },
  {
    id: 'blivre',
    file: 'formats/json/PorBLivre.json',
    title: 'Bíblia Livre',
    abbreviation: 'BLivre',
    language: 'pt',
    license: 'CC BY 3.0 BR',
    description: 'Tradução livre da Bíblia para o português, de Diego Santos e colaboradores.',
  },
]

/** Solo se incluyen referencias con al menos estos votos (calidad vs. tamaño). */
const XREF_MIN_VOTES = 5

const OSIS = ['Gen','Exod','Lev','Num','Deut','Josh','Judg','Ruth','1Sam','2Sam','1Kgs','2Kgs','1Chr','2Chr','Ezra','Neh','Esth','Job','Ps','Prov','Eccl','Song','Isa','Jer','Lam','Ezek','Dan','Hos','Joel','Amos','Obad','Jonah','Mic','Nah','Hab','Zeph','Hag','Zech','Mal','Matt','Mark','Luke','John','Acts','Rom','1Cor','2Cor','Gal','Eph','Phil','Col','1Thess','2Thess','1Tim','2Tim','Titus','Phlm','Heb','Jas','1Pet','2Pet','1John','2John','3John','Jude','Rev']

async function fetchCached(path) {
  const local = join(cacheDir, path.replaceAll('/', '_'))
  if (existsSync(local)) return readFile(local, 'utf8')
  console.log(`  ↓ ${path}`)
  const res = await fetch(`${SOURCE}/${path}`)
  if (!res.ok) throw new Error(`No se pudo descargar ${path}: ${res.status}`)
  const text = await res.text()
  await mkdir(cacheDir, { recursive: true })
  await writeFile(local, text)
  return text
}

async function buildBible(SQL, bible) {
  const data = JSON.parse(await fetchCached(bible.file))
  if (data.books.length !== 66) throw new Error(`${bible.id}: se esperaban 66 libros`)
  const db = new SQL.Database()
  // Esquema de e-Sword (.bblx)
  db.run(`CREATE TABLE Details (Title NVARCHAR(255), Abbreviation NVARCHAR(50), Description TEXT,
    Comments TEXT, Version TEXT, Font TEXT, RightToLeft BOOL, OT BOOL, NT BOOL, Apocrypha BOOL, Strong BOOL)`)
  db.run(`CREATE TABLE Bible (Book INT, Chapter INT, Verse INT, Scripture TEXT)`)
  db.run(`INSERT INTO Details VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [
    bible.title, bible.abbreviation, bible.description,
    `Licencia: ${bible.license}. Fuente: scrollmapper/bible_databases.`, '1', '', 0, 1, 1, 0, 0,
  ])
  const insert = db.prepare('INSERT INTO Bible VALUES (?,?,?,?)')
  let verses = 0
  db.run('BEGIN')
  data.books.forEach((book, i) => {
    for (const ch of book.chapters) {
      for (const v of ch.verses) {
        insert.run([i + 1, ch.chapter, v.verse, v.text.trim()])
        verses++
      }
    }
  })
  db.run('COMMIT')
  insert.free()
  db.run('CREATE INDEX BookChapterVerseIndex ON Bible (Book, Chapter, Verse)')
  const bytes = db.export()
  db.close()
  const gz = gzipSync(bytes, { level: 9 })
  await writeFile(join(outDir, `${bible.id}.bblx.gz`), gz)
  console.log(`  ✓ ${bible.abbreviation}: ${verses} versículos, ${(gz.length / 1e6).toFixed(2)} MB`)
  return { size: gz.length, verses }
}

/** "Gen.1.1" → [1, 1, 1] */
function parseOsis(ref) {
  const [b, c, v] = ref.split('.')
  const book = OSIS.indexOf(b) + 1
  if (!book) throw new Error(`Libro desconocido: ${b}`)
  return [book, Number(c), Number(v)]
}
const key = ([b, c, v]) => b * 1_000_000 + c * 1_000 + v

async function buildCrossRefs(SQL) {
  const text = await fetchCached('sources/extras/cross_references.txt')
  const db = new SQL.Database()
  db.run(`CREATE TABLE Info (Title TEXT, Description TEXT, License TEXT)`)
  db.run(`INSERT INTO Info VALUES (?,?,?)`, [
    'Referencias cruzadas', 'OpenBible.info — referencias votadas por la comunidad.', 'CC BY',
  ])
  // Versículos codificados como libro*1e6 + capítulo*1e3 + versículo
  db.run(`CREATE TABLE CrossRef (Source INT, TargetStart INT, TargetEnd INT, Votes INT)`)
  const insert = db.prepare('INSERT INTO CrossRef VALUES (?,?,?,?)')
  let count = 0
  db.run('BEGIN')
  for (const line of text.split('\n').slice(1)) {
    if (!line.trim()) continue
    const [from, to, votesStr] = line.split('\t')
    const votes = Number(votesStr)
    if (votes < XREF_MIN_VOTES) continue
    const [start, end] = to.split('-')
    insert.run([key(parseOsis(from)), key(parseOsis(start)), end ? key(parseOsis(end)) : null, votes])
    count++
  }
  db.run('COMMIT')
  insert.free()
  db.run('CREATE INDEX CrossRefSource ON CrossRef (Source)')
  const gz = gzipSync(db.export(), { level: 9 })
  db.close()
  await writeFile(join(outDir, 'xref-openbible.sqlite.gz'), gz)
  console.log(`  ✓ Referencias cruzadas: ${count}, ${(gz.length / 1e6).toFixed(2)} MB`)
  return { size: gz.length, count }
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const SQL = await initSqlJs()
  const catalog = { version: 1, modules: [] }
  console.log('Biblias:')
  for (const bible of BIBLES) {
    const { size } = await buildBible(SQL, bible)
    catalog.modules.push({
      id: bible.id, kind: 'bible', format: 'esword-bblx',
      title: bible.title, abbreviation: bible.abbreviation, language: bible.language,
      license: bible.license, description: bible.description,
      url: `modules/${bible.id}.bblx.gz`, size,
    })
  }
  console.log('Recursos:')
  const { size } = await buildCrossRefs(SQL)
  catalog.modules.push({
    id: 'xref-openbible', kind: 'crossrefs', format: 'lumen-xref',
    title: 'Referencias cruzadas (OpenBible.info)', abbreviation: 'XREF', language: 'mul',
    license: 'CC BY', description: 'Más de 100.000 referencias cruzadas votadas por la comunidad.',
    url: 'modules/xref-openbible.sqlite.gz', size,
  })
  await writeFile(join(outDir, 'catalog.json'), JSON.stringify(catalog, null, 2) + '\n')
  console.log('Catálogo listo: public/modules/catalog.json')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

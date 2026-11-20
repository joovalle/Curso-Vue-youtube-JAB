/**
 * Canon bíblico de 66 libros con nombres y abreviaturas en varios idiomas.
 * El número de libro (1–66) coincide con el que usan los módulos de e-Sword.
 */
export type Locale = 'es' | 'en' | 'pt'
export const LOCALES: Locale[] = ['es', 'en', 'pt']

export type Category =
  | 'law' | 'history' | 'poetry' | 'major-prophets' | 'minor-prophets'
  | 'gospels' | 'acts' | 'pauline' | 'general' | 'apocalyptic'

export interface Book {
  /** 1–66 */
  n: number
  osis: string
  chapters: number
  testament: 'OT' | 'NT'
  category: Category
  name: Record<Locale, string>
  abbr: Record<Locale, string>
}

// [osis, capítulos, categoría, es, abrev-es, en, abrev-en, pt, abrev-pt]
type Row = [string, number, Category, string, string, string, string, string, string]
const ROWS: Row[] = [
  ['Gen', 50, 'law', 'Génesis', 'Gn', 'Genesis', 'Gen', 'Gênesis', 'Gn'],
  ['Exod', 40, 'law', 'Éxodo', 'Éx', 'Exodus', 'Exod', 'Êxodo', 'Êx'],
  ['Lev', 27, 'law', 'Levítico', 'Lv', 'Leviticus', 'Lev', 'Levítico', 'Lv'],
  ['Num', 36, 'law', 'Números', 'Nm', 'Numbers', 'Num', 'Números', 'Nm'],
  ['Deut', 34, 'law', 'Deuteronomio', 'Dt', 'Deuteronomy', 'Deut', 'Deuteronômio', 'Dt'],
  ['Josh', 24, 'history', 'Josué', 'Jos', 'Joshua', 'Josh', 'Josué', 'Js'],
  ['Judg', 21, 'history', 'Jueces', 'Jue', 'Judges', 'Judg', 'Juízes', 'Jz'],
  ['Ruth', 4, 'history', 'Rut', 'Rt', 'Ruth', 'Ruth', 'Rute', 'Rt'],
  ['1Sam', 31, 'history', '1 Samuel', '1 S', '1 Samuel', '1 Sam', '1 Samuel', '1 Sm'],
  ['2Sam', 24, 'history', '2 Samuel', '2 S', '2 Samuel', '2 Sam', '2 Samuel', '2 Sm'],
  ['1Kgs', 22, 'history', '1 Reyes', '1 R', '1 Kings', '1 Kgs', '1 Reis', '1 Rs'],
  ['2Kgs', 25, 'history', '2 Reyes', '2 R', '2 Kings', '2 Kgs', '2 Reis', '2 Rs'],
  ['1Chr', 29, 'history', '1 Crónicas', '1 Cr', '1 Chronicles', '1 Chr', '1 Crônicas', '1 Cr'],
  ['2Chr', 36, 'history', '2 Crónicas', '2 Cr', '2 Chronicles', '2 Chr', '2 Crônicas', '2 Cr'],
  ['Ezra', 10, 'history', 'Esdras', 'Esd', 'Ezra', 'Ezra', 'Esdras', 'Ed'],
  ['Neh', 13, 'history', 'Nehemías', 'Neh', 'Nehemiah', 'Neh', 'Neemias', 'Ne'],
  ['Esth', 10, 'history', 'Ester', 'Est', 'Esther', 'Esth', 'Ester', 'Et'],
  ['Job', 42, 'poetry', 'Job', 'Job', 'Job', 'Job', 'Jó', 'Jó'],
  ['Ps', 150, 'poetry', 'Salmos', 'Sal', 'Psalms', 'Ps', 'Salmos', 'Sl'],
  ['Prov', 31, 'poetry', 'Proverbios', 'Pr', 'Proverbs', 'Prov', 'Provérbios', 'Pv'],
  ['Eccl', 12, 'poetry', 'Eclesiastés', 'Ec', 'Ecclesiastes', 'Eccl', 'Eclesiastes', 'Ec'],
  ['Song', 8, 'poetry', 'Cantares', 'Cnt', 'Song of Songs', 'Song', 'Cânticos', 'Ct'],
  ['Isa', 66, 'major-prophets', 'Isaías', 'Is', 'Isaiah', 'Isa', 'Isaías', 'Is'],
  ['Jer', 52, 'major-prophets', 'Jeremías', 'Jer', 'Jeremiah', 'Jer', 'Jeremias', 'Jr'],
  ['Lam', 5, 'major-prophets', 'Lamentaciones', 'Lm', 'Lamentations', 'Lam', 'Lamentações', 'Lm'],
  ['Ezek', 48, 'major-prophets', 'Ezequiel', 'Ez', 'Ezekiel', 'Ezek', 'Ezequiel', 'Ez'],
  ['Dan', 12, 'major-prophets', 'Daniel', 'Dn', 'Daniel', 'Dan', 'Daniel', 'Dn'],
  ['Hos', 14, 'minor-prophets', 'Oseas', 'Os', 'Hosea', 'Hos', 'Oseias', 'Os'],
  ['Joel', 3, 'minor-prophets', 'Joel', 'Jl', 'Joel', 'Joel', 'Joel', 'Jl'],
  ['Amos', 9, 'minor-prophets', 'Amós', 'Am', 'Amos', 'Amos', 'Amós', 'Am'],
  ['Obad', 1, 'minor-prophets', 'Abdías', 'Abd', 'Obadiah', 'Obad', 'Obadias', 'Ob'],
  ['Jonah', 4, 'minor-prophets', 'Jonás', 'Jon', 'Jonah', 'Jonah', 'Jonas', 'Jn'],
  ['Mic', 7, 'minor-prophets', 'Miqueas', 'Mi', 'Micah', 'Mic', 'Miqueias', 'Mq'],
  ['Nah', 3, 'minor-prophets', 'Nahúm', 'Nah', 'Nahum', 'Nah', 'Naum', 'Na'],
  ['Hab', 3, 'minor-prophets', 'Habacuc', 'Hab', 'Habakkuk', 'Hab', 'Habacuque', 'Hc'],
  ['Zeph', 3, 'minor-prophets', 'Sofonías', 'Sof', 'Zephaniah', 'Zeph', 'Sofonias', 'Sf'],
  ['Hag', 2, 'minor-prophets', 'Hageo', 'Hag', 'Haggai', 'Hag', 'Ageu', 'Ag'],
  ['Zech', 14, 'minor-prophets', 'Zacarías', 'Zac', 'Zechariah', 'Zech', 'Zacarias', 'Zc'],
  ['Mal', 4, 'minor-prophets', 'Malaquías', 'Mal', 'Malachi', 'Mal', 'Malaquias', 'Ml'],
  ['Matt', 28, 'gospels', 'Mateo', 'Mt', 'Matthew', 'Matt', 'Mateus', 'Mt'],
  ['Mark', 16, 'gospels', 'Marcos', 'Mr', 'Mark', 'Mark', 'Marcos', 'Mc'],
  ['Luke', 24, 'gospels', 'Lucas', 'Lc', 'Luke', 'Luke', 'Lucas', 'Lc'],
  ['John', 21, 'gospels', 'Juan', 'Jn', 'John', 'John', 'João', 'Jo'],
  ['Acts', 28, 'acts', 'Hechos', 'Hch', 'Acts', 'Acts', 'Atos', 'At'],
  ['Rom', 16, 'pauline', 'Romanos', 'Ro', 'Romans', 'Rom', 'Romanos', 'Rm'],
  ['1Cor', 16, 'pauline', '1 Corintios', '1 Co', '1 Corinthians', '1 Cor', '1 Coríntios', '1 Co'],
  ['2Cor', 13, 'pauline', '2 Corintios', '2 Co', '2 Corinthians', '2 Cor', '2 Coríntios', '2 Co'],
  ['Gal', 6, 'pauline', 'Gálatas', 'Gá', 'Galatians', 'Gal', 'Gálatas', 'Gl'],
  ['Eph', 6, 'pauline', 'Efesios', 'Ef', 'Ephesians', 'Eph', 'Efésios', 'Ef'],
  ['Phil', 4, 'pauline', 'Filipenses', 'Fil', 'Philippians', 'Phil', 'Filipenses', 'Fp'],
  ['Col', 4, 'pauline', 'Colosenses', 'Col', 'Colossians', 'Col', 'Colossenses', 'Cl'],
  ['1Thess', 5, 'pauline', '1 Tesalonicenses', '1 Ts', '1 Thessalonians', '1 Thess', '1 Tessalonicenses', '1 Ts'],
  ['2Thess', 3, 'pauline', '2 Tesalonicenses', '2 Ts', '2 Thessalonians', '2 Thess', '2 Tessalonicenses', '2 Ts'],
  ['1Tim', 6, 'pauline', '1 Timoteo', '1 Ti', '1 Timothy', '1 Tim', '1 Timóteo', '1 Tm'],
  ['2Tim', 4, 'pauline', '2 Timoteo', '2 Ti', '2 Timothy', '2 Tim', '2 Timóteo', '2 Tm'],
  ['Titus', 3, 'pauline', 'Tito', 'Tit', 'Titus', 'Titus', 'Tito', 'Tt'],
  ['Phlm', 1, 'pauline', 'Filemón', 'Flm', 'Philemon', 'Phlm', 'Filemom', 'Fm'],
  ['Heb', 13, 'general', 'Hebreos', 'He', 'Hebrews', 'Heb', 'Hebreus', 'Hb'],
  ['Jas', 5, 'general', 'Santiago', 'Stg', 'James', 'Jas', 'Tiago', 'Tg'],
  ['1Pet', 5, 'general', '1 Pedro', '1 P', '1 Peter', '1 Pet', '1 Pedro', '1 Pe'],
  ['2Pet', 3, 'general', '2 Pedro', '2 P', '2 Peter', '2 Pet', '2 Pedro', '2 Pe'],
  ['1John', 5, 'general', '1 Juan', '1 Jn', '1 John', '1 John', '1 João', '1 Jo'],
  ['2John', 1, 'general', '2 Juan', '2 Jn', '2 John', '2 John', '2 João', '2 Jo'],
  ['3John', 1, 'general', '3 Juan', '3 Jn', '3 John', '3 John', '3 João', '3 Jo'],
  ['Jude', 1, 'general', 'Judas', 'Jud', 'Jude', 'Jude', 'Judas', 'Jd'],
  ['Rev', 22, 'apocalyptic', 'Apocalipsis', 'Ap', 'Revelation', 'Rev', 'Apocalipse', 'Ap'],
]

export const BOOKS: Book[] = ROWS.map(([osis, chapters, category, es, esA, en, enA, pt, ptA], i) => ({
  n: i + 1,
  osis,
  chapters,
  testament: i < 39 ? 'OT' : 'NT',
  category,
  name: { es, en, pt },
  abbr: { es: esA, en: enA, pt: ptA },
}))

const byOsis = new Map(BOOKS.map((b) => [b.osis.toLowerCase(), b]))

export function bookByNumber(n: number): Book | undefined {
  return BOOKS[n - 1]
}

export function bookByOsis(osis: string): Book | undefined {
  return byOsis.get(osis.toLowerCase())
}

/** Nombres alternativos frecuentes que no son ni el nombre ni la abreviatura. */
export const EXTRA_ALIASES: Partial<Record<string, string[]>> = {
  Gen: ['gen', 'ge'],
  Exod: ['ex', 'exo'],
  Ps: ['salmo', 'sl', 'psalm', 'psa', 'salmo'],
  Prov: ['prov', 'pro'],
  Eccl: ['qohelet', 'ecl', 'ecc'],
  Song: ['cantar de los cantares', 'cantares de salomon', 'cant', 'song of solomon', 'canticle of canticles', 'cantico dos canticos', 'canticos dos canticos', 'cantares'],
  Matt: ['mat', 'mateo'],
  Mark: ['mc', 'mar'],
  Luke: ['luc', 'lk'],
  John: ['jhn', 'joh'],
  Acts: ['hech', 'hechos de los apostoles', 'atos dos apostolos'],
  Rom: ['rom', 'rm'],
  Phil: ['flp', 'php'],
  Jas: ['sant', 'stgo'],
  Rev: ['apoc', 'revelations', 'apc'],
  Phlm: ['filem'],
}

/**
 * Conversión del marcado de los módulos (e-Sword y similares) a HTML SEGURO.
 *
 * Los módulos de e-Sword guardan el texto con fragmentos de RTF
 * ({\b …}, \i … \i0, \par, \'e1, 舗?), y los de theWord/MySword con
 * etiquetas GBF (<WH7225>, <FI>…<Fi>, <FR>…<Fr>). Algunos comentarios
 * usan HTML. Todo se reconstruye aquí desde cero: el texto siempre se
 * escapa y solo se emiten etiquetas de una lista blanca, de modo que un
 * módulo importado nunca puede inyectar código en la aplicación.
 */

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const STRONG_RE = /^[HG]\d{1,5}[a-z]?$/i

const strongTag = (code: string) =>
  `<sup class="strong" data-strong="${escapeHtml(code.toUpperCase())}">${escapeHtml(code.toUpperCase())}</sup>`

// Windows-1252 para los caracteres 0x80–0x9F; el resto coincide con Latin-1.
const CP1252: Record<number, number> = {
  0x80: 0x20ac, 0x82: 0x201a, 0x83: 0x0192, 0x84: 0x201e, 0x85: 0x2026, 0x86: 0x2020, 0x87: 0x2021,
  0x88: 0x02c6, 0x89: 0x2030, 0x8a: 0x0160, 0x8b: 0x2039, 0x8c: 0x0152, 0x8e: 0x017d, 0x91: 0x2018,
  0x92: 0x2019, 0x93: 0x201c, 0x94: 0x201d, 0x95: 0x2022, 0x96: 0x2013, 0x97: 0x2014, 0x98: 0x02dc,
  0x99: 0x2122, 0x9a: 0x0161, 0x9b: 0x203a, 0x9c: 0x0153, 0x9e: 0x017e, 0x9f: 0x0178,
}

const looksLikeRtf = (s: string) => /\\[a-z]+-?\d*|\\'[0-9a-f]{2}|\\u-?\d+/i.test(s)
const looksLikeGbf = (s: string) => /<(W[HG]\d+[a-z]?|F[IiRrO]|R[Ff]|T[Ss])>/.test(s)
const looksLikeHtml = (s: string) => /<\/?[a-z][a-z0-9]*(\s[^>]*)?>/i.test(s)

interface RtfState { b: boolean; i: boolean; sup: boolean; sub: boolean; u: boolean; skip: boolean }

/** Grupos RTF cuyo contenido no es texto visible. */
const RTF_DESTINATIONS = new Set([
  'fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'header', 'footer', 'xmlnstbl', 'listtable',
  'listoverridetable', 'rsidtbl', 'generator', 'themedata', 'datastore', 'latentstyles',
])

function rtfToHtml(src: string): string {
  type Seg = { text: string; state: RtfState } | { br: true }
  const segs: Seg[] = []
  const stack: RtfState[] = []
  let state: RtfState = { b: false, i: false, sup: false, sub: false, u: false, skip: false }
  let skipChars = 0
  let groupStart = false

  const push = (text: string) => {
    if (state.skip || !text) return
    if (skipChars > 0) {
      const drop = Math.min(skipChars, text.length)
      skipChars -= drop
      text = text.slice(drop)
      if (!text) return
    }
    const last = segs[segs.length - 1]
    if (last && 'text' in last && sameState(last.state, state)) last.text += text
    else segs.push({ text, state: { ...state } })
  }

  const re = /\\'([0-9a-f]{2})|\\u(-?\d+) ?\??|\\([a-z]+)(-?\d+)? ?|\\([\\{}~_-])|\\\*|([{}])|\r?\n|([^\\{}\r\n]+)|\\/giy
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    const isGroupStart = groupStart
    groupStart = false
    if (m[1]) {
      const code = parseInt(m[1], 16)
      push(String.fromCharCode(CP1252[code] ?? code))
    } else if (m[2] !== undefined) {
      let code = Number(m[2])
      if (code < 0) code += 65536
      push(String.fromCharCode(code))
    } else if (m[3]) {
      const word = m[3].toLowerCase()
      const param = m[4] !== undefined ? Number(m[4]) : undefined
      const on = param !== 0
      if (isGroupStart && RTF_DESTINATIONS.has(word)) state.skip = true
      switch (word) {
        case 'b': state.b = on; break
        case 'i': state.i = on; break
        case 'ul': state.u = on; break
        case 'ulnone': state.u = false; break
        case 'super': state.sup = true; state.sub = false; break
        case 'sub': state.sub = true; state.sup = false; break
        case 'nosupersub': state.sup = false; state.sub = false; break
        case 'plain': Object.assign(state, { b: false, i: false, sup: false, sub: false, u: false }); break
        case 'par': case 'line': if (!state.skip) segs.push({ br: true }); break
        case 'tab': push(' '); break
        case 'emdash': push('—'); break
        case 'endash': push('–'); break
        case 'lquote': push('‘'); break
        case 'rquote': push('’'); break
        case 'ldblquote': push('“'); break
        case 'rdblquote': push('”'); break
        case 'bullet': push('•'); break
        case 'uc': skipChars = 0; break
        default: break // colores, fuentes, tamaños… se ignoran
      }
    } else if (m[5]) {
      push(m[5] === '~' ? ' ' : m[5] === '_' ? '-' : m[5] === '-' ? '' : m[5])
    } else if (m[0] === '\\*') {
      state.skip = true
    } else if (m[6] === '{') {
      stack.push({ ...state })
      groupStart = true
    } else if (m[6] === '}') {
      state = stack.pop() ?? state
    } else if (m[7]) {
      push(m[7])
    }
    if (m[0] === '') re.lastIndex++
  }

  let html = ''
  for (const seg of segs) {
    if ('br' in seg) { html += '<br>'; continue }
    const { text, state: s } = seg
    if (s.sup && STRONG_RE.test(text.trim())) { html += strongTag(text.trim()); continue }
    let piece = escapeHtml(text)
    if (s.sup) piece = `<sup>${piece}</sup>`
    if (s.sub) piece = `<sub>${piece}</sub>`
    if (s.u) piece = `<u>${piece}</u>`
    if (s.i) piece = `<i>${piece}</i>`
    if (s.b) piece = `<b>${piece}</b>`
    html += piece
  }
  return html.replace(/(<br>\s*)+$/, '').trim()
}

const sameState = (a: RtfState, b: RtfState) =>
  a.b === b.b && a.i === b.i && a.sup === b.sup && a.sub === b.sub && a.u === b.u

function gbfToHtml(src: string): string {
  let out = ''
  const re = /<(W[HG]\d+[a-z]?)>|<(WT[^>]*)>|<(FI|Fi|FR|Fr|FO|Fo|RF|Rf|TS|Ts|CM|CL|PF\d?|PI\d?)>|<[^>]*>|([^<]+)/g
  let m: RegExpExecArray | null
  let inNote = false
  while ((m = re.exec(src)) !== null) {
    if (m[1]) out += strongTag(m[1].slice(1))
    else if (m[2]) continue // morfología: se omite por ahora
    else if (m[3]) {
      const t = m[3]
      if (t === 'FI') out += '<i>'
      else if (t === 'Fi') out += '</i>'
      else if (t === 'FR') out += '<span class="woj">'
      else if (t === 'Fr') out += '</span>'
      else if (t === 'FO') out += '<span class="ot-quote">'
      else if (t === 'Fo') out += '</span>'
      else if (t === 'RF') { out += '<span class="note">'; inNote = true }
      else if (t === 'Rf') { if (inNote) out += '</span>'; inNote = false }
      else if (t === 'TS') out += '<span class="title">'
      else if (t === 'Ts') out += '</span>'
      else if (t === 'CM' || t === 'CL' || t.startsWith('P')) out += '<br>'
    } else if (m[4]) out += escapeHtml(m[4])
  }
  if (inNote) out += '</span>'
  return out
}

const ALLOWED_TAGS = new Set([
  'b', 'strong', 'i', 'em', 'u', 'sup', 'sub', 'br', 'p', 'div', 'span', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'small', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'hr',
])
const VOID_TAGS = new Set(['br', 'hr'])
const DROP_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'svg', 'math', 'head', 'title'])

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
export const decodeEntities = (s: string) =>
  s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e: string) => {
    if (e[0] === '#') {
      const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : Number(e.slice(1))
      return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : ''
    }
    return ENTITIES[e.toLowerCase()] ?? all
  })

function sanitizeHtml(src: string): string {
  let out = ''
  const open: string[] = []
  let dropping: string | null = null
  const re = /<!--[\s\S]*?-->|<(\/?)([a-z][a-z0-9]*)\b[^>]*?(\/?)>|([^<]+)|</gi
  let m: RegExpExecArray | null
  while ((m = re.exec(src)) !== null) {
    const [, closing, rawTag, , text] = m
    if (text !== undefined || m[0] === '<') {
      if (!dropping) out += escapeHtml(decodeEntities(text ?? '<'))
      continue
    }
    if (!rawTag) continue
    const tag = rawTag.toLowerCase()
    if (dropping) {
      if (closing && tag === dropping) dropping = null
      continue
    }
    if (DROP_CONTENT.has(tag)) { if (!closing) dropping = tag; continue }
    const mapped = tag === 'strong' ? 'b' : tag === 'em' ? 'i' : tag === 'a' || tag === 'font' ? 'span' : tag
    if (!ALLOWED_TAGS.has(mapped)) continue
    if (VOID_TAGS.has(mapped)) { if (!closing) out += `<${mapped}>`; continue }
    if (closing) {
      const idx = open.lastIndexOf(mapped)
      if (idx === -1) continue
      while (open.length > idx) out += `</${open.pop()}>`
    } else {
      open.push(mapped)
      out += `<${mapped}>`
    }
  }
  while (open.length) out += `</${open.pop()}>`
  return out
}

/** Convierte cualquier texto de módulo en HTML seguro para mostrar. */
export function toSafeHtml(raw: string | null | undefined): string {
  if (!raw) return ''
  if (looksLikeGbf(raw)) return gbfToHtml(raw)
  if (looksLikeRtf(raw)) return rtfToHtml(raw)
  if (looksLikeHtml(raw)) return sanitizeHtml(raw)
  return escapeHtml(raw)
}

/** Texto plano (para búsquedas, copiar y vistas previas). Omite los números Strong. */
export function toPlainText(raw: string | null | undefined): string {
  const html = toSafeHtml(raw)
  return decodeEntities(
    html
      .replace(/<sup class="strong"[^>]*>.*?<\/sup>/g, '')
      .replace(/<span class="note">.*?<\/span>/g, '')
      .replace(/<br>|<\/p>|<\/div>|<\/li>/g, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim()
}

import { describe, expect, it } from 'vitest'
import { toPlainText, toSafeHtml } from '../markup'

describe('toSafeHtml', () => {
  it('escapa texto plano', () => {
    expect(toSafeHtml('a < b & "c"')).toBe('a &lt; b &amp; &quot;c&quot;')
  })

  it('convierte RTF de e-Sword', () => {
    expect(toSafeHtml('{\\b Dios} es \\i amor\\i0 .')).toBe('<b>Dios</b> es <i>amor</i>.')
    expect(toSafeHtml("cri\\'f3 los cielos")).toBe('creó los cielos'.replace('creó', 'crió'))
    expect(toSafeHtml('l\\u237?nea\\par dos')).toBe('línea<br>dos')
  })

  it('reconoce números Strong en RTF y GBF', () => {
    expect(toSafeHtml('In the beginning{\\super H7225} God')).toContain('data-strong="H7225"')
    expect(toSafeHtml('God<WH430> created<WH1254>')).toBe(
      'God<sup class="strong" data-strong="H430">H430</sup> created<sup class="strong" data-strong="H1254">H1254</sup>',
    )
    expect(toSafeHtml('<FI>was<Fi> <FR>I am<Fr>')).toBe('<i>was</i> <span class="woj">I am</span>')
  })

  it('ignora tablas de fuentes y colores', () => {
    expect(toSafeHtml('{\\rtf1{\\fonttbl{\\f0 Arial;}}{\\colortbl;\\red0\\green0\\blue0;}\\f0 Hola}')).toBe('Hola')
  })

  it('limpia HTML peligroso de comentarios', () => {
    const out = toSafeHtml('<p onclick="x()">Hola <script>alert(1)</script><b>mundo</b><img src=x onerror=y></p>')
    expect(out).toBe('<p>Hola <b>mundo</b></p>')
    expect(toSafeHtml('<a href="javascript:alert(1)">ver</a>')).toBe('<span>ver</span>')
    expect(toSafeHtml('<b>sin cerrar')).toBe('<b>sin cerrar</b>')
  })
})

describe('toPlainText', () => {
  it('quita marcas y números Strong', () => {
    expect(toPlainText('God<WH430> created<WH1254> the heaven')).toBe('God created the heaven')
    expect(toPlainText('{\\b Dios}\\par es amor')).toBe('Dios es amor')
    expect(toPlainText('<p>A &amp; B</p>')).toBe('A & B')
  })
})

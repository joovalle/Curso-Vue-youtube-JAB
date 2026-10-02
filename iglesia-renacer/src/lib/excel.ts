import type { Movimiento } from './types'
import { MESES } from './format'
import { porCategoria, porMes, resumir } from './datos'

interface Opciones {
  titulo: string // "Reporte mensual — Octubre 2026"
  archivo: string // sin extensión
  movimientos: Movimiento[]
  saldoInicial: number
  anual?: boolean // agrega hoja con el desglose por mes
}

const MORADO = 'FF7A4A9E'
const MONEDA = (import.meta.env.VITE_MONEDA as string | undefined) || 'CLP'
// Pesos chilenos no usan decimales; el resto de monedas muestra 2
const FORMATO_DINERO = ['CLP', 'COP', 'PYG'].includes(MONEDA) ? '"$"#,##0' : '"$"#,##0.00'

export async function exportarExcel(o: Opciones) {
  const ExcelJS = (await import('exceljs')).default
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Templo Cristiano Renacer'
  const { ingresos, gastos, saldo } = resumir(o.movimientos)

  const encabezado = (row: import('exceljs').Row) => {
    row.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: MORADO } }
    row.alignment = { vertical: 'middle' }
  }
  const titulo = (ws: import('exceljs').Worksheet, texto: string, cols: number) => {
    ws.mergeCells(1, 1, 1, cols)
    ws.getCell('A1').value = 'Templo Cristiano Renacer · Patricio Lynch'
    ws.getCell('A1').font = { bold: true, size: 14, color: { argb: MORADO } }
    ws.mergeCells(2, 1, 2, cols)
    ws.getCell('A2').value = texto
    ws.getCell('A2').font = { size: 12, color: { argb: 'FF475569' } }
  }

  // ---- Hoja 1: Resumen ----
  const r = wb.addWorksheet('Resumen')
  r.columns = [{ width: 38 }, { width: 18 }, { width: 18 }]
  titulo(r, o.titulo, 3)
  r.addRow([])
  const filaResumen: [string, number][] = [
    ['Saldo inicial', o.saldoInicial],
    ['Total ingresos', ingresos],
    ['Total gastos', gastos],
    ['Resultado del período', saldo],
    ['Saldo final', o.saldoInicial + saldo],
  ]
  filaResumen.forEach(([k, v], i) => {
    const row = r.addRow([k, v])
    row.getCell(2).numFmt = FORMATO_DINERO
    if (i >= 3) row.font = { bold: true }
  })

  const bloque = (nombre: string, datos: { nombre: string; total: number }[], total: number) => {
    r.addRow([])
    encabezado(r.addRow([nombre, 'Monto', '% del total']))
    for (const d of datos) {
      const row = r.addRow([d.nombre, d.total, total ? d.total / total : 0])
      row.getCell(2).numFmt = FORMATO_DINERO
      row.getCell(3).numFmt = '0.0%'
    }
  }
  bloque('Ingresos por categoría', porCategoria(o.movimientos, 'ingreso'), ingresos)
  bloque('Gastos por categoría', porCategoria(o.movimientos, 'gasto'), gastos)

  // ---- Hoja 2 (solo anual): por mes ----
  if (o.anual) {
    const m = wb.addWorksheet('Por mes')
    m.columns = [{ width: 16 }, { width: 18 }, { width: 18 }, { width: 18 }]
    titulo(m, o.titulo, 4)
    m.addRow([])
    encabezado(m.addRow(['Mes', 'Ingresos', 'Gastos', 'Resultado']))
    porMes(o.movimientos).forEach((x, i) => {
      const row = m.addRow([MESES[i], x.ingresos, x.gastos, x.ingresos - x.gastos])
      ;[2, 3, 4].forEach((c) => (row.getCell(c).numFmt = FORMATO_DINERO))
    })
    const t = m.addRow(['TOTAL', ingresos, gastos, saldo])
    t.font = { bold: true }
    ;[2, 3, 4].forEach((c) => (t.getCell(c).numFmt = FORMATO_DINERO))
  }

  // ---- Hoja: Movimientos ----
  const d = wb.addWorksheet('Movimientos', { views: [{ state: 'frozen', ySplit: 4 }] })
  d.columns = [{ width: 13 }, { width: 11 }, { width: 34 }, { width: 50 }, { width: 18 }, { width: 22 }, { width: 14 }]
  titulo(d, o.titulo, 7)
  d.addRow([])
  encabezado(d.addRow(['Fecha', 'Tipo', 'Categoría', 'Descripción', 'Monto', 'Registrado por', 'Comprobante']))
  for (const x of o.movimientos) {
    const [y, mm, dd] = x.fecha.split('-').map(Number)
    const row = d.addRow([
      new Date(Date.UTC(y, mm - 1, dd)),
      x.tipo === 'ingreso' ? 'Ingreso' : 'Gasto',
      x.categorias?.nombre ?? '',
      x.descripcion,
      Number(x.monto) * (x.tipo === 'gasto' ? -1 : 1),
      x.perfiles?.nombre ?? '',
      x.comprobante_path ? 'Sí' : 'No',
    ])
    row.getCell(1).numFmt = 'dd/mm/yyyy'
    row.getCell(5).numFmt = FORMATO_DINERO
    row.getCell(5).font = { color: { argb: x.tipo === 'ingreso' ? 'FF047857' : 'FFBE123C' } }
  }
  d.autoFilter = { from: 'A4', to: 'G4' }

  const buf = await wb.xlsx.writeBuffer()
  const url = URL.createObjectURL(
    new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = `${o.archivo}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

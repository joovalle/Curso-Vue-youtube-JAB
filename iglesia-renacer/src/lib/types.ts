export type Rol = 'admin' | 'tesorero' | 'consulta'
export type Tipo = 'ingreso' | 'gasto'

export interface Perfil {
  id: string
  nombre: string
  email: string
  rol: Rol
  activo: boolean
  creado_en: string
}

export interface Categoria {
  id: string
  nombre: string
  tipo: Tipo
  activa: boolean
}

export interface Movimiento {
  id: string
  fecha: string // YYYY-MM-DD
  tipo: Tipo
  monto: number
  categoria_id: string
  descripcion: string
  comprobante_path: string | null
  creado_por: string | null
  categorias: { nombre: string } | null
  perfiles: { nombre: string } | null
}

export const ROLES: Record<Rol, { etiqueta: string; descripcion: string }> = {
  admin: { etiqueta: 'Administrador', descripcion: 'Todo: movimientos, categorías y usuarios' },
  tesorero: { etiqueta: 'Tesorero', descripcion: 'Registra y edita movimientos y reportes' },
  consulta: { etiqueta: 'Consulta', descripcion: 'Solo puede ver y exportar reportes' },
}

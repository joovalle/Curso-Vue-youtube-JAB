// Regiones de Chile y sus comunas principales, con una "zona de envío" asignada
// para el cálculo de costos de despacho (ver services/shipping.js).
// zona: 1 = Región Metropolitana, 2 = zona central, 3 = norte/sur medio, 4 = extremo

export const REGIONES = [
  {
    id: 'arica-parinacota',
    nombre: 'Arica y Parinacota',
    zona: 4,
    comunas: ['Arica', 'Camarones', 'Putre', 'General Lagos'],
  },
  {
    id: 'tarapaca',
    nombre: 'Tarapacá',
    zona: 4,
    comunas: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Camiña', 'Colchane', 'Huara', 'Pica'],
  },
  {
    id: 'antofagasta',
    nombre: 'Antofagasta',
    zona: 3,
    comunas: ['Antofagasta', 'Calama', 'Mejillones', 'Taltal', 'Tocopilla', 'San Pedro de Atacama', 'María Elena', 'Sierra Gorda', 'Ollagüe'],
  },
  {
    id: 'atacama',
    nombre: 'Atacama',
    zona: 3,
    comunas: ['Copiapó', 'Caldera', 'Tierra Amarilla', 'Vallenar', 'Freirina', 'Huasco', 'Chañaral', 'Diego de Almagro', 'Alto del Carmen'],
  },
  {
    id: 'coquimbo',
    nombre: 'Coquimbo',
    zona: 3,
    comunas: ['La Serena', 'Coquimbo', 'Ovalle', 'Illapel', 'Vicuña', 'Andacollo', 'Los Vilos', 'Salamanca', 'Combarbalá', 'Monte Patria'],
  },
  {
    id: 'valparaiso',
    nombre: 'Valparaíso',
    zona: 2,
    comunas: [
      'Valparaíso', 'Viña del Mar', 'Quilpué', 'Villa Alemana', 'Concón', 'San Antonio',
      'Quillota', 'La Calera', 'Los Andes', 'San Felipe', 'Casablanca', 'Limache', 'Olmué', 'Quintero',
    ],
  },
  {
    id: 'metropolitana',
    nombre: 'Región Metropolitana',
    zona: 1,
    comunas: [
      'Santiago', 'Providencia', 'Las Condes', 'Vitacura', 'Ñuñoa', 'La Reina', 'Macul', 'Peñalolén',
      'La Florida', 'Puente Alto', 'Maipú', 'Estación Central', 'Independencia', 'Recoleta', 'Quinta Normal',
      'Cerrillos', 'Renca', 'Quilicura', 'Huechuraba', 'Conchalí', 'San Miguel', 'San Joaquín', 'La Cisterna',
      'El Bosque', 'Pedro Aguirre Cerda', 'Lo Espejo', 'La Granja', 'La Pintana', 'San Ramón', 'Cerro Navia',
      'Lo Prado', 'Pudahuel', 'San Bernardo', 'Colina', 'Lampa', 'Melipilla', 'Talagante', 'Buin', 'Paine',
    ],
  },
  {
    id: 'ohiggins',
    nombre: "Libertador Bernardo O'Higgins",
    zona: 2,
    comunas: ['Rancagua', 'Machalí', 'Rengo', 'San Fernando', 'Santa Cruz', 'Pichilemu', 'Graneros', 'Doñihue', 'Requínoa', 'Coltauco'],
  },
  {
    id: 'maule',
    nombre: 'Maule',
    zona: 2,
    comunas: ['Talca', 'Curicó', 'Linares', 'Constitución', 'Cauquenes', 'Molina', 'San Javier', 'Parral', 'Villa Alegre'],
  },
  {
    id: 'nuble',
    nombre: 'Ñuble',
    zona: 2,
    comunas: ['Chillán', 'Chillán Viejo', 'San Carlos', 'Bulnes', 'Quirihue', 'Coihueco'],
  },
  {
    id: 'biobio',
    nombre: 'Biobío',
    zona: 2,
    comunas: ['Concepción', 'Talcahuano', 'Chiguayante', 'San Pedro de la Paz', 'Coronel', 'Los Ángeles', 'Hualpén', 'Tomé', 'Penco', 'Lota', 'Arauco', 'Cañete'],
  },
  {
    id: 'araucania',
    nombre: 'La Araucanía',
    zona: 3,
    comunas: ['Temuco', 'Padre Las Casas', 'Villarrica', 'Angol', 'Pucón', 'Victoria', 'Nueva Imperial', 'Lautaro'],
  },
  {
    id: 'los-rios',
    nombre: 'Los Ríos',
    zona: 3,
    comunas: ['Valdivia', 'La Unión', 'Río Bueno', 'Paillaco', 'Panguipulli', 'Los Lagos'],
  },
  {
    id: 'los-lagos',
    nombre: 'Los Lagos',
    zona: 3,
    comunas: ['Puerto Montt', 'Puerto Varas', 'Osorno', 'Castro', 'Ancud', 'Quellón', 'Frutillar', 'Llanquihue', 'Chonchi'],
  },
  {
    id: 'aysen',
    nombre: 'Aysén',
    zona: 4,
    comunas: ['Coyhaique', 'Puerto Aysén', 'Chile Chico', 'Cochrane', 'Cisnes'],
  },
  {
    id: 'magallanes',
    nombre: 'Magallanes y la Antártica Chilena',
    zona: 4,
    comunas: ['Punta Arenas', 'Puerto Natales', 'Porvenir', 'Cabo de Hornos'],
  },
]

export function comunasDeRegion(regionId) {
  return REGIONES.find((r) => r.id === regionId)?.comunas ?? []
}

export function zonaDeRegion(regionId) {
  return REGIONES.find((r) => r.id === regionId)?.zona ?? 3
}

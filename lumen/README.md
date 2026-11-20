# Lumen — Biblia de estudio

> *«Lámpara es a mis pies tu palabra, y lumbrera a mi camino.»* — Salmos 119:105

Lumen es una aplicación **libre y gratuita** para leer y estudiar la Biblia, inspirada en e-Sword pero pensada desde cero para hoy:

- **Hermosa y cómoda**: tipografía de lectura (Literata), temas Claro, Sepia y Oscuro, letra capital como en las Biblias impresas y sin distracciones.
- **Compatible con e-Sword**: importa tus módulos `.bblx` (Biblias), `.cmtx` (comentarios) y `.dctx` (diccionarios y léxicos Strong).
- **Sin servidor ni base de datos**: todo corre en tu dispositivo (SQLite en WebAssembly). Funciona **sin conexión**.
- **Privada**: sin cuentas, sin anuncios, sin rastreo. Las notas y subrayados nunca salen del dispositivo.
- **Multilingüe**: interfaz en español, inglés y portugués; el canon y el buscador de referencias entienden los tres idiomas.
- **Para todos los dispositivos**: es una PWA (web instalable). El mismo código se empaqueta para Android/iOS (Capacitor) y escritorio (Tauri).

## Qué incluye este esqueleto (v0.1)

| Área | Funciones |
|---|---|
| Lectura | Modo párrafo o versículo por línea, letra capital, números de versículo, números Strong (si el módulo los trae), palabras de Jesús en rojo (módulos GBF) |
| Navegación | Selector de libros por categorías, «Jn 3:16» directo, paleta de comandos (`Ctrl/⌘ K`), flechas ← →, deslizar en móvil, historial |
| Estudio | Panel lateral con referencias cruzadas (100 000+, OpenBible.info), comparación de versiones, notas, comentarios y diccionario; clic en un número Strong → léxico |
| Vista paralela | Hasta 4 versiones alineadas por versículo |
| Búsqueda | Texto completo sin acentos, frases exactas `"..."`, prefijos `salv*`, filtros AT/NT/libro, resultados por libro |
| Marcado | Subrayado en 5 colores, notas por versículo, marcadores, copiar y compartir con referencia |
| Biblioteca | Catálogo gratuito descargable (RV 1909, BSB, Bíblia Livre, referencias cruzadas) e importación de módulos e-Sword arrastrando archivos |
| Datos | Copia de seguridad en JSON (exportar e importar), almacenamiento persistente |

## Cómo ejecutarlo

Necesitas [Node.js](https://nodejs.org) 20 o superior.

```bash
cd lumen
npm install
npm run dev        # servidor de desarrollo en http://localhost:5173
npm test           # pruebas unitarias (canon, referencias, lector e-Sword, búsqueda, traducciones)
npm run build      # versión de producción en dist/ (lista para cualquier hosting estático)
```

Para publicar la web basta con subir `dist/` a GitHub Pages, Cloudflare Pages o Netlify (gratis). Las rutas son relativas, así que funciona en cualquier subcarpeta.

### Regenerar los módulos libres

Los módulos del catálogo ya vienen generados en `public/modules/`. Para regenerarlos (o añadir otras traducciones libres):

```bash
npm run build:modules   # descarga los textos y crea los .bblx (formato e-Sword) comprimidos
npm run build:icons     # genera los íconos PNG a partir de public/favicon.svg
```

Para añadir una traducción, agrégala a la lista `BIBLES` de `scripts/build-modules.mjs`. Usa solo textos de dominio público o con licencia libre.

## Arquitectura

```
src/
├── core/                    ← lógica pura, sin interfaz (probada con Vitest)
│   ├── canon.ts             66 libros: OSIS, capítulos, categorías, nombres y abreviaturas es/en/pt
│   ├── reference.ts         intérprete de referencias («1co13:4-7», «Sal 23», «João 3.16»)
│   ├── markup.ts            RTF de e-Sword / GBF / HTML → HTML seguro (lista blanca)
│   ├── engine/
│   │   ├── modules.ts       lectores de Biblias, comentarios, diccionarios y referencias (SQLite)
│   │   ├── worker.ts        motor SQLite (sql.js) en un Web Worker: la interfaz nunca se congela
│   │   └── client.ts        acceso al worker con Comlink
│   └── storage/db.ts        IndexedDB: módulos instalados, subrayados, notas, marcadores
├── stores/                  estado (Pinia): ajustes, biblioteca, lectura, anotaciones
├── components/              barra de lectura, texto, vista paralela, panel de estudio, paleta…
├── views/                   Leer, Buscar, Biblioteca, Notas, Ajustes, Acerca de, Bienvenida
├── i18n/                    traducciones (es, en, pt)
└── styles/                  tokens de diseño y estilos base
```

**Decisión clave:** las Biblias del catálogo se generan con el **mismo esquema SQLite que e-Sword** (`Bible(Book, Chapter, Verse, Scripture)` + `Details`). Así, lo incluido y lo importado pasan por un único lector, y la compatibilidad se prueba con cada lectura.

**Seguridad:** el texto de los módulos importados nunca se inserta tal cual. `markup.ts` lo reconstruye escapando todo y emitiendo solo etiquetas permitidas, así que un módulo malicioso no puede ejecutar código.

## Compatibilidad con e-Sword

| Formato | Estado |
|---|---|
| `.bblx` Biblias (e-Sword 9+) | ✅ Texto, cursivas, negritas, números Strong en RTF |
| `.cmtx` Comentarios | ✅ Por versículo/rango, capítulo y libro |
| `.dctx` Diccionarios / léxicos | ✅ Búsqueda por tema y número Strong |
| MySword `.bbl.mybible` | 🟡 Biblias probablemente sí (mismo esquema); falta probar con módulos reales |
| `.bbl`, `.cmt`, `.dct` (e-Sword ≤ 8, Access) | ❌ Formato antiguo: conviértelos con herramientas de la comunidad |
| Módulos protegidos o de pago | ❌ No se admiten ni se admitirán |

> ⚖️ **Importante:** muchos módulos de e-Sword tienen derechos de autor. Lumen **no distribuye** ese contenido: cada persona importa en su dispositivo los módulos que tiene derecho a usar. El catálogo incluido solo contiene textos de dominio público o con licencia libre.

Los esquemas de `.cmtx` y `.dctx` se implementaron según su estructura conocida y se probaron con módulos sintéticos. **Antes de publicar conviene probarlos con módulos reales** de e-Sword y ajustar lo que haga falta.

## Hoja de ruta sugerida

1. **Probar con módulos reales de e-Sword** y ajustar el lector (formatos RTF menos comunes, referencias dentro de comentarios).
2. **Más textos libres**: KJV, Reina-Valera 1865, Almeida, griego (SBLGNT, TR) y hebreo (WLC) con morfología, léxicos Strong en español.
3. **Interlineal y morfología** con los datos abiertos de STEPBible (CC BY).
4. **Apps nativas**: Capacitor para Android/iOS y Tauri para Windows/macOS/Linux (instaladores de unos 10 MB).
5. **Planes de lectura**, versículo del día y memorización.
6. **Sincronización opcional** de notas sin servidor propio (archivo, Google Drive, iCloud o WebDAV).
7. **Más idiomas** de interfaz (francés, italiano, alemán…): basta con añadir un archivo en `src/i18n/locales/`.

### Empaquetar para Android / iOS (Capacitor)

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
npx cap init Lumen org.lumen.app --web-dir dist
npm run build && npx cap add android && npx cap open android
```

iOS requiere macOS con Xcode y una cuenta de Apple Developer (≈ 99 USD/año). Google Play cobra un único pago (≈ 25 USD).

### Empaquetar para escritorio (Tauri)

```bash
npm install -D @tauri-apps/cli
npx tauri init        # directorio web: ../dist · comando de build: npm run build
npx tauri build
```

## Donaciones

Edita `src/config.ts` para añadir los enlaces de donación (Ko-fi, PayPal, GitHub Sponsors, etc.) y del repositorio. La pantalla «Acerca de» los mostrará automáticamente. En la versión de iOS conviene enlazar las donaciones a la web, por las normas de la App Store.

## Créditos y licencias de contenido

- **Reina-Valera 1909** — dominio público
- **Berean Standard Bible** — CC0 (dominio público)
- **Bíblia Livre** — CC BY 3.0 BR
- **Referencias cruzadas** — [OpenBible.info](https://www.openbible.info/labs/cross-references/), CC BY
- Textos obtenidos de [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases)
- Tipografías Inter y Literata (SIL Open Font License)

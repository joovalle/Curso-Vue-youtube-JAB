# La Ruta del Neumático — Tienda online

E-commerce de neumáticos con envío a todo Chile o retiro en sucursal, panel de
administración de stock, pago con Mercado Pago, selector de medida rápido,
carrito, modo claro/oscuro y varias paletas de color.

**Sitio en modo demo (sin configurar nada):** el catálogo se guarda en el
navegador (localStorage) y las compras se completan como "prueba", sin cobrar.
Así puedes ver y probar todo el flujo hoy mismo. Cuando quieras que sea real,
sigue los pasos de abajo.

## Requisitos

- Node.js 18 o superior

## Instalación y desarrollo local

```sh
npm install
npm run dev
```

Abre la URL que muestra la terminal (por defecto http://localhost:5173).

## Compilar para producción

```sh
npm run build
```

Genera la carpeta `dist/` lista para subir a cualquier hosting estático.

---

## 1. Hacer que el stock persista de verdad (Firebase)

Sin esto, cada admin ve su propio stock guardado solo en su navegador. Para
que todos vean el mismo stock en tiempo real:

1. Ve a https://console.firebase.google.com y crea un proyecto gratis.
2. En el menú del proyecto, entra a **Compilación → Firestore Database** y
   crea una base de datos (modo producción, cualquier región cercana a Chile).
3. Entra a **Compilación → Authentication → Sign-in method** y activa
   **Correo electrónico/contraseña**. Luego en la pestaña **Users**, crea el
   usuario administrador (correo + clave) con el que se ingresará al panel.
4. En **Configuración del proyecto → Tus apps**, crea una "App web" y copia
   los valores de configuración.
5. Copia el archivo `.env.example` a `.env` y completa las variables
   `VITE_FIREBASE_*` con esos valores.
6. Vuelve a compilar (`npm run build`) y despliega de nuevo.

Con eso, el panel `/admin/login` pide correo y clave (Firebase Auth) y el
catálogo se guarda en Firestore, visible para todos los visitantes.

## 2. Activar cobros reales con Mercado Pago

1. Crea una cuenta en https://www.mercadopago.cl/developers/panel y obtén tu
   **Access Token** (de prueba o de producción).
2. Copia `server/.env.example` a `server/.env` y pega tu `MP_ACCESS_TOKEN`.
3. Corre el backend de pagos: `npm run server` (queda escuchando en el
   puerto 4000).
4. En el `.env` del frontend, agrega `VITE_API_URL=http://localhost:4000`
   (o la URL pública donde despliegues ese backend).
5. Vuelve a compilar el frontend.

Para producción necesitas alojar `server/` en un servicio que mantenga un
proceso Node corriendo (Render, Railway, un VPS, etc.) **o** desplegar
`api/create-preference.js` como función serverless en Vercel — ambos usan la
misma lógica (`server/mercadopagoService.js`).

Sin este paso, el botón "Pagar con Mercado Pago" completa la compra en modo
demo (no cobra, pero deja probar todo el flujo).

## 3. Otros datos para personalizar

Todo esto se edita en `.env` (ver `.env.example`):

- `VITE_WHATSAPP_NUMBER`: número de WhatsApp del botón flotante.
- `VITE_ADMIN_PASSWORD`: clave del panel admin mientras no uses Firebase Auth.

Sucursales de retiro: `src/data/sucursales.js`.
Tarifas de envío por zona: `src/services/shipping.js`.

## 4. Despliegue

### GitHub Pages (ya configurado en este repo)

El sitio se publica automáticamente desde la rama `gh-pages` (ver sección
"Despliegue" que te compartió Claude). Si haces cambios y quieres republicar:

```sh
npm run build
# subir el contenido de dist/ a la rama gh-pages
```

### Vercel / Netlify (recomendado si activas el backend de Mercado Pago)

1. Conecta este repositorio de GitHub en https://vercel.com o
   https://netlify.com (cuenta gratis).
2. Comando de build: `npm run build` — carpeta de salida: `dist`.
3. Antes de compilar, define `VITE_BASE_PATH=/` en las variables de entorno
   del hosting (en GitHub Pages se usa `/curso-vue-youtube-jab/`, pero en tu
   propio dominio de Vercel/Netlify debe ser `/`).
4. Agrega ahí también tus variables `VITE_FIREBASE_*`, `VITE_API_URL`,
   `VITE_WHATSAPP_NUMBER`, etc.
5. En Vercel, la carpeta `api/` se despliega sola como backend de Mercado
   Pago — solo agrega la variable `MP_ACCESS_TOKEN` en su configuración.

## Estructura del proyecto

```
src/
  views/            Páginas (inicio, catálogo, producto, carrito, checkout, admin)
  components/       Componentes reutilizables (layout, producto, carrito, admin)
  store/            Estado global (Pinia): carrito, tema, sesión admin
  services/         Acceso a datos: productos, envío, pago, Firebase, auth
  data/             Catálogo demo, regiones/comunas de Chile, sucursales
  styles/           Sistema de temas (paletas + modo claro/oscuro)
server/             Backend de Mercado Pago (Express, opcional)
api/                Misma lógica de Mercado Pago como función serverless (Vercel)
```

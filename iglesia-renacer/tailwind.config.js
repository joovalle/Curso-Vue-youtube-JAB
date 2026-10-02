/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
      colors: {
        // Paleta tomada del logo: magenta -> violeta -> azul
        brand: {
          magenta: '#B5176F',
          violet: '#7A4A9E',
          blue: '#3F5BB8',
          navy: '#1E2447',
        },
        ink: '#1D1D1F',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #B5176F 0%, #7A4A9E 50%, #3F5BB8 100%)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(30,36,71,.04), 0 8px 24px -12px rgba(30,36,71,.12)',
      },
    },
  },
  plugins: [],
}

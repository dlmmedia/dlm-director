import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dlm: {
          accent: '#D4AF37',
          accentHover: '#F4CF47',
          secondary: '#C0C0C0',
          bg: '#050505',
          500: '#3a3a3a',
          600: '#2a2a2a',
          700: '#1a1a1a',
          800: '#0d0d0d',
          900: '#080808',
        },
      },
    },
  },
  plugins: [],
}

export default config

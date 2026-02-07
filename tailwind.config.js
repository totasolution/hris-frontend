/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#107BC7', // Primary Blue
          light: '#6CBBF3',   // Light Blue
          lighter: '#E8F5FF', // Very Light Blue
          dark: '#282828',    // Dark Gray/Black
          white: '#FFFFFF',   // White
        },
        navy: '#0f172a',
        'navy-light': '#1e293b',
        'navy-dark': '#020617',
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', '-apple-system', 'sans-serif'],
        headline: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'bento': '0 0 0 1px rgba(0,0,0,0.03), 0 2px 4px rgba(0,0,0,0.05), 0 12px 24px rgba(0,0,0,0.05)',
        'glass': 'inset 0 0 0 1px rgba(255,255,255,0.1)',
      },
      borderRadius: {
        'card': '1rem',
        'bento': '1.5rem',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
      }
    },
  },
  plugins: [],
}

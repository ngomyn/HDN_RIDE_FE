import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          gold: '#F2B233',
          brown: '#4A2A12',
          white: '#FFFFFF',
          surface: '#F5F5F5',
          muted: '#8F8A84',
        },
        status: {
          success: '#22C55E',
          pending: '#F59E0B',
          danger: '#EF4444',
          running: '#14B8A6',
          complete: '#3B82F6',
        },
      },
      fontFamily: {
        heading: ['"Sora"', 'sans-serif'],
        body: ['"Be Vietnam Pro"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 8px 24px rgba(74, 42, 18, 0.08)',
        soft: '0 4px 14px rgba(74, 42, 18, 0.12)',
      },
      borderRadius: {
        panel: '14px',
      },
    },
  },
  plugins: [forms],
}


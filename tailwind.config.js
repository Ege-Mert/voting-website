/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#4361EE',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        gold: {
          DEFAULT: '#FFD700',
          light: '#FFEB99',
          dark: '#B29700',
        },
        silver: {
          DEFAULT: '#C0C0C0',
          light: '#E6E6E6',
          dark: '#808080',
        },
        bronze: {
          DEFAULT: '#CD7F32',
          light: '#E6BF99',
          dark: '#8C5522',
        },
        success: {
          DEFAULT: '#10B981',
          light: '#A7F3D0',
          dark: '#047857',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FDE68A',
          dark: '#B45309',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#B91C1C',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'star-pulse': 'star-pulse 0.7s ease-in-out',
      },
      keyframes: {
        'star-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
      },
    },
  },
  plugins: [],
};
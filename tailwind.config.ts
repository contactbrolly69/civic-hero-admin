import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        console: {
          bg:          '#0C1526',
          sidebar:     '#070E1C',
          surface:     '#0F1D30',
          elevated:    '#152A3E',
          border:      '#1E3550',
          borderfaint: '#152A3E',
        },
        brand: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          500: '#4B8FE0',
          600: '#2563EB',
          700: '#1D4ED8',
        },
        patch: '#BE5A38',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in':    'fadeIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0', transform: 'translateY(3px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [forms],
};

export default config;

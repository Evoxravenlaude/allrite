import type { Config } from 'tailwindcss';

export default {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F6F6F3',
        ink: '#000000',
        stone: '#DCD9D2',
        ash: '#6E6B65',
        indigo: '#1F2A55',
        mist: '#ECEBE7',
        alert: '#8A1C1C',
      },
      fontFamily: {
        display: ['"Bodoni Moda"', 'Georgia', 'serif'],
        sans: ['"Albert Sans"', 'system-ui', 'sans-serif'],
      },
      maxWidth: { page: '1440px' },
    },
  },
  plugins: [],
} satisfies Config;

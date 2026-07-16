import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#080b0d',
          900: '#101519',
          800: '#172126',
          700: '#233137',
        },
        signal: {
          green: '#b7ff5a',
          amber: '#ffc857',
          red: '#ff6b6b',
          blue: '#7c9cff',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'sans-serif'],
        display: ['var(--font-space-grotesk)', 'sans-serif'],
        mono: ['var(--font-ibm-plex-mono)', 'monospace'],
      },
      boxShadow: { panel: '0 24px 80px rgba(0,0,0,.28)' },
      backgroundImage: {
        grid: 'linear-gradient(rgba(183,255,90,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(183,255,90,.06) 1px, transparent 1px)',
      },
    },
  },
  plugins: [],
};

export default config;

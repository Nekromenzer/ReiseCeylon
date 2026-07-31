import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#0D3B2E',
          hover: '#0A3026',
          deep: '#07271F'
        },
        gold: {
          DEFAULT: '#C49A3A',
          light: '#F6D888'
        },
        ocean: '#1FA6B6',
        ivory: '#FAFAF8',
        sand: '#F4E9D3',
        ink: '#1A1F1D',
        muted: '#5E6863'
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-interface)', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};

export default config;

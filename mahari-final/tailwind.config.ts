import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['var(--font-arabic)', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        sans:   ['var(--font-arabic)', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Mahari brand palette
        teal: {
          50:      '#E6F4F0',
          100:     '#C0E5DA',
          500:     '#1D8A6E',
          600:     '#0B6B55',
          700:     '#085041',
          DEFAULT: '#0B6B55',
          light:   '#E6F4F0',
        },
        amber: {
          50:      '#FEF3E2',
          500:     '#D97706',
          DEFAULT: '#D97706',
          light:   '#FEF3E2',
        },
        coral: {
          50:      '#FDEEE9',
          500:     '#C4513A',
          DEFAULT: '#C4513A',
          light:   '#FDEEE9',
        },
        // Neutral surface tokens
        surface: {
          primary:   '#FFFFFF',
          secondary: '#F7F5F0',
          tertiary:  '#F0EDE7',
        },
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        md:      '0.5rem',
        lg:      '0.75rem',
        xl:      '1rem',
      },
    },
  },
  plugins: [],
};

export default config;

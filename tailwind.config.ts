import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  safelist: ['btn-primary', 'btn-secondary', 'btn-ghost', 'btn-dark', 'btn-sm', 'btn-md', 'btn-lg'],
  theme: {
    extend: {
      colors: {
        crimson: {
          50: '#FEF2F2', 100: '#FEE2E2', 500: '#EF4444', 600: '#DC2626', 700: '#B91C1C', 900: '#450A0A',
        },
        ink: { 950: '#171214', 900: '#211A1C', 700: '#554B4E', 500: '#857A7E' },
        cream: '#FAF8F7',
      },
      fontFamily: {
        sans: ['Manrope Variable', 'Manrope', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        glass: '0 18px 60px -24px rgba(45, 20, 25, 0.20)',
        card: '0 12px 40px -24px rgba(34, 22, 25, 0.18)',
        lift: '0 24px 60px -28px rgba(34, 22, 25, 0.30)',
      },
      backgroundImage: {
        'red-radial': 'radial-gradient(circle at 85% 0%, rgba(220,38,38,.09), transparent 32%)',
      },
    },
  },
  plugins: [],
};
export default config;

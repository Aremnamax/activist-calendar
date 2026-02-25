/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        prof: {
          pine:    '#116062',
          pacific: '#18A7B5',
          green:   '#02ED6D',
          lime:    '#82FD8C',
          mint:    '#DDFFEF',
          black:   '#282326',
        },
      },
      fontFamily: {
        raleway: ['Raleway', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 2px 16px 0 rgba(17,96,98,.08)',
        modal: '0 8px 40px 0 rgba(17,96,98,.18)',
      },
    },
  },
  plugins: [],
}

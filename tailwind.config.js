/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Hind Siliguri', 'sans-serif'],
      },
      colors: {
        primary: '#006a4e',
        secondary: '#f42a41',
        accent: '#f0fdf4',
      }
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#1f3c68',
          dark: '#163056',
          light: '#2d5a8f',
        },
        accent: {
          DEFAULT: '#28a36b',
        },
      },
    },
  },
  plugins: [],
};

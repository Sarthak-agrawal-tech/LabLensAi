/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        mint: {
          DEFAULT: '#00E5A0',
          50: '#e6fff6',
          100: '#b3ffe0',
          200: '#80ffc9',
          300: '#4dffb3',
          400: '#1aff9c',
          500: '#00E5A0',
          600: '#00b880',
          700: '#008a60',
          800: '#005c40',
          900: '#002e20',
        },
        surface: {
          DEFAULT: 'rgba(255, 255, 255, 0.06)',
          hover: 'rgba(255, 255, 255, 0.10)',
          border: 'rgba(255, 255, 255, 0.12)',
        },
      },
    },
  },
  plugins: [],
};

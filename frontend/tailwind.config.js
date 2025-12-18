/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'iot-bg': '#050816',
        'iot-surface': '#0b1220',
        'iot-accent': '#06b6d4', // cyan
        'iot-accent-dark': '#0891b2', // teal
      },
    },
  },
  plugins: [],
}


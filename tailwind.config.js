/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'yanyun': {
          'primary': '#4ade80',
          'bg': '#1a1a2e',
          'card': '#16213e',
          'border': '#0f3460',
        }
      }
    },
  },
  plugins: [],
}
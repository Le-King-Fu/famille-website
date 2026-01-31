import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Couleurs principales du site familial
        bleu: {
          DEFAULT: '#4A90A4',
          50: '#E8F4F7',
          100: '#D1E9EF',
          200: '#A3D3DF',
          300: '#75BDCF',
          400: '#5FA7BF',
          500: '#4A90A4',
          600: '#3B7383',
          700: '#2C5662',
          800: '#1D3941',
          900: '#0E1C21',
        },
        creme: {
          DEFAULT: '#FFF8F0',
          50: '#FFFFFF',
          100: '#FFF8F0',
          200: '#FFEFD9',
          300: '#FFE6C2',
          400: '#FFDDAB',
          500: '#FFD494',
        },
        terracotta: {
          DEFAULT: '#C17767',
          50: '#F9EFED',
          100: '#F3DFDA',
          200: '#E7BFB5',
          300: '#DB9F90',
          400: '#CF8F7B',
          500: '#C17767',
          600: '#A85B4A',
          700: '#7E4438',
          800: '#542D25',
          900: '#2A1713',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};

export default config;

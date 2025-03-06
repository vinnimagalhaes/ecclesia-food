import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5F5',
          100: '#FFE6E6',
          200: '#FFB3B3',
          300: '#FF8080',
          400: '#FF4D4D',
          500: '#EA1D2C',
          600: '#D41829',
          700: '#BF1626',
          800: '#A91422',
          900: '#93121F',
        },
        secondary: {
          50: '#F5F5F5',
          100: '#EBEBEB',
          200: '#D6D6D6',
          300: '#C2C2C2',
          400: '#ADADAD',
          500: '#999999',
          600: '#858585',
          700: '#707070',
          800: '#5C5C5C',
          900: '#474747',
        },
        success: {
          500: '#50C878',
        },
        warning: {
          500: '#FFA500',
        },
        error: {
          500: '#DC2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      spacing: {
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 2px 4px rgba(0, 0, 0, 0.1)',
        'dropdown': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

export default config 
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Windows 11 inspired color palette
        primary: {
          50: '#E6F3FF',
          100: '#CCE7FF',
          200: '#99CFFF',
          300: '#66B7FF',
          400: '#339FFF',
          500: '#0078D4',
          600: '#005A9E',
          700: '#004578',
          800: '#003052',
          900: '#001B2E'
        },
        secondary: {
          50: '#E6F9FF',
          100: '#CCF3FF',
          200: '#99E7FF',
          300: '#66DBFF',
          400: '#33CFFF',
          500: '#00BCF2',
          600: '#008FB4',
          700: '#006B85',
          800: '#004757',
          900: '#002329'
        },
        success: {
          50: '#F3F9F3',
          100: '#E7F3E7',
          200: '#CFE7CF',
          300: '#B7DBB7',
          400: '#9FCF9F',
          500: '#107C10',
          600: '#0C5D0C',
          700: '#094509',
          800: '#062E06',
          900: '#031703'
        },
        warning: {
          50: '#FFF7E6',
          100: '#FFEFCC',
          200: '#FFDF99',
          300: '#FFCF66',
          400: '#FFBF33',
          500: '#FF8C00',
          600: '#CC7000',
          700: '#995400',
          800: '#663800',
          900: '#331C00'
        },
        error: {
          50: '#FDF2F2',
          100: '#FCE4E4',
          200: '#F9C9C9',
          300: '#F5AEAE',
          400: '#F29393',
          500: '#D83B01',
          600: '#AD2F01',
          700: '#822301',
          800: '#561800',
          900: '#2B0C00'
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717'
        }
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      }
    },
  },
  plugins: [],
};
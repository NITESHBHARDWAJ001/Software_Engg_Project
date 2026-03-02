/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7B2CBF',
          dark: '#5A189A',
          light: '#9D4EDD',
          50: '#F5EFFF',
          100: '#E8D5FF',
          200: '#D4ADFF',
          300: '#BC84FF',
          400: '#9D4EDD',
          500: '#7B2CBF',
          600: '#5A189A',
          700: '#410E6F',
          800: '#2D0A4E',
          900: '#1B0530',
        },
        accent: {
          gold: '#D4AF37',
          'gold-light': '#E5C158',
          'gold-dark': '#B8941F',
        },
        background: {
          DEFAULT: '#F9F7FC',
          secondary: '#F3F0F9',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#FAFAFA',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(123, 44, 191, 0.06)',
        'soft-md': '0 4px 12px rgba(123, 44, 191, 0.08)',
        'soft-lg': '0 8px 24px rgba(123, 44, 191, 0.12)',
        'soft-xl': '0 12px 32px rgba(123, 44, 191, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
